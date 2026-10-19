export function normalizeGeneratedRecipe(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const raw = value as Record<string, unknown>;
  const integer = (input: unknown) =>
    typeof input === "number" && Number.isFinite(input) ? Math.round(input) : input;
  const steps = Array.isArray(raw.steps)
    ? raw.steps.map((step, index) => {
        if (!step || typeof step !== "object" || Array.isArray(step)) return step;
        const item = step as Record<string, unknown>,
          timer = integer(item.timerSeconds);
        return {
          ...item,
          id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
          order: index + 1,
          timerSeconds: typeof timer === "number" && timer > 0 ? timer : null,
        };
      })
    : raw.steps;
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((ingredient) =>
        ingredient && typeof ingredient === "object" && !Array.isArray(ingredient)
          ? {
              ...(ingredient as Record<string, unknown>),
              quantity:
                typeof (ingredient as Record<string, unknown>).quantity === "number"
                  ? Number((ingredient as Record<string, unknown>).quantity)
                  : (ingredient as Record<string, unknown>).quantity,
              coveredByInventory: false,
            }
          : ingredient,
      )
    : raw.ingredients;
  const recipe: Record<string, unknown> = {
    ...raw,
    id: typeof raw.id === "string" && raw.id ? raw.id : crypto.randomUUID(),
    recipeId: typeof raw.recipeId === "string" && raw.recipeId ? raw.recipeId : crypto.randomUUID(),
    servings: integer(raw.servings),
    prepMinutes: integer(raw.prepMinutes),
    totalMinutes: integer(raw.totalMinutes),
    estimatedCost: integer(raw.estimatedCost),
    ingredients,
    steps,
    imageUrl: null,
    fallbackImageUrl: "/favicon.svg",
    downloadedAt: null,
    source: "catalog",
  };
  delete recipe.catalogVersionId;
  return recipe;
}
