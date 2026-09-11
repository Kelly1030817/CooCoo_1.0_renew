import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { setupServer } from "msw/node";
import type { OnboardingProfile } from "@coocoo/contracts";

let server: ReturnType<typeof setupServer>;
const api = (path: string, init?: RequestInit) =>
  fetch(`http://localhost/api/v1${path}`, init);
const completedProfile: OnboardingProfile = {
  status: "complete",
  currentStep: 5,
  cookingExperience: "beginner",
  currentWeeklyCookingFrequency: 2,
  habitBarriers: ["no_ideas"],
  guidanceMode: "detailed",
  householdServings: 1,
  cookware: [{ type: "電磁爐", limitations: [] }],
  restrictions: [],
  preferredFlavors: [],
  availableMinutes: 30,
  inventoryReviewed: true,
  hasNoInventory: true,
  plannedMealSlots: ["dinner"],
  primaryGoalMetric: "cooking_sessions",
  weeklyGoalTarget: 3,
  reminders: { expiringIngredients: true, plannedMeals: true, weeklyRhythm: true, pushEnabled: false, quietHoursStart: "21:00", quietHoursEnd: "09:00", weeklyLimit: 3 },
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

  test("connects completed onboarding to growth and weekly goal state", async () => {
    const response = await api("/onboarding", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(completedProfile),
    });
    expect(response.status).toBe(200);

    const body = (await (await api("/state")).json()) as {
      data: {
        growth: { totalExp: number; rank: { name: string } };
        weeklyGoal: { target: number; metric: string };
      };
    };
    expect(body.data.growth).toMatchObject({ totalExp: 0, rank: { name: "初火學徒" } });
    expect(body.data.weeklyGoal).toMatchObject({ target: 3, metric: "cooking_sessions" });
  });

  test("updates weekly goal when onboarding is replayed", async () => {
    const replayProfile = {
      ...completedProfile,
      primaryGoalMetric: "self_cooked_servings" as const,
      weeklyGoalTarget: 4,
    };
    const response = await api("/onboarding", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(replayProfile),
    });
    expect(response.status).toBe(200);

    const body = (await (await api("/state")).json()) as {
      data: {
        weeklyGoal: { target: number; metric: string };
      };
    };
    expect(body.data.weeklyGoal).toMatchObject({ target: 4, metric: "self_cooked_servings" });
  });

  test("updates each smart reminder category without changing the weekly cap", async () => {
    const response = await api("/settings/reminders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expiringIngredients: false,
        plannedMeals: true,
        weeklyRhythm: false,
      }),
    });
    expect(response.status).toBe(200);

    const body = (await (await api("/state")).json()) as {
      data: {
        reminderPreferences: {
          expiringIngredients: boolean;
          plannedMeals: boolean;
          weeklyRhythm: boolean;
          weeklyLimit: number;
        };
      };
    };
    expect(body.data.reminderPreferences).toMatchObject({
      expiringIngredients: false,
      plannedMeals: true,
      weeklyRhythm: false,
      weeklyLimit: 3,
    });
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
    expect(first.data.plan.meals).toHaveLength(1);
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

  test("serves recipe settings and small purchase recommendations", async () => {
    const settings = await (await api("/settings/recipes")).json() as { data: { purchaseBudget: number } };
    expect(settings.data.purchaseBudget).toBe(100);

    const recsResponse = await api("/recipes/recommendations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "small_purchase", purchaseBudget: 100, allowRepeat: false }),
    });
    expect(recsResponse.status).toBe(200);
    const recs = await recsResponse.json() as {
      data: {
        mode: string;
        eligible: Array<{ recipe: { title: string }; missing: unknown[]; estimatedPurchaseCost: number | null }>;
      };
    };
    expect(recs.data.mode).toBe("small_purchase");
    expect(Array.isArray(recs.data.eligible)).toBe(true);
  });

  test("confirms an adjustment, restocks the MealTask, and closes it after cooking", async () => {
    const recipeId="11111111-1111-4111-8111-111111111111";
    const previewId=crypto.randomUUID();
    const previewResponse=await api(`/recipes/${recipeId}/adjustments/preview`,{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({operationId:previewId,servings:2,replacementRequests:[],context:"兩人晚餐"}),
    });
    expect(previewResponse.status).toBe(200);
    const taskId=crypto.randomUUID();
    const taskResponse=await api("/meal-tasks",{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({operationId:taskId,recipePackageId:recipeId,adjustmentPreviewId:previewId,currentMeal:{date:"2026-09-11",slot:"dinner",servings:2},nextMeal:{strategy:"skip"}}),
    });
    const task=(await taskResponse.json()) as {data:{recipe:{servings:number};status:string;shortages:Array<{name:string;quantity:number;unit:string}>}};
    expect(task.data.recipe.servings).toBe(2);
    expect(task.data.status).toBe("needs_shopping");
    for(const shortage of task.data.shortages){
      const saved=await api("/shopping-items",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:shortage.name,qty:shortage.quantity,unit:shortage.unit,checked:true,status:"MealTask 缺料",estCost:0})});
      expect(saved.status).toBe(201);
    }
    await api("/shopping/restock",{method:"POST"});
    let tasks=(await (await api("/meal-tasks")).json()) as {data:Array<{id:string;status:string}>};
    expect(tasks.data.find((item)=>item.id===taskId)?.status).toBe("ready");
    const cookingResponse=await api("/cooking/outcomes",{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({completionKey:crypto.randomUUID(),mealTaskId:taskId,recipe:{id:crypto.randomUUID(),title:"番茄滑蛋飯",style:"台式",prepTime:"20 分鐘",estCost:"NT$ 72",scientificPrinciple:"充分加熱",ingredients:[],steps:["完成料理"]},ingredientIds:[],ingredientCost:72,trackCost:false,foodSafe:true,vegetables:true,lowOil:false,mindfulSeasoning:false,usedExpiringIngredient:false,completedDoubleMeal:false,servingsCooked:2,servingsEaten:1}),
    });
    expect(cookingResponse.status).toBe(201);
    tasks=(await (await api("/meal-tasks")).json()) as {data:Array<{id:string;status:string}>};
    expect(tasks.data.find((item)=>item.id===taskId)?.status).toBe("complete");
  });

  test("lists only the latest ten chef chats and deletes one", async () => {
    for(let index=0;index<11;index+=1){
      const response=await api("/chef-chat/sessions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({operationId:crypto.randomUUID(),message:`相談 ${index+1}`})});
      expect(response.status).toBe(201);
    }
    const list=(await (await api("/chef-chat/sessions")).json()) as {data:Array<{id:string;title:string}>};
    expect(list.data).toHaveLength(10);
    expect(list.data[0].title).toBe("相談 11");
    const deleted=list.data[0].id;
    expect((await api(`/chef-chat/sessions/${deleted}`,{method:"DELETE"})).status).toBe(200);
    const after=(await (await api("/chef-chat/sessions")).json()) as {data:Array<{id:string}>};
    expect(after.data.some((session)=>session.id===deleted)).toBe(false);
  });
});
