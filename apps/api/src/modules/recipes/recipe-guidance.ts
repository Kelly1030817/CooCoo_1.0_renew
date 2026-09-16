import type { RecipePackage } from "@coocoo/contracts";

export function hasCompleteRecipeGuidance(recipe: RecipePackage) {
  return recipe.steps.every((step) =>
    Boolean(step.compactInstruction?.trim() && step.guidance?.successCue.trim()),
  );
}
