import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ChefRevisitModal } from "./ChefRevisitModal";
import {
  checkEmergencyIngredients,
  LOW_ENERGY_EMERGENCY_RECIPE,
} from "../../features/cooking/emergencyRecipe";

describe("ChefRevisitModal (日常回訪對話流)", () => {
  test("renders initial greeting and three quick decision action buttons without emoji", () => {
    const html = renderToStaticMarkup(
      <ChefRevisitModal
        onClose={() => undefined}
        onSelectLowEnergy={() => undefined}
        inventoryNames={["半盒雞蛋", "青江菜"]}
        weeklyTarget={3}
      />
    );

    expect(html).toContain("主廚 CooCoo 相談室");
    expect(html).toContain("日常隨行");
    expect(html).toContain("半盒雞蛋與青江菜");
    expect(html).toContain("腦力透支！要 12 分鐘低體力出餐");
    expect(html).toContain("這週臨時聚餐多，自煮想少 1 餐");
    expect(html).toContain("今晚純放鬆！登記一次外食");
    // Ensure no emoji
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });

  test("checkEmergencyIngredients correctly identifies covered and missing ingredients", () => {
    // Empty inventory -> all missing
    const emptyResult = checkEmergencyIngredients([]);
    expect(emptyResult.isFullyCovered).toBe(false);
    expect(emptyResult.missing.map((m) => m.name)).toEqual(["雞蛋", "青江菜", "烏龍麵"]);

    // Partial inventory (only eggs) -> missing greens and noodles
    const partialResult = checkEmergencyIngredients(["放牧雞蛋"]);
    expect(partialResult.isFullyCovered).toBe(false);
    expect(partialResult.missing.map((m) => m.name)).toEqual(["青江菜", "烏龍麵"]);

    // Full inventory -> fully covered
    const fullResult = checkEmergencyIngredients(["有機雞蛋", "鮮嫩青江菜", "急凍熟烏龍麵"]);
    expect(fullResult.isFullyCovered).toBe(true);
    expect(fullResult.missing).toHaveLength(0);
  });

  test("LOW_ENERGY_EMERGENCY_RECIPE satisfies contract requirements and is <= 12 minutes", () => {
    expect(LOW_ENERGY_EMERGENCY_RECIPE.totalMinutes).toBeLessThanOrEqual(12);
    expect(LOW_ENERGY_EMERGENCY_RECIPE.cookwareTypes.length).toBeGreaterThan(0);
    expect(LOW_ENERGY_EMERGENCY_RECIPE.steps.length).toBeLessThanOrEqual(6);
    expect(LOW_ENERGY_EMERGENCY_RECIPE.ingredients.length).toBeGreaterThanOrEqual(3);
  });
});

