import { expect, test } from "@playwright/test";
import { preparePage } from "./helpers/draft";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("onboarding step 1 aria tree", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByText("Hi！我是你的專屬主廚 CooCoo。")).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "onboarding-step-1" });
});

test("onboarding step 2 aria tree", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByText("Hi！我是你的專屬主廚 CooCoo。")).toBeVisible();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByText("我先確認你真的能用什麼來煮。")).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "onboarding-step-2" });
});

test("onboarding step 3 local preview copy aria tree", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByText("Hi！我是你的專屬主廚 CooCoo。")).toBeVisible();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(page.getByRole("button", { name: "電磁爐" })).toBeVisible();
  await page.getByRole("button", { name: "電磁爐" }).click();
  await page.getByRole("button", { name: "繼續 ›" }).click();
  await expect(
    page.getByText("本機 Preview 使用測試資料；正式環境會先要求登入。"),
  ).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "onboarding-step-3" });
});
