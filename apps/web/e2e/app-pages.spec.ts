import { expect, test } from "@playwright/test";
import { preparePage, seedCompletedOnboarding } from "./helpers/draft";

test.beforeEach(async ({ page }) => {
  await preparePage(page);
  await seedCompletedOnboarding(page);
});

test("bottom nav names stay the five approved pages", async ({ page }) => {
  await page.goto("/today");
  const nav = page.getByRole("navigation", { name: "主要功能" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "今日" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "採買" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "冰箱" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "食譜" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "我的" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "bottom-nav-today" });
});

test("/today aria tree", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByRole("region", { name: "今日任務" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "today" });
});

test("/shopping aria tree", async ({ page }) => {
  await page.goto("/shopping");
  await expect(page.getByRole("heading", { name: "採買清單" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "shopping" });
});

test("/fridge aria tree", async ({ page }) => {
  await page.goto("/fridge");
  await expect(page.getByRole("heading", { name: "食材庫存" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "fridge" });
});

test("/recipes aria tree", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { name: "今天想煮什麼？" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "recipes" });
});

test("/me aria tree", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "我的" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "me" });
});
