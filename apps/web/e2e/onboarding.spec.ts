import { expect, test } from "@playwright/test";
import {
  ONBOARDING_DRAFT_STORAGE_KEY,
  assertNoHorizontalOverflow,
  preparePage,
} from "./helpers/draft";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("onboarding step 1 aria tree", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByText("Hi！我是你的專屬主廚 CooCoo。")).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "onboarding-step-1" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("onboarding step 2 aria tree", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByText("Hi！我是你的專屬主廚 CooCoo。")).toBeVisible();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByText("我先確認你真的能用什麼來煮。")).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "onboarding-step-2" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("onboarding step 3 local preview copy aria tree", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByText("Hi！我是你的專屬主廚 CooCoo。")).toBeVisible();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByRole("button", { name: "電磁爐" })).toBeVisible();
  await page.getByRole("button", { name: "電磁爐" }).click();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByText("本機 Preview 使用測試資料；正式環境會先要求登入。")).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "onboarding-step-3" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("meal slot choice exposes pressed state and selected colors", async ({ page }) => {
  await page.goto("/onboarding");
  const dinner = page.getByRole("button", { name: "晚餐" });
  await expect(dinner).toHaveAttribute("aria-pressed", "true");
  const background = await dinner.evaluate((node) => getComputedStyle(node).backgroundColor);
  const border = await dinner.evaluate((node) => getComputedStyle(node).borderColor);
  expect(background).toBe("rgb(253, 241, 226)");
  expect(border).toBe("rgb(154, 68, 45)");
});

test("onboarding step query opens step 3 without a draft", async ({ page }) => {
  await page.goto("/onboarding?step=3");
  await expect(page.getByText("最後一步，登入並成立你的主廚檔案。")).toBeVisible();
  await expect(page.getByText("Hi！我是你的專屬主廚 CooCoo。")).toHaveCount(0);
});

test("oauth callback error is announced", async ({ page }) => {
  await page.goto(
    "/onboarding?step=3#error_code=otp_expired&error=access_denied&error_description=expired",
  );
  await expect(page.getByRole("alert")).toContainText("這封驗證信已使用或過期");
  const toast = page.getByRole("status");
  await expect(toast).toContainText("這封驗證信已使用或過期");
  const background = await toast.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(background).toBe("rgb(186, 26, 26)");
});

test("draft is saved after continuing to step 2", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByText("我先確認你真的能用什麼來煮。")).toBeVisible();
  const raw = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    ONBOARDING_DRAFT_STORAGE_KEY,
  );
  expect(raw).toBeTruthy();
  expect(JSON.parse(raw ?? "{}")).toMatchObject({ currentStep: 2, status: "draft" });
});

test("step 1 continue is disabled without a meal slot", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "晚餐" }).click();
  await expect(page.getByRole("button", { name: "繼續 ›" })).toBeDisabled();
});

test("completing onboarding keeps inventory flags false", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await page.getByRole("button", { name: "電磁爐" }).click();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByText("本機 Preview 使用測試資料；正式環境會先要求登入。")).toBeVisible();
  const requestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/v1/onboarding") && request.method() === "PUT",
  );
  await page.getByRole("button", { name: "蓋章，成立主廚檔案" }).click();
  await expect(page.getByRole("button", { name: "啟程！進入今日" })).toBeEnabled({ timeout: 3000 });
  await page.getByRole("button", { name: "啟程！進入今日" }).click();
  const request = await requestPromise;
  expect(JSON.parse(request.postData() ?? "{}")).toMatchObject({
    inventoryReviewed: false,
    hasNoInventory: false,
    status: "complete",
  });
});
