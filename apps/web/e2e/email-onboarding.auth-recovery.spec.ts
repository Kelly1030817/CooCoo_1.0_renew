import { expect, test, type Page } from "@playwright/test";
import { createSeedState } from "@coocoo/core";
import {
  completedOnboardingDraft,
  ONBOARDING_DRAFT_STORAGE_KEY,
  assertNoHorizontalOverflow,
} from "./helpers/draft";

async function setup(
  page: Page,
  options: {
    failSave?: boolean;
    failOtp?: boolean;
    rejectInvite?: boolean;
    staleRead?: boolean;
    failNetwork?: boolean;
  } = {},
) {
  let saved = false;
  let writes = 0;
  await page.route("**/auth/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/otp") && options.failNetwork) {
      await route.abort("failed");
      return;
    }
    if (url.includes("/otp")) {
      await route.fulfill({
        status: options.rejectInvite ? 403 : 200,
        json: options.rejectInvite ? { msg: "CooCoo 封閉測試目前只接受受邀 Email" } : {},
      });
    } else if (url.includes("/verify")) {
      if (options.failOtp) {
        options.failOtp = false;
        await route.fulfill({ status: 403, json: { msg: "驗證碼錯誤或已過期，請重試" } });
      } else {
        const user = {
          id: "11111111-1111-4111-8111-111111111111",
          aud: "authenticated",
          email: "chef@example.com",
          app_metadata: { provider: "email" },
          user_metadata: {},
          created_at: "2026-10-14T00:00:00Z",
        };
        await route.fulfill({
          status: 200,
          json: {
            access_token: "test-session-token",
            refresh_token: "test-refresh-token",
            expires_in: 3600,
            token_type: "bearer",
            user,
          },
        });
      }
    } else await route.fulfill({ status: 200, json: {} });
  });
  await page.route("**/api/v1/**", async (route) => {
    if (route.request().url().endsWith("/onboarding")) {
      writes++;
      expect(route.request().headers().authorization).toBe("Bearer test-session-token");
      if (options.failSave) {
        options.failSave = false;
        await route.fulfill({
          status: 503,
          json: {
            error: { code: "SAVE_FAILED", message: "設定未能儲存，請重試", requestId: "test" },
          },
        });
        return;
      }
      const profile = route.request().postDataJSON();
      expect(profile).toMatchObject({
        status: "complete",
        inventoryReviewed: false,
        hasNoInventory: false,
        currentStep: 3,
      });
      saved = true;
      await route.fulfill({ status: 200, json: { data: profile } });
    } else {
      const state = createSeedState();
      if (saved && !options.staleRead) state.onboardingProfile = completedOnboardingDraft;
      else delete state.onboardingProfile;
      await route.fulfill({ status: 200, json: { data: state } });
    }
  });
  return () => writes;
}

async function reachStep3(page: Page) {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await page.getByRole("button", { name: "電磁爐", exact: true }).click();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByRole("button", { name: "成立主廚檔案並開始" })).toBeDisabled();
}
async function sendCode(page: Page) {
  await page.getByLabel("Email", { exact: true }).fill("chef@example.com");
  await page.getByRole("button", { name: "寄送驗證碼", exact: true }).click();
  await expect(page.getByLabel("驗證碼", { exact: true })).toBeVisible();
}
async function verifyCode(page: Page) {
  await page.getByLabel("驗證碼", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "驗證並登入" }).click();
}

test("email verification then one click saves settings, reaches Today, and survives reload", async ({
  page,
}) => {
  const writes = await setup(page);
  await reachStep3(page);
  await expect(page.getByText("使用 Google 登入")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
  await sendCode(page);
  await assertNoHorizontalOverflow(page);
  await verifyCode(page);
  await page.getByRole("button", { name: "成立主廚檔案並開始" }).click();
  await expect(page.getByRole("navigation", { name: "主要功能" })).toBeVisible();
  expect(writes()).toBe(1);
  await page.reload();
  await expect(page.getByRole("navigation", { name: "主要功能" })).toBeVisible();
});

test("wrong code and failed save preserve draft and allow retry", async ({ page }) => {
  const writes = await setup(page, { failSave: true, failOtp: true });
  await reachStep3(page);
  await sendCode(page);
  await verifyCode(page);
  await expect(page.getByRole("alert")).toContainText("驗證碼錯誤");
  await verifyCode(page);
  await page.getByRole("button", { name: "成立主廚檔案並開始" }).click();
  await expect(page.getByRole("alert")).toContainText("設定未能儲存");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).status,
      ONBOARDING_DRAFT_STORAGE_KEY,
    ),
  ).toBe("draft");
  await page.getByRole("button", { name: "成立主廚檔案並開始" }).click();
  await expect(page.getByRole("navigation", { name: "主要功能" })).toBeVisible();
  expect(writes()).toBe(2);
});

test("invite rejection is visible without losing onboarding", async ({ page }) => {
  await setup(page, { rejectInvite: true });
  await reachStep3(page);
  await page.getByLabel("Email", { exact: true }).fill("chef@example.com");
  await page.getByRole("button", { name: "寄送驗證碼", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("只接受受邀 Email");
  await expect(page.getByRole("button", { name: "成立主廚檔案並開始" })).toBeDisabled();
});

test("unconfirmed database read keeps the user on onboarding with draft intact", async ({
  page,
}) => {
  await setup(page, { staleRead: true });
  await reachStep3(page);
  await sendCode(page);
  await verifyCode(page);
  await page.getByRole("button", { name: "成立主廚檔案並開始" }).click();
  await expect(page.getByRole("alert")).toContainText("設定尚未確認儲存");
  await expect(page.getByRole("navigation", { name: "主要功能" })).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).status,
      ONBOARDING_DRAFT_STORAGE_KEY,
    ),
  ).toBe("draft");
});

test("email recovery returns to the app without rewriting onboarding", async ({ page }) => {
  const writes = await setup(page);
  await page.addInitScript(({ key, draft }) => localStorage.setItem(key, JSON.stringify(draft)), {
    key: ONBOARDING_DRAFT_STORAGE_KEY,
    draft: completedOnboardingDraft,
  });
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "登入狀態已失效" })).toBeVisible();
  await sendCode(page);
  await verifyCode(page);
  await expect(page.getByRole("navigation", { name: "主要功能" })).toBeVisible();
  expect(writes()).toBe(0);
});

test("unreachable login service explains failure without claiming a code was sent", async ({
  page,
}) => {
  await setup(page, { failNetwork: true });
  await reachStep3(page);
  await page.getByLabel("Email", { exact: true }).fill("chef@example.com");
  await page.getByRole("button", { name: "寄送驗證碼", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("無法連線到登入服務");
  await expect(page.getByRole("alert")).not.toContainText("Failed to fetch");
  await expect(page.getByLabel("驗證碼", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "成立主廚檔案並開始" })).toBeDisabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).status,
      ONBOARDING_DRAFT_STORAGE_KEY,
    ),
  ).toBe("draft");
});

test("accepts the hosted project's eight-digit code without truncation", async ({ page }) => {
  await setup(page);
  await reachStep3(page);
  await sendCode(page);
  await page.getByLabel("驗證碼", { exact: true }).fill("12345678");
  await expect(page.getByLabel("驗證碼", { exact: true })).toHaveValue("12345678");
  const verification = page.waitForRequest((request) => request.url().includes("/auth/v1/verify"));
  await page.getByRole("button", { name: "驗證並登入" }).click();
  expect((await verification).postDataJSON().token).toBe("12345678");
  await expect(page.getByRole("button", { name: "成立主廚檔案並開始" })).toBeEnabled();
});
