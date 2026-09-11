import { describe, expect, test } from "bun:test";
import { brandSafeRecipes } from "@coocoo/core";
import { previewRecipeAdjustment } from "./recipe-adjustment.service";

describe("recipe adjustment preview", () => {
  test("scales servings, reports shortages and stays rules-labelled without AI", async () => {
    const result = await previewRecipeAdjustment(brandSafeRecipes[0], { operationId: "11111111-1111-4111-8111-111111111111", servings: 2, replacementRequests: [], context: "" }, [], []);
    expect(result).toMatchObject({ source: "rules", adjustedRecipe: { servings: 2 }, safetyChecks: ["飲食硬限制已重新檢查", "廚具維持原食譜需求", "確認後才建立 MealTask"] });
    expect(result.missing.length).toBeGreaterThan(0);
  });
});
