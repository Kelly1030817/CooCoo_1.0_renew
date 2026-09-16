import { expect, test } from "@playwright/test";
import { preparePage, seedCompletedOnboarding } from "./helpers/draft";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
  await seedCompletedOnboarding(page);
  await page.route("**/auth/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
});

test("auth recovery aria tree when session is missing", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "登入狀態已失效" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 重新登入" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "auth-recovery" });
});
