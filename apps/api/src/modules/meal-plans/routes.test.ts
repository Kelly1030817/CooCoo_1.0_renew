import { beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { brandSafeRecipes } from "@coocoo/core";
import { planningRoutes } from "./routes";
import { MemoryPlanningRepository } from "./memory-planning.repository";

const context = {
  weekStart: "2026-09-07",
  weeklyTarget: 3,
  mealSlots: ["dinner"] as const,
  servings: 1,
  restrictions: [],
  cookwareTypes: ["電磁爐"],
  cookware: [{ type: "電磁爐", capacity: null, limitations: [] }],
  perMealBudget: 120,
  inventory: [{ ingredientKey: "番茄", name: "番茄", daysLeft: 1, quantity: 2, unit: "顆" }],
  ingredientIds: { "inventory-1": "番茄" },
};

describe("meal planning HTTP routes", () => {
  let repository: MemoryPlanningRepository;
  let app: { handle(request: Request): Response | Promise<Response> };

  beforeEach(() => {
    repository = new MemoryPlanningRepository();
    app = new Elysia().use(planningRoutes({
      authenticate: async () => ({ id: "user-1" }),
      context: async (_userId, weekStart) => ({ ...context, weekStart }),
      repository,
      generate: async () => ({ recipe: brandSafeRecipes[2], source: "brand_safe", notice: "安全備援" }),
    }));
  });

  test("creates a weekly plan once and returns the same persisted plan on retry", async () => {
    const request = () => app.handle(new Request("http://localhost/api/v1/meal-plans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weekStart: "2026-09-07" }),
    }));
    const first = await (await request()).json() as { data: { plan: { id: string; meals: unknown[] } } };
    const second = await (await request()).json() as { data: { plan: { id: string; meals: unknown[] } } };
    expect(first.data.plan.meals).toHaveLength(3);
    expect(second.data.plan.id).toBe(first.data.plan.id);
  });

  test("returns a complete generated package instead of the legacy recipe shape", async () => {
    const response = await app.handle(new Request("http://localhost/api/v1/recipes/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ingredientIds: ["inventory-1"], style: "台式" }),
    }));
    const body = await response.json() as { data: { source: string; recipe: { cookwareTypes: string[]; ingredients: Array<{ quantity: number; unit: string }>; steps: Array<{ timerSeconds: number | null }> } } };
    expect(body.data.source).toBe("brand_safe");
    expect(body.data.recipe.cookwareTypes).toContain("電磁爐");
    expect(body.data.recipe.ingredients).toContainEqual(expect.objectContaining({ quantity: 120, unit: "克" }));
    expect(body.data.recipe.steps.some((step) => step.timerSeconds === 600)).toBeTrue();
  });
});
