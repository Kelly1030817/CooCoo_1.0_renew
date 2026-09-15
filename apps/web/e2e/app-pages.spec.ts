import { expect, test } from "@playwright/test";
import { preparePage, seedCompletedOnboarding, assertNoHorizontalOverflow } from "./helpers/draft";
import "./global";

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
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("/today aria tree", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByRole("region", { name: "今日任務" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "today" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("/shopping aria tree", async ({ page }) => {
  await page.goto("/shopping");
  await expect(page.getByRole("heading", { name: "採買清單" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "shopping" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("/fridge aria tree", async ({ page }) => {
  await page.goto("/fridge");
  await expect(page.getByRole("heading", { name: "食材庫存" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "fridge" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("/recipes aria tree", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { name: "今天想煮什麼？" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "recipes" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("/me aria tree", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "我的" })).toBeVisible();
  await expect(page.locator("body")).toMatchAriaSnapshot({ name: "me" });
  await assertNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await assertNoHorizontalOverflow(page);
});

test("root path stays on / and shows today", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "今日任務" })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
});

test("invalid /state JSON shows a load error instead of today", async ({ page }) => {
  await page.addInitScript(() => {
    window.__COOCOO_E2E_INVALID_STATE__ = true;
  });
  await page.goto("/today");
  await expect(page.getByRole("alert")).toContainText("資料載入失敗");
  await expect(page.getByRole("region", { name: "今日任務" })).toHaveCount(0);
});

test("switching pages does not flash the full app-state loader", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByRole("region", { name: "今日任務" })).toBeVisible();
  await page.getByRole("link", { name: "採買" }).click();
  await expect(page.getByRole("heading", { name: "採買清單" })).toBeVisible();
  await page.getByRole("link", { name: "今日" }).click();
  await expect(page.getByText("載入 CooCoo 中…")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "今日任務" })).toBeVisible();
});

test("weekly goal input matches loaded app state", async ({ page }) => {
  await page.goto("/me");
  const progress = page.getByText(/\d+ \/ \d+/).first();
  await expect(progress).toBeVisible();
  const text = await progress.innerText();
  const target = text.split("/")[1]?.trim();
  await expect(page.locator('input[name="weekly-goal-target"]')).toHaveValue(target ?? "");
});
