import { describe, expect, test } from "bun:test";
import {
  buildRecipePrompt,
  generateRecipe,
  fitsSelectedIngredients,
  alignRecipeToStock,
} from "./openrouter-recipe.service";
import { brandSafeRecipes, evaluateRecipe } from "@coocoo/core";
import { OpenRouterHttpError } from "../ai/openrouter-json-client";
import { firstMealRecipe } from "../catalog/curated-first-meal";

const reviewed = brandSafeRecipes.find((item) => item.title === "胡麻雞絲拌麵")!;

describe("recipe safety fallback", () => {
  test("uses a matching curated catalog meal without calling AI, and requires confirmed salt", async () => {
    let calls = 0;
    const context = {
      style: "一鍋到底",
      ingredientNames: ["小白菜", "雞蛋"],
      servings: 2,
      restrictions: [],
      cookware: [{ type: "快煮鍋", capacity: null, limitations: [] }],
      budget: null,
      energyLevel: "normal" as const,
      confirmedPantry: ["鹽"],
      recipes: [firstMealRecipe],
      inventory: [
        { ingredientKey: "小白菜", quantity: 250, unit: "克", daysLeft: 7 },
        { ingredientKey: "雞蛋", quantity: 32, unit: "顆", daysLeft: 7 },
      ],
    };
    const client = {
      generate: async () => {
        calls++;
        throw new Error("must not call AI");
      },
    };
    const result = await generateRecipe(context, client);
    expect(calls).toBe(0);
    expect(result).toMatchObject({
      source: "catalog",
      aiAttempted: false,
      recipe: { servings: 2, title: firstMealRecipe.title },
    });
    expect(result.recipe.ingredients.find((i) => i.name === "雞蛋")).toMatchObject({
      quantity: 4,
      isPantryStaple: false,
    });
    expect(result.recipe.ingredients.find((i) => i.name === "鹽")?.isPantryStaple).toBe(true);
    await expect(
      generateRecipe({ ...context, confirmedPantry: [] }, client, false),
    ).rejects.toThrow("RECIPE_AI_FAILED:AI_UNAVAILABLE");
    await expect(
      generateRecipe(
        {
          ...context,
          inventory: [{ ingredientKey: "雞蛋", quantity: 32, unit: "顆", daysLeft: 7 }],
        },
        client,
        false,
      ),
    ).rejects.toThrow("RECIPE_AI_FAILED:AI_UNAVAILABLE");
  });
  test("preserves a confirmed provider key limit when no safe fallback exists", async () => {
    const previous = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test";
    try {
      await expect(
        generateRecipe(
          {
            style: "一鍋到底",
            ingredientNames: ["小白菜", "雞蛋"],
            servings: 2,
            restrictions: [],
            cookware: [{ type: "快煮鍋", capacity: null, limitations: [] }],
            budget: null,
            energyLevel: "normal",
            inventory: [],
          },
          {
            generate: async () => {
              throw new OpenRouterHttpError(403, "KEY_LIMIT_EXCEEDED");
            },
          },
        ),
      ).rejects.toThrow("RECIPE_AI_FAILED:OPENROUTER_403_KEY_LIMIT_EXCEEDED");
    } finally {
      if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = previous;
    }
  });
  test("quick pots and pressure cookers do not satisfy stove-specific recipes", () => {
    const recipe = { ...reviewed, cookwareTypes: ["瓦斯爐"] };
    for (const appliance of ["快煮鍋", "電子壓力鍋", "電鍋"]) {
      expect(
        evaluateRecipe(recipe, {
          restrictions: [],
          cookwareTypes: [appliance],
          dailyBudget: null,
          energyLevel: "normal",
        }).eligible,
      ).toBe(false);
    }
    expect(
      evaluateRecipe(recipe, {
        restrictions: [],
        cookwareTypes: ["電磁爐"],
        dailyBudget: null,
        energyLevel: "normal",
      }).eligible,
    ).toBe(true);
  });
  test("aligns model aliases and units to the actual batch for accurate cooking deductions", () => {
    const recipe = structuredClone(reviewed);
    recipe.ingredients = [
      {
        ...recipe.ingredients[0],
        ingredientKey: "egg",
        name: "雞蛋",
        quantity: 2,
        unit: "顆",
        isPantryStaple: true,
      },
    ];
    const context = {
      style: "家常",
      ingredientNames: ["雞蛋"],
      restrictions: [],
      cookware: [{ type: "電磁爐", capacity: null, limitations: [] }],
      budget: null,
      energyLevel: "normal" as const,
      inventory: [{ ingredientKey: "雞蛋", name: "雞蛋", quantity: 32, unit: "顆", daysLeft: 7 }],
    };
    const aligned = alignRecipeToStock(recipe, context);
    expect(aligned.ingredients[0]).toMatchObject({
      ingredientKey: "雞蛋",
      unit: "顆",
      quantity: 2,
      isPantryStaple: false,
    });
    expect(recipe.ingredients[0].ingredientKey).toBe("egg");
  });
  test("does not offer an unstocked reviewed recipe when AI is unavailable", async () => {
    await expect(
      generateRecipe(
        {
          style: "一鍋到底",
          ingredientNames: ["小白菜", "雞蛋"],
          servings: 2,
          restrictions: [],
          cookware: [{ type: "快煮鍋", capacity: null, limitations: [] }],
          budget: null,
          energyLevel: "normal",
          confirmedPantry: ["鹽", "油"],
          inventory: [
            { ingredientKey: "小白菜", quantity: 250, unit: "克", daysLeft: 7 },
            { ingredientKey: "雞蛋", quantity: 32, unit: "顆", daysLeft: 7 },
          ],
        },
        undefined,
        false,
      ),
    ).rejects.toThrow("RECIPE_AI_FAILED:AI_UNAVAILABLE");
  });
  test("rejects too much stock, unconfirmed seasoning, a different appliance and different servings", () => {
    const context = {
      style: "家常",
      ingredientNames: reviewed.ingredients.map((item) => item.name),
      restrictions: [],
      cookware: [{ type: "電磁爐", capacity: null, limitations: [] }],
      budget: 100,
      energyLevel: "normal" as const,
      inventory: reviewed.ingredients.map((item) => ({ ...item, daysLeft: 7 })),
    };
    expect(fitsSelectedIngredients(reviewed, context)).toBe(true);
    const excessive = structuredClone(reviewed);
    excessive.ingredients[0].quantity *= 2;
    expect(fitsSelectedIngredients(excessive, context)).toBe(false);
    expect(
      fitsSelectedIngredients(reviewed, {
        ...context,
        cookware: [{ type: "快煮鍋", capacity: null, limitations: [] }],
      }),
    ).toBe(false);
    expect(fitsSelectedIngredients(reviewed, { ...context, servings: reviewed.servings + 1 })).toBe(
      false,
    );
    const seasoned = structuredClone(reviewed);
    seasoned.ingredients.push({
      ...seasoned.ingredients[0],
      ingredientKey: "salt",
      name: "鹽",
      quantity: 1,
      unit: "克",
      isPantryStaple: true,
    });
    expect(fitsSelectedIngredients(seasoned, context)).toBe(false);
    expect(fitsSelectedIngredients(seasoned, { ...context, confirmedPantry: ["鹽"] })).toBe(true);
  });
  test("labels a valid generated result as OpenRouter and keeps its billed cost", async () => {
    const previous = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test";
    try {
      const recipe = structuredClone(
        brandSafeRecipes.find((item) => item.title === "胡麻雞絲拌麵")!,
      );
      const result = await generateRecipe(
        {
          style: "家常",
          ingredientNames: reviewed.ingredients.map((item) => item.name),
          restrictions: [],
          cookware: [{ type: "電磁爐", capacity: null, limitations: [] }],
          budget: 100,
          energyLevel: "normal",
          inventory: reviewed.ingredients.map((item) => ({ ...item, daysLeft: 7 })),
        },
        { generate: async () => ({ value: recipe, model: "test-model", costUsd: 0.01 }) },
      );
      expect(result).toMatchObject({
        source: "openrouter",
        aiAttempted: true,
        costUsd: 0.01,
        model: "test-model",
      });
    } finally {
      if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = previous;
    }
  });
  test("uses a complete reviewed package without returning a fake AI result", async () => {
    const previous = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      const result = await generateRecipe({
        style: "家常",
        ingredientNames: reviewed.ingredients.map((item) => item.name),
        restrictions: [
          {
            id: "egg",
            label: "蛋過敏",
            kind: "allergy",
            ingredientKeys: ["蛋"],
            isHardLimit: true,
          },
        ],
        cookware: [{ type: "電磁爐", capacity: null, limitations: [] }],
        budget: 100,
        energyLevel: "normal",
        inventory: reviewed.ingredients.map((item) => ({ ...item, daysLeft: 7 })),
      });
      expect(result.source).toBe("brand_safe");
      expect(result.recipe.title).toBe("胡麻雞絲拌麵");
      expect(result.recipe.cookwareTypes).toEqual(["電磁爐"]);
      expect(result.recipe.ingredients.find((item) => item.ingredientKey === "雞肉")).toMatchObject(
        { quantity: 120, unit: "克" },
      );
      expect(result.recipe.steps[0].timerSeconds).toBe(600);
    } finally {
      if (previous) process.env.OPENROUTER_API_KEY = previous;
    }
  });
  test("rejects incomplete AI dual guidance and falls back to reviewed content", async () => {
    const previous = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test";
    try {
      const recipe = structuredClone(brandSafeRecipes[0]);
      delete recipe.steps[0].compactInstruction;
      const result = await generateRecipe(
        {
          style: "家常",
          excludeTitle: recipe.title,
          ingredientNames: reviewed.ingredients.map((item) => item.name),
          restrictions: [],
          cookware: [{ type: "電磁爐", capacity: null, limitations: [] }],
          budget: 100,
          energyLevel: "normal",
          inventory: reviewed.ingredients.map((item) => ({ ...item, daysLeft: 7 })),
        },
        { generate: async () => ({ value: recipe, model: "test-model", costUsd: 0.01 }) },
      );
      expect(result.source).toBe("brand_safe");
      expect(
        result.recipe.steps.every((step) => step.compactInstruction && step.guidance?.successCue),
      ).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = previous;
    }
  });
  test("fails closed when cookware makes every recipe unavailable", async () => {
    const previous = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      expect(
        generateRecipe({
          style: "家常",
          ingredientNames: reviewed.ingredients.map((item) => item.name),
          restrictions: [],
          cookware: [{ type: "微波爐", capacity: null, limitations: [] }],
          budget: 100,
          energyLevel: "normal",
          inventory: reviewed.ingredients.map((item) => ({ ...item, daysLeft: 7 })),
        }),
      ).rejects.toThrow("RECIPE_AI_FAILED:AI_UNAVAILABLE");
    } finally {
      if (previous) process.env.OPENROUTER_API_KEY = previous;
    }
  });
  test("asks the model to infer custom cookware capabilities conservatively", () => {
    const prompt = buildRecipePrompt({
      style: "家常",
      ingredientNames: ["雞蛋"],
      restrictions: [],
      cookware: [{ type: "多功能快煮鍋", capacity: "1.5L", limitations: ["不可油炸"] }],
      budget: 100,
      energyLevel: "normal",
      inventory: reviewed.ingredients.map((item) => ({ ...item, daysLeft: 7 })),
    });
    expect(prompt).toContain("多功能快煮鍋");
    expect(prompt).toContain("1.5L");
    expect(prompt).toContain("不可油炸");
    expect(prompt).toContain("保守推斷");
    expect(prompt).toContain("不得假設");
  });
  test("asks for one canonical recipe with aligned detailed and compact guidance", () => {
    const prompt = buildRecipePrompt({
      style: "家常",
      ingredientNames: ["雞蛋"],
      restrictions: [],
      cookware: [{ type: "電磁爐", capacity: null, limitations: [] }],
      budget: null,
      energyLevel: "normal",
      inventory: reviewed.ingredients.map((item) => ({ ...item, daysLeft: 7 })),
    });
    expect(prompt).toContain("一份權威料理包");
    expect(prompt).toContain("compactInstruction");
    expect(prompt).toContain("guidance.successCue");
    expect(prompt).toContain("精簡指引不得省略");
  });
});
