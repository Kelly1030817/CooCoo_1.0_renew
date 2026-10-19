import { expect, test } from "@playwright/test";
import { preparePage, seedCompletedOnboarding } from "./helpers/draft";

test("freeform generation sends only pantry items explicitly confirmed for this meal", async ({
  page,
}) => {
  await preparePage(page);
  await seedCompletedOnboarding(page);
  await page.goto("/recipes?tab=compose");
  await expect(page.getByRole("heading", { name: "用冰箱裡的食材自由搭配" })).toBeVisible();
  await expect(page.getByLabel("我有鹽")).not.toBeChecked();
  await expect(page.getByLabel("我有油")).not.toBeChecked();
  await page.getByLabel("我有鹽").check();
  await page.getByLabel("我有油").check();
  await page.locator(".compose-ingredients button").first().click();
  const requestPromise = page.waitForRequest(
    (request) => request.url().endsWith("/api/v1/recipes/generate") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "依備料盤產生料理建議" }).click();
  const body = (await requestPromise).postDataJSON();
  expect(body.confirmedPantry).toEqual(["鹽", "油"]);
  expect(body.ingredientIds).toHaveLength(1);
});
