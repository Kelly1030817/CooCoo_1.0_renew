import { Value } from "@sinclair/typebox/value";
import { RecipePackageSchema, type DietaryRestriction, type InventoryItem, type RecipeAdjustmentRequest, type RecipeAdjustmentPreview, type RecipePackage } from "@coocoo/contracts";
import { assertRecipeSafety } from "@coocoo/core";
import { OpenRouterJsonClient } from "../ai/openrouter-json-client";

const normalize = (value: string) => value.trim().toLocaleLowerCase("zh-TW");

function rulesAdjustment(recipe: RecipePackage, request: RecipeAdjustmentRequest) {
  const factor = request.servings / Math.max(1, recipe.servings);
  const replacements = new Map(request.replacementRequests.map((item) => [normalize(item.ingredientKey), item.requestedReplacement.trim()]));
  return {
    ...structuredClone(recipe),
    id: `${recipe.id}:adjusted:${request.operationId}`,
    servings: request.servings,
    ingredients: recipe.ingredients.map((item) => {
      const replacement = replacements.get(normalize(item.ingredientKey));
      return { ...item, ...(replacement ? { ingredientKey: replacement, name: replacement } : {}), quantity: Math.round(item.quantity * factor * 100) / 100 };
    }),
  };
}

export async function previewRecipeAdjustment(recipe: RecipePackage, request: RecipeAdjustmentRequest, inventory: InventoryItem[], restrictions: DietaryRestriction[], client?: OpenRouterJsonClient): Promise<RecipeAdjustmentPreview & { costUsd?: number }> {
  let adjustedRecipe = rulesAdjustment(recipe, request);
  let source: "openrouter" | "rules" = "rules";
  let costUsd = 0;
  if (client) {
    try {
      const result = await client.generate<RecipePackage>({
        schema: RecipePackageSchema,
        schemaName: "coocoo_recipe_adjustment",
        maxTokens: 4096,
        requireZeroDataRetention: true,
        system: "你是 CooCoo 食譜調整器。只能依要求調整份數、替代食材與料理情境；不可放寬過敏、禁食或食安，不可新增使用者沒有的廚具。只輸出繁體中文 JSON。",
        prompt: JSON.stringify({ original: recipe, servings: request.servings, replacements: request.replacementRequests, context: request.context, hardRestrictions: restrictions.filter((item) => item.isHardLimit) }),
      });
      if (!Value.Check(RecipePackageSchema, result.value)) throw new Error("AI_SCHEMA_INVALID");
      adjustedRecipe = { ...result.value, id: `${recipe.id}:adjusted:${request.operationId}`, recipeId: recipe.recipeId, cookwareTypes: recipe.cookwareTypes, servings: request.servings };
      source = "openrouter";
      costUsd = result.costUsd ?? 0;
    } catch {
      source = "rules";
    }
  }
  assertRecipeSafety(adjustedRecipe, restrictions);
  const stock = new Map(inventory.map((item) => [normalize(item.ingredientKey), item.qty]));
  const missing = adjustedRecipe.ingredients.filter((item) => !item.isPantryStaple).flatMap((item) => {
    const quantity = Math.max(0, item.quantity - (stock.get(normalize(item.ingredientKey)) ?? 0));
    return quantity > 0 ? [{ ingredientKey: item.ingredientKey, name: item.name, quantity, unit: item.unit, packages: null, purchaseQuantity: null, estimatedCost: null, priceId: null, priceObservedAt: null }] : [];
  });
  const changes = [
    ...(recipe.servings !== request.servings ? [{ field: "servings", before: `${recipe.servings} 份`, after: `${request.servings} 份`, reason: "依本次用餐人數調整" }] : []),
    ...request.replacementRequests.map((item) => ({ field: item.ingredientKey, before: item.ingredientKey, after: item.requestedReplacement, reason: "使用者要求替代" })),
  ];
  return { previewId: request.operationId, originalRecipeId: recipe.recipeId, adjustedRecipe, changes, missing, safetyChecks: ["飲食硬限制已重新檢查", "廚具維持原食譜需求", "確認後才建立 MealTask"], source, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(), ...(costUsd ? { costUsd } : {}) };
}
