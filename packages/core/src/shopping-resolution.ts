import type { AppState, MealTask, ShoppingResolutionCommand } from "@coocoo/contracts";
import { createMealTask } from "./meal-task";

export function resolveShoppingTask(
  state: AppState,
  command: ShoppingResolutionCommand,
  now = new Date().toISOString(),
): MealTask {
  const task = (state.mealTasks ?? []).find((t) =>
    command.mealTaskId
      ? t.id === command.mealTaskId
      : command.action === "replan_meal"
        ? t.status === "needs_shopping"
        : t.shortages.some((s) => s.id === command.shortageId),
  );
  if (!task) throw new Error("MEAL_TASK_NOT_FOUND");
  if (command.shortageRevision !== undefined && task.revision !== command.shortageRevision)
    throw new Error("MEAL_TASK_REVISION_CONFLICT");
  if (task.status !== "needs_shopping") throw new Error("MEAL_TASK_NOT_ACTIVE");
  if (command.action === "replan_meal")
    return { ...task, status: "needs_replan", revision: task.revision + 1, updatedAt: now };
  const shortage = task.shortages.find((s) => s.id === command.shortageId);
  if (!shortage || !["needed", "unavailable"].includes(shortage.resolution))
    throw new Error("SHORTAGE_NOT_ACTIVE");
  if (command.action === "replace") {
    const preview = state.recipeAdjustmentPreviews?.find(
      (p) =>
        p.previewId === command.adjustmentPreviewId &&
        p.originalRecipeId === task.recipe.recipeId &&
        p.source === "openrouter" &&
        p.expiresAt > now,
    );
    if (!preview) throw new Error("CONFIRMED_RECIPE_PREVIEW_REQUIRED");
    const next = createMealTask(
      {
        operationId: task.operationId,
        recipePackageId: task.recipe.recipeId,
        currentMeal: task.currentMeal,
        nextMeal: task.nextMeal,
      },
      preview.adjustedRecipe,
      state.inventory,
      state.onboardingProfile?.restrictions ?? [],
      now,
    );
    return {
      ...task,
      recipe: next.recipe,
      shortages: next.shortages,
      status: next.status,
      revision: task.revision + 1,
      updatedAt: now,
    };
  }
  return {
    ...task,
    shortages: task.shortages.map((s) =>
      s.id === shortage.id
        ? { ...s, resolution: command.action === "resume" ? "needed" : "unavailable" }
        : s,
    ),
    revision: task.revision + 1,
    updatedAt: now,
  };
}
