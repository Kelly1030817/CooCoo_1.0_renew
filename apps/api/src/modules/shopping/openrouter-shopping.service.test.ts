import { describe, expect, test } from "bun:test";
import type { ShoppingAnalysisModel } from "./openrouter-shopping.service";
import { analyzeShopping, buildShoppingPrompt } from "./openrouter-shopping.service";

const context = {
  shoppingItems: [
    { id: "tomato", name: "番茄", category: "produce" as const, qty: 2, unit: "顆", checked: false, status: "needed", estCost: 60 },
    { id: "peanut", name: "花生醬", category: "pantry" as const, qty: 1, unit: "罐", checked: false, status: "needed", estCost: 120 },
    { id: "egg", name: "雞蛋", category: "protein" as const, qty: 1, unit: "盒", checked: true, status: "needed", estCost: 80 },
  ],
  inventory: [],
  restrictions: [{ id: "allergy", label: "花生過敏", kind: "allergy" as const, ingredientKeys: ["花生"], isHardLimit: true }],
  dailyMealBudget: 300,
  plannedMealSlots: ["dinner"],
  weeklyHomeCookTarget: 3,
};

describe("OpenRouter shopping analysis", () => {
  test("sends inventory, restrictions and budget context without changing item ids", () => {
    const prompt = buildShoppingPrompt(context);
    expect(prompt).toContain("花生過敏");
    expect(prompt).toContain("tomato");
    expect(prompt).toContain("900");
  });

  test("keeps hard restrictions blocked even if the model says buy now", async () => {
    const model: ShoppingAnalysisModel = {
      model: "test/model",
      async analyze() {
        return {
          summary: "先補蔬菜",
          priorities: [
            { itemId: "peanut", action: "buy_now", reason: "模型錯誤建議" },
            { itemId: "tomato", action: "buy_now", reason: "補足蔬菜" },
            { itemId: "unknown", action: "buy_now", reason: "不存在的品項" },
            { itemId: "egg", action: "buy_now", reason: "已經勾選" },
          ],
          estimatedTotal: 180,
          budgetStatus: "within_budget",
        };
      },
    };
    const result = await analyzeShopping(context, model);
    expect(result.source).toBe("openrouter");
    expect(result.recommendations.map((item) => item.item.id)).toEqual(["peanut", "tomato"]);
    expect(result.recommendations[0]?.action).toBe("skip");
    expect(result.estimatedTotal).toBe(60);
  });

  test("labels the deterministic fallback instead of pretending it came from AI", async () => {
    const result = await analyzeShopping(context, null);
    expect(result.source).toBe("rules");
    expect(result.notice).toContain("OpenRouter");
    expect(result.recommendations.find((item) => item.item.id === "peanut")?.action).toBe("skip");
  });

  test("retries a transient provider failure exactly once", async () => {
    let attempts = 0;
    const model: ShoppingAnalysisModel = {
      model: "test/model",
      async analyze() {
        attempts += 1;
        if (attempts === 1) throw new Error("OPENROUTER_EMPTY_RESPONSE");
        return {
          summary: "第二次成功",
          priorities: [{ itemId: "tomato", action: "buy_now", reason: "補足蔬菜" }],
          estimatedTotal: 60,
          budgetStatus: "within_budget",
        };
      },
    };
    const result = await analyzeShopping(context, model);
    expect(attempts).toBe(2);
    expect(result.source).toBe("openrouter");
  });

  test("falls back after two failed provider attempts", async () => {
    let attempts = 0;
    const model: ShoppingAnalysisModel = {
      model: "test/model",
      async analyze() {
        attempts += 1;
        throw new Error("OPENROUTER_503");
      },
    };
    const result = await analyzeShopping(context, model);
    expect(attempts).toBe(2);
    expect(result.source).toBe("rules");
    expect(result.notice).toContain("重試後");
  });
});
