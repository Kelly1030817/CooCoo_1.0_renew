import { describe, expect, test } from "bun:test";
import type { AppState, PlannedMeal } from "@coocoo/contracts";
import {
  dateInTimeZone,
  deriveTodayMissions,
  mealsWithRecordedOutcomes,
  todayMealNumberLabel,
} from "./today";

const meal = (
  date: string,
  slot: PlannedMeal["slot"],
  status: PlannedMeal["status"],
): PlannedMeal => ({
  id: crypto.randomUUID(),
  date,
  slot,
  status,
  recipeId: crypto.randomUUID(),
  title: "測試料理",
  servings: 1,
  ingredients: [],
  estimatedCost: 50,
  totalMinutes: 15,
  cookwareTypes: [],
  energyLevel: "normal",
});

describe("Today state derivation", () => {
  test("uses Taipei calendar dates across UTC midnight", () => {
    expect(dateInTimeZone("2026-09-12T16:30:00.000Z")).toBe("2026-09-13");
    expect(dateInTimeZone("2026-09-12T15:59:59.000Z")).toBe("2026-09-12");
  });

  test("returns exactly three event-derived missions", () => {
    const state = {
      expEvents: [
        {
          id: crypto.randomUUID(),
          operationId: crypto.randomUUID(),
          sourceId: crypto.randomUUID(),
          type: "cooking_completed",
          points: 30,
          createdAt: "2026-09-12T16:30:00.000Z",
        },
      ],
      inventory: [{ daysLeft: 2 }],
    } as Pick<AppState, "expEvents" | "inventory">;
    expect(deriveTodayMissions(state, "2026-09-13T04:00:00+08:00")).toEqual([
      expect.objectContaining({ key: "cook_today", done: true, source: "cooking_completed" }),
      expect.objectContaining({
        key: "eat_prepared",
        done: false,
        source: "prepared_serving_eaten",
      }),
      expect.objectContaining({
        key: "use_expiring",
        done: false,
        source: "expiring_ingredient_used",
        hint: 1,
      }),
    ]);
  });

  test("numbers only today's arranged meals", () => {
    const meals = [
      meal("2026-09-12", "dinner", "planned"),
      meal("2026-09-13", "breakfast", "cooked"),
      meal("2026-09-13", "dinner", "planned"),
    ];
    expect(todayMealNumberLabel(meals, "2026-09-13T12:00:00+08:00")).toBe("今日第 2 餐");
  });

  test("combines cooking outcomes with planned meals without changing storage", () => {
    const meals = [meal("2026-09-13", "dinner", "planned")];
    const merged = mealsWithRecordedOutcomes(meals, [
      {
        id: crypto.randomUUID(),
        completionKey: crypto.randomUUID(),
        mealName: "測試料理",
        source: "recipe",
        ingredientCost: 0,
        servingsCooked: 1,
        servingsEaten: 1,
        expAwarded: 30,
        createdAt: "2026-09-13T12:00:00+08:00",
      },
    ]);
    expect(merged[0].status).toBe("cooked");
    expect(meals[0].status).toBe("planned");
  });
});
