import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { setupServer } from "msw/node";
import type { OnboardingProfile } from "@coocoo/contracts";

let server: ReturnType<typeof setupServer>;
const api = (path: string, init?: RequestInit) =>
  fetch(`http://localhost/api/v1${path}`, init);
const completedProfile: OnboardingProfile = {
  status: "complete",
  currentStep: 10,
  householdServings: 1,
  cookware: [{ type: "電磁爐", limitations: [] }],
  restrictions: [],
  preferredFlavors: [],
  inventoryReviewed: true,
  hasNoInventory: true,
  dailyMealBudget: 300,
  outsideMealComparisonPrice: 150,
  plannedMealSlots: ["dinner"],
  weeklyHomeCookTarget: 3,
  dreamName: "北海道旅行",
  dreamTargetAmount: 30000,
  completedAt: "2026-08-28T00:00:00.000Z",
};

beforeAll(async () => {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: new URL("http://localhost"),
  });
  const { handlers } = await import("./handlers");
  server = setupServer(...handlers);
  server.listen({ onUnhandledRequest: "error" });
});
beforeEach(async () => {
  await api("/__mock/reset", { method: "POST" });
});
afterAll(() => server.close());

describe("MSW contract adapter", () => {
  test("uses the shared success envelope and deterministic seed", async () => {
    const response = await api("/inventory");
    const body = (await response.json()) as { data: Array<{ name: string }> };
    expect(response.status).toBe(200);
    expect(body.data.map((item) => item.name)).toEqual([
      "酪梨",
      "胡蘿蔔",
      "起司",
      "雞蛋",
      "鮭魚",
      "綜合莓果",
    ]);
  });

  test("rejects an invalid recipe fixture with the public error envelope", async () => {
    const response = await api("/recipes/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ingredientIds: [], style: "japanese" }),
    });
    const body = (await response.json()) as {
      error: { code: string; message: string; requestId: string };
    };
    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof body.error.requestId).toBe("string");
  });

  test("reset restores the fixed seed after a mutation", async () => {
    await api("/inventory/i1", { method: "DELETE" });
    await api("/__mock/reset", { method: "POST" });
    const body = (await (await api("/inventory")).json()) as {
      data: Array<{ id: string }>;
    };
    expect(body.data.some((item) => item.id === "i1")).toBe(true);
  });

  test("connects completed onboarding to the dream dashboard state", async () => {
    const response = await api("/onboarding", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(completedProfile),
    });
    expect(response.status).toBe(200);

    const body = (await (await api("/state")).json()) as {
      data: {
        activeGoal: { name: string; targetAmount: number } | null;
        cookingPlan: { weeklyCookingMeals: number } | null;
      };
    };
    expect(body.data.activeGoal).toEqual(expect.objectContaining({ name: "北海道旅行", targetAmount: 30000 }));
    expect(body.data.cookingPlan?.weeklyCookingMeals).toBe(3);
  });

  test("labels preview shopping advice as rules instead of AI", async () => {
    const response = await api("/shopping/analyze", { method: "POST" });
    const body = (await response.json()) as {
      data: { source: string; notice: string; recommendations: Array<{ item: { id: string }; reason: string }> };
    };
    expect(body.data.source).toBe("rules");
    expect(body.data.notice).toContain("OpenRouter");
    expect(body.data.recommendations[0]?.item.id).toBeTruthy();
  });

  test("serves the today decision and persists one weekly preview plan", async () => {
    const decision = await (await api("/meal-decisions/today?date=2026-09-07&energy=low")).json() as {
      data: { primary: { title: string; steps: unknown[] } | null };
    };
    expect(decision.data.primary?.title).toBeTruthy();
    expect(decision.data.primary?.steps.length).toBeGreaterThan(0);

    const create = () => api("/meal-plans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weekStart: "2026-09-07" }),
    });
    const first = await (await create()).json() as { data: { plan: { id: string; meals: unknown[] } } };
    const second = await (await create()).json() as { data: { plan: { id: string } } };
    expect(first.data.plan.meals).toHaveLength(3);
    expect(second.data.plan.id).toBe(first.data.plan.id);
  });

  test("returns a rich safe recipe package in local preview", async () => {
    const response = await api("/recipes/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ingredientIds: ["i4"], style: "台式" }),
    });
    const body = await response.json() as { data: { source: string; recipe: { ingredients: unknown[]; steps: unknown[] } } };
    expect(response.status).toBe(200);
    expect(body.data.source).toBe("brand_safe");
    expect(body.data.recipe.ingredients.length).toBeGreaterThan(0);
    expect(body.data.recipe.steps.length).toBeGreaterThan(0);
  });
});
