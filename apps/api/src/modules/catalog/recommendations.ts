import type {
  IngredientPrice,
  RecipePackage,
  RecipeRecommendation,
  RecipeRecommendationRequest,
  RecipeRecommendations,
} from "@coocoo/contracts";
import { evaluateRecipe, sameIngredient } from "@coocoo/core";
import type { MealPlanningContext, Stock } from "../meal-plans/meal-planning";

export const normalize = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("zh-TW");
const units: Record<string, [string, number]> = {
  g: ["g", 1],
  克: ["g", 1],
  公克: ["g", 1],
  kg: ["g", 1000],
  公斤: ["g", 1000],
  ml: ["ml", 1],
  毫升: ["ml", 1],
  l: ["ml", 1000],
  公升: ["ml", 1000],
  個: ["piece", 1],
  顆: ["piece", 1],
};
export function measure(quantity: number, unit: string) {
  const [base, factor] = units[normalize(unit)] || [normalize(unit), 1];
  return { quantity: quantity * factor, unit: base, factor };
}
export function recipeFingerprint(recipe: RecipePackage) {
  return (
    recipe.ingredients
      .map((i) => normalize(i.ingredientKey))
      .sort()
      .join("|") +
    "::" +
    recipe.cookwareTypes.map(normalize).sort().join("|") +
    "::" +
    recipe.steps.map((s) => normalize(s.instruction).replace(/[\s，。、]/g, "")).join("|")
  );
}
export function evaluatePurchase(
  recipe: RecipePackage,
  inventory: Stock[],
  prices: IngredientPrice[],
  now: Date,
): RecipeRecommendation {
  const remaining = inventory
    .filter((i) => i.daysLeft >= 0)
    .map((i) => ({ ...i, ...measure(i.quantity ?? 0, i.unit || "") }));
  const missing: RecipeRecommendation["missing"] = [];
  const issues: string[] = [];
  for (const ingredient of recipe.ingredients) {
    const need = measure(ingredient.quantity, ingredient.unit);
    let quantity = need.quantity;
    const matches = remaining.filter((s) => sameIngredient(s, ingredient));
    for (const stock of matches.filter((s) => s.unit === need.unit)) {
      const used = Math.min(quantity, stock.quantity);
      quantity -= used;
      stock.quantity -= used;
    }
    ingredient.coveredByInventory = quantity <= 1e-8;
    if (quantity <= 1e-8) continue;
    if (matches.some((s) => s.unit !== need.unit && s.quantity > 0))
      issues.push(`${ingredient.name}庫存單位待確認`);
    const options = prices.filter(
      (p) =>
        sameIngredient(p, ingredient) &&
        measure(p.packageQuantity, p.unit).unit === need.unit &&
        Date.parse(p.observedAt) <= now.getTime() &&
        now.getTime() - Date.parse(p.observedAt) <= 30 * 86400000,
    );
    const priced = options
      .map((price) => {
        const pack = measure(price.packageQuantity, price.unit);
        const count = Math.ceil((quantity - 1e-8) / pack.quantity);
        return { price, count, cost: count * price.price };
      })
      .sort((a, b) => a.cost - b.cost || a.price.id.localeCompare(b.price.id))[0];
    missing.push({
      ingredientKey: ingredient.ingredientKey,
      name: ingredient.name,
      quantity: quantity / need.factor,
      unit: ingredient.unit,
      packages: priced?.count ?? null,
      purchaseQuantity: priced
        ? (measure(priced.price.packageQuantity, priced.price.unit).quantity * priced.count) /
          need.factor
        : null,
      estimatedCost: priced?.cost ?? null,
      priceId: priced?.price.id ?? null,
      priceObservedAt: priced?.price.observedAt ?? null,
    });
  }
  const estimatedPurchaseCost = missing.every((i) => i.estimatedCost !== null)
    ? missing.reduce((sum, i) => sum + i.estimatedCost!, 0)
    : null;
  return {
    recipe,
    missing,
    estimatedPurchaseCost,
    budgetStatus: estimatedPurchaseCost === null || issues.length ? "unknown" : "within_budget",
    issues,
  };
}
export function recommend(
  recipes: RecipePackage[],
  context: MealPlanningContext,
  request: RecipeRecommendationRequest,
  prices: IngredientPrice[],
  excludedTitles: string[] = [],
  now = new Date(),
): RecipeRecommendations {
  const eligible: RecipeRecommendation[] = [];
  const needsConfirmation: RecipeRecommendation[] = [];
  const seen = new Set<string>();
  const rejected: Array<{ title: string; reasons: string[]; score: number }> = [];
  for (const source of recipes) {
    const title = normalize(source.title);
    if (seen.has(title) || (!request.allowRepeat && excludedTitles.map(normalize).includes(title)))
      continue;
    const factor = context.servings / source.servings;
    const recipe = {
      ...structuredClone(source),
      servings: context.servings,
      estimatedCost: Math.ceil(source.estimatedCost * factor),
      ingredients: source.ingredients.map((i) => ({ ...i, quantity: i.quantity * factor })),
    };
    const eligibility = evaluateRecipe(recipe, {
      restrictions: context.restrictions,
      cookwareTypes: context.cookwareTypes,
      dailyBudget: context.perMealBudget === null ? null : context.perMealBudget * context.servings,
      energyLevel: request.energy || "normal",
    });
    if (!eligibility.eligible) {
      rejected.push({ title: recipe.title, reasons: eligibility.reasons, score: 1000 });
      continue;
    }
    const result = evaluatePurchase(recipe, context.inventory, prices, now);
    const missingReasons = [
      ...result.issues,
      ...result.missing.map((item) => `缺少 ${item.name} ${item.quantity} ${item.unit}`),
    ];
    if (request.mode === "inventory_only" && result.missing.length) {
      rejected.push({ title: recipe.title, reasons: missingReasons, score: result.missing.length });
      continue;
    }
    if (
      request.mode === "small_purchase" &&
      (new Set(result.missing.map((i) => normalize(i.ingredientKey))).size > 2 ||
        (result.estimatedPurchaseCost !== null &&
          result.estimatedPurchaseCost > request.purchaseBudget))
    ) {
      rejected.push({
        title: recipe.title,
        reasons: [
          ...missingReasons,
          ...(result.estimatedPurchaseCost !== null &&
          result.estimatedPurchaseCost > request.purchaseBudget
            ? ["補買金額超過預算"]
            : []),
        ],
        score: result.missing.length,
      });
      continue;
    }
    seen.add(title);
    (result.budgetStatus === "unknown" ? needsConfirmation : eligible).push(result);
  }
  const score = (r: RecipeRecommendation) =>
    r.recipe.ingredients.reduce(
      (sum, i) =>
        sum +
        (context.inventory.some((s) => s.daysLeft >= 0 && s.daysLeft <= 3 && sameIngredient(i, s))
          ? 100
          : 0),
      0,
    ) - (r.estimatedPurchaseCost ?? 0);
  eligible.sort((a, b) => score(b) - score(a) || a.recipe.title.localeCompare(b.recipe.title));
  const noMatchNotice = !context.cookwareTypes.length
    ? "尚未登記廚具，無法確認可用的加熱設備。請到「我的 → 廚具設定」新增並儲存。"
    : !recipes.length
      ? "食譜庫目前沒有已發布的食譜，可到「食譜 → 自由搭配」依現有食材提出料理。"
      : rejected.length
        ? `目前沒有完全符合條件的食譜。${rejected
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((item) => `${item.title}：${item.reasons.join("、")}`)
            .join("；")}。包、盒無法直接換算成克或顆，請確認實際數量；不會假設你已有調味料。`
        : "符合條件的菜色已在近期煮過或安排；可改用自由搭配選擇現有食材。";
  return {
    mode: request.mode,
    eligible,
    needsConfirmation,
    notice: eligible.length
      ? "依已發布食譜、庫存與限制推薦；補買價格為估算。"
      : needsConfirmation.length
        ? `有 ${needsConfirmation.length} 道候選仍有價格或單位待確認。請先盤點庫存與實際數量，或改用自由搭配；確認前不會標示為可直接料理。`
        : noMatchNotice,
  };
}
