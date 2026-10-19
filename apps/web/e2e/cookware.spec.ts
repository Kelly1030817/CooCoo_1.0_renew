import { expect, test } from "@playwright/test";
import { preparePage, seedCompletedOnboarding, assertNoHorizontalOverflow } from "./helpers/draft";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
  await seedCompletedOnboarding(page);
});

test("cookware can be added, edited, saved and read again after reload without changing inventory", async ({
  page,
}) => {
  await page.goto("/me");
  await expect(page.getByRole("button", { name: "廚具設定", exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await fetch("/api/v1/settings/cookware", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "[]",
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "廚具設定", exact: true }).click();
  await expect(page.getByText("尚未登記廚具，請先新增一項。")).toBeVisible();
  const dialog = page.getByRole("dialog", { name: "廚房裝備設定" });
  const existingCount = await dialog.getByLabel(/名稱／類型/).count();
  await dialog.getByRole("button", { name: "新增廚具", exact: true }).click();
  await dialog.getByLabel(`廚具 ${existingCount + 1} 名稱／類型`).fill("快煮鍋");
  await dialog.getByLabel(`廚具 ${existingCount + 1} 容量（選填）`).fill("2 公升");
  const before = await page.evaluate(
    async () => (await (await fetch("/api/v1/state")).json()).data.inventory,
  );
  await dialog.getByRole("button", { name: "儲存廚具", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "廚具設定", exact: true }).click();
  await expect(dialog.getByLabel(`廚具 ${existingCount + 1} 名稱／類型`)).toHaveValue("快煮鍋");
  await expect(dialog.getByLabel(`廚具 ${existingCount + 1} 容量（選填）`)).toHaveValue("2 公升");
  await dialog.getByLabel(`廚具 ${existingCount + 1} 名稱／類型`).fill("電子壓力鍋");
  await dialog.getByLabel(`廚具 ${existingCount + 1} 容量（選填）`).fill("3 公升");
  await assertNoHorizontalOverflow(page);
  await dialog.getByRole("button", { name: "儲存廚具", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "廚具設定", exact: true }).click();
  await expect(dialog.getByLabel(`廚具 ${existingCount + 1} 名稱／類型`)).toHaveValue("電子壓力鍋");
  await expect(dialog.getByLabel(`廚具 ${existingCount + 1} 容量（選填）`)).toHaveValue("3 公升");
  const after = await page.evaluate(async () => (await (await fetch("/api/v1/state")).json()).data);
  expect(after.inventory).toEqual(before);
  expect(
    after.onboardingProfile.cookware.some((item: { type: string }) => item.type === "電子壓力鍋"),
  ).toBe(true);
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await page.getByRole("button", { name: "重新檢視三步主廚檔案設定" }).click();
  const draft = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("coocoo:onboarding-draft:v2") || "null"),
  );
  expect(draft.cookware.some((item: { type: string }) => item.type === "電子壓力鍋")).toBe(true);
});

test("cancel keeps saved cookware and duplicate names are rejected without closing the editor", async ({
  page,
}) => {
  await page.goto("/me");
  await page.getByRole("button", { name: "廚具設定", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "廚房裝備設定" });
  const first = dialog.getByLabel("廚具 1 名稱／類型");
  const original = await first.inputValue();
  await first.fill("未儲存的設備");
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await page.getByRole("button", { name: "廚具設定", exact: true }).click();
  await expect(first).toHaveValue(original);
  const count = await dialog.getByLabel(/名稱／類型/).count();
  await dialog.getByRole("button", { name: "新增廚具", exact: true }).click();
  await dialog.getByLabel(`廚具 ${count + 1} 名稱／類型`).fill(original);
  await dialog.getByRole("button", { name: "儲存廚具", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("廚具名稱重複");
  await expect(dialog).toBeVisible();
});

test("a failed save keeps the cookware draft for retry", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    let failOnce = true;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (failOnce && url.endsWith("/settings/cookware") && init?.method === "PUT") {
        failOnce = false;
        return new Response(
          JSON.stringify({
            error: { code: "SAVE_FAILED", message: "測試：儲存暫時失敗", requestId: "test" },
          }),
          { status: 503, headers: { "content-type": "application/json" } },
        );
      }
      return originalFetch(input, init);
    };
  });
  await page.goto("/me");
  await page.getByRole("button", { name: "廚具設定", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "廚房裝備設定" });
  await dialog.getByLabel("廚具 1 名稱／類型").fill("電子壓力鍋");
  await dialog.getByRole("button", { name: "儲存廚具", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("儲存暫時失敗");
  await expect(dialog.getByLabel("廚具 1 名稱／類型")).toHaveValue("電子壓力鍋");
  await dialog.getByRole("button", { name: "儲存廚具", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
