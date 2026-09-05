import { describe, expect, test } from "bun:test";
import { buildGoalState } from "./goal-state";

describe("cloud goal state", () => {
  test("combines immutable balance adjustments with confirmed cooking savings", () => {
    const state = buildGoalState({
      goal: { id: "goal-1", purpose: "dream", name: "北海道", target_amount: 30000, target_date: null, status: "active", created_at: "2026-09-01T00:00:00.000Z", completed_at: null },
      profile: { daily_meal_budget: 240, outside_meal_price: 150, weekly_home_cook_target: 3, planned_meal_slots: ["lunch", "dinner"] },
      goalEvents: [{ id: "opening", goal_id: "goal-1", type: "opening_balance", amount: 500, created_at: "2026-09-01T00:00:00.000Z" }],
      savingsEvents: [{ id: "meal", goal_id: "goal-1", cooking_session_id: "session-1", confirmed_amount: 70, created_at: "2026-09-02T00:00:00.000Z" }],
    });

    expect(state.goal?.targetAmount).toBe(30000);
    expect(state.cookingPlan).toMatchObject({ homeCookBudget: 120, eatingOutCost: 150, weeklyCookingMeals: 3 });
    expect(state.amountEvents.map((event) => [event.type, event.amount])).toEqual([
      ["opening_balance", 500],
      ["meal_deposit", 70],
    ]);
  });
});
