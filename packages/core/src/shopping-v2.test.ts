import { describe, expect, test } from "bun:test";
import {
  CooCooService,
  createMealTask,
  createSeedState,
  shoppingCategoryFor,
  brandSafeRecipes,
} from "./index";
import type { MealTaskRestockCommand, StateRepository } from "./index";

const repo = (state: ReturnType<typeof createSeedState>) =>
  ({
    value: state,
    read() {
      return this.value;
    },
    write(v: typeof state) {
      this.value = v;
    },
    reset() {
      return this.value;
    },
  }) as StateRepository & { value: typeof state };
const command = (
  state: ReturnType<typeof createSeedState>,
  mealTaskId?: string,
  revision?: number,
): MealTaskRestockCommand => ({
  operationId: `op-${Math.random()}`,
  mealTaskId,
  shortageRevision: revision,
  purchasedItems: state.shoppingItems
    .filter((i) => i.checked)
    .map((i) => ({
      shoppingItemId: i.id,
      shortageId: i.shortageId,
      actualQuantity: i.qty,
      actualUnit: i.unit,
      actualPrice: i.estCost,
      storageLocation: "cold",
      expiresOn: "2026-09-20",
    })),
});

describe("shopping v2 acceptance", () => {
  test("S1 cook_extra calculates shortages for both confirmed servings", () => {
    const recipe = brandSafeRecipes[0];
    const task = createMealTask(
      {
        operationId: "s1",
        recipePackageId: recipe.recipeId,
        currentMeal: { date: "2026-09-13", slot: "dinner", servings: 1 },
        nextMeal: { strategy: "cook_extra", date: "2026-09-14", slot: "lunch", servings: 1 },
      },
      recipe,
      [],
      [],
    );
    expect(task.plannedTotalServings).toBe(2);
    const egg = task.shortages.find((s) => s.ingredientKey === "蛋");
    expect(egg?.quantity).toBe(4);
  });
  test("S2 plan_separately adds no next-meal ingredients", () => {
    const recipe = brandSafeRecipes[0];
    const task = createMealTask(
      {
        operationId: "s2",
        recipePackageId: recipe.recipeId,
        currentMeal: { date: "2026-09-13", slot: "dinner", servings: 1 },
        nextMeal: { strategy: "plan_separately", date: "2026-09-14", slot: "dinner", servings: 2 },
      },
      recipe,
      [],
      [],
    );
    expect(task.plannedTotalServings).toBe(1);
    expect(task.shortages.find((s) => s.ingredientKey === "蛋")?.quantity).toBe(2);
  });
  test("S3 general items never block ready and S10 restock awards no EXP", () => {
    const state = createSeedState();
    const recipe = brandSafeRecipes[0];
    state.inventory = [];
    const task = createMealTask(
      {
        operationId: "s3",
        recipePackageId: recipe.recipeId,
        currentMeal: { date: "2026-09-13", slot: "dinner", servings: 1 },
        nextMeal: { strategy: "skip" },
      },
      recipe,
      [],
      [],
    );
    state.mealTasks = [task];
    state.shoppingItems = [
      ...task.shortages.map((sh) => ({
        id: `item-${sh.id}`,
        name: sh.name,
        category: "produce" as const,
        qty: sh.quantity,
        unit: sh.unit,
        checked: true,
        status: "缺",
        estCost: 40,
        shortageId: sh.id,
        source: "task" as const,
      })),
      {
        id: "general",
        name: "洋蔥",
        category: "produce" as const,
        qty: 2,
        unit: "顆",
        checked: false,
        status: "needed",
        estCost: 30,
      },
    ];
    const r = repo(state);
    const svc = new CooCooService(r);
    const before = r.value.expEvents.length;
    const result = svc.restock(command(r.value, task.id, task.revision));
    expect("mealTaskStatus" in result && result.mealTaskStatus).toBe("ready");
    expect(r.value.shoppingItems.map((i) => i.name)).toEqual(["洋蔥"]);
    expect(r.value.expEvents.length).toBe(before);
  });
  test("S5 replacement still needs buying; S14 unavailable keeps needs_shopping", () => {
    const state = createSeedState();
    const recipe = brandSafeRecipes[0];
    state.inventory = [];
    const task = createMealTask(
      {
        operationId: "s5",
        recipePackageId: recipe.recipeId,
        currentMeal: { date: "2026-09-13", slot: "dinner", servings: 1 },
        nextMeal: { strategy: "skip" },
      },
      recipe,
      [],
      [],
    );
    state.mealTasks = [task];
    const r = repo(state);
    const svc = new CooCooService(r);
    const first = task.shortages[0];
    expect(() =>
      svc.resolveShortage({
        operationId: "s5-r",
        shortageId: first.id,
        action: "replace",
        replacementIngredientKey: "韭菜",
        replacementName: "韭菜",
        replacementQuantity: first.quantity,
        replacementUnit: first.unit,
      }),
    ).toThrow("CONFIRMED_RECIPE_PREVIEW_REQUIRED");
    const kept = svc.resolveShortage({
      operationId: "s5-k",
      shortageId: task.shortages[1].id,
      action: "keep_for_later",
    });
    expect(kept?.status).toBe("needs_shopping");
    expect(kept?.shortages.find((s) => s.resolution === "unavailable")).toBeTruthy();
  });
  test("S6 replan keeps meal slot and servings", () => {
    const state = createSeedState();
    const recipe = brandSafeRecipes[0];
    state.inventory = [];
    const task = createMealTask(
      {
        operationId: "s6",
        recipePackageId: recipe.recipeId,
        currentMeal: { date: "2026-09-13", slot: "dinner", servings: 2 },
        nextMeal: { strategy: "skip" },
      },
      recipe,
      [],
      [],
    );
    state.mealTasks = [task];
    const svc = new CooCooService(repo(state));
    const replanned = svc.resolveShortage({ operationId: "s6-r", action: "replan_meal" });
    expect(replanned?.status).toBe("needs_replan");
    expect(replanned?.currentMeal).toEqual({ date: "2026-09-13", slot: "dinner", servings: 2 });
  });
  test("S13 task items require expiry", () => {
    const state = createSeedState();
    const recipe = brandSafeRecipes[0];
    state.inventory = [];
    const task = createMealTask(
      {
        operationId: "s13",
        recipePackageId: recipe.recipeId,
        currentMeal: { date: "2026-09-13", slot: "dinner", servings: 1 },
        nextMeal: { strategy: "skip" },
      },
      recipe,
      [],
      [],
    );
    state.mealTasks = [task];
    const sh = task.shortages[0];
    state.shoppingItems = [
      {
        id: "i1",
        name: sh.name,
        category: "produce",
        qty: sh.quantity,
        unit: sh.unit,
        checked: true,
        status: "缺",
        estCost: 40,
        shortageId: sh.id,
        source: "task",
      },
    ];
    const svc = new CooCooService(repo(state));
    expect(() =>
      svc.restock({
        operationId: "s13-op",
        mealTaskId: task.id,
        shortageRevision: task.revision,
        purchasedItems: [
          {
            shoppingItemId: "i1",
            shortageId: sh.id,
            actualQuantity: sh.quantity,
            actualUnit: sh.unit,
            storageLocation: "cold",
          },
        ],
      }),
    ).toThrow("EXPIRY_REQUIRED");
  });
  test("S16 command restock without a task still intakes", () => {
    const state = createSeedState();
    state.mealTasks = [];
    state.shoppingItems = [
      {
        id: "g1",
        name: "洋蔥",
        category: "produce",
        qty: 2,
        unit: "顆",
        checked: true,
        status: "needed",
        estCost: 30,
      },
    ];
    const svc = new CooCooService(repo(state));
    const result = svc.restock({
      operationId: "s16-op",
      purchasedItems: [
        {
          shoppingItemId: "g1",
          actualQuantity: 2,
          actualUnit: "顆",
          storageLocation: "pantry",
          expiresOn: "2026-09-30",
        },
      ],
    });
    expect("mealTaskStatus" in result && result.mealTaskStatus).toBeUndefined();
    expect("count" in result && result.count).toBe(1);
  });
  test("S17 four categories map from shared detection", () => {
    expect(shoppingCategoryFor("醬油")).toBe("pantry");
    expect(shoppingCategoryFor("烏龍麵")).toBe("pantry");
    expect(shoppingCategoryFor("雞腿肉")).toBe("protein");
    expect(shoppingCategoryFor("青江菜")).toBe("produce");
    expect(shoppingCategoryFor("保鮮袋")).toBe("other");
  });
});
