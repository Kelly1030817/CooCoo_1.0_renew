import { http, HttpResponse } from "msw";
import { FormatRegistry } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { TSchema, Static } from "@sinclair/typebox";
import { brandSafeRecipes, CooCooService, createMealTask, getRescuePlan, parseShoppingText, searchRecipes } from "@coocoo/core";
import { ContractSchemas, type IngredientPrice, type MealPostpone, type MealSlot } from "@coocoo/contracts";
import { createMealPlan, createTodayDecision, refreshAvailability, rescheduleMeal, weekOf, type MealPlanningContext } from "../../../../../api/src/modules/meal-plans/meal-planning";
import { MemoryPlanningRepository } from "../../../../../api/src/modules/meal-plans/memory-planning.repository";
import { recommend } from "../../../../../api/src/modules/catalog/recommendations";
import { BrowserStateRepository } from "./repository";

const mockStarterPrices: IngredientPrice[] = [
  { id: "c1", ingredientKey: "雞肉", name: "冷藏雞胸肉 300g", packageQuantity: 300, unit: "克", price: 90, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c2", ingredientKey: "烏龍麵", name: "讚岐冷凍烏龍麵 600g", packageQuantity: 1, unit: "包", price: 99, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c3", ingredientKey: "蛋", name: "新鮮蛋 10入", packageQuantity: 10, unit: "顆", price: 119, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c4", ingredientKey: "豆腐", name: "傳統料理豆腐 300g", packageQuantity: 300, unit: "克", price: 21, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c5", ingredientKey: "豬肉", name: "台灣豬肉絲 250g", packageQuantity: 250, unit: "克", price: 120, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c6", ingredientKey: "洋蔥", name: "洋蔥 1kg", packageQuantity: 1, unit: "公斤", price: 69, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c7", ingredientKey: "番茄", name: "牛番茄 500g", packageQuantity: 500, unit: "克", price: 125, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c8", ingredientKey: "白米", name: "壽豐七星米 3kg", packageQuantity: 3, unit: "公斤", price: 199, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c9", ingredientKey: "麵條", name: "家常麵條 300g", packageQuantity: 300, unit: "克", price: 24, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c10", ingredientKey: "油", name: "沙拉油 760ml", packageQuantity: 760, unit: "毫升", price: 79, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c11", ingredientKey: "醬油", name: "醬油 500cc", packageQuantity: 500, unit: "毫升", price: 59, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c12", ingredientKey: "味噌", name: "味噌 500g", packageQuantity: 500, unit: "克", price: 57, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c13", ingredientKey: "胡麻醬", name: "胡麻醬 200ml", packageQuantity: 200, unit: "毫升", price: 95, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c14", ingredientKey: "紅蘿蔔", name: "胡蘿蔔 500g", packageQuantity: 500, unit: "克", price: 50, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c15", ingredientKey: "金針菇", name: "金針菇 200g", packageQuantity: 200, unit: "克", price: 15, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c16", ingredientKey: "青蔥", name: "青蔥 150g", packageQuantity: 150, unit: "克", price: 39, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c17", ingredientKey: "馬鈴薯", name: "馬鈴薯 200g", packageQuantity: 200, unit: "克", price: 60, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c18", ingredientKey: "地瓜", name: "地瓜 500g", packageQuantity: 500, unit: "克", price: 129, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c19", ingredientKey: "鮪魚", name: "水煮鮪魚罐頭", packageQuantity: 540, unit: "克", price: 109, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c20", ingredientKey: "牛奶", name: "牛乳 750ml", packageQuantity: 750, unit: "毫升", price: 75, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c21", ingredientKey: "雞腿肉", name: "去骨雞腿 190g", packageQuantity: 190, unit: "克", price: 88, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c22", ingredientKey: "牛肉", name: "牛肉火鍋片 250g", packageQuantity: 250, unit: "克", price: 259, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c23", ingredientKey: "青花菜", name: "青花菜 1kg", packageQuantity: 1, unit: "公斤", price: 109, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c24", ingredientKey: "玉米粒", name: "玉米粒罐頭", packageQuantity: 555, unit: "克", price: 83, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
  { id: "c25", ingredientKey: "蒜頭", name: "鮮蒜仁 120g", packageQuantity: 120, unit: "克", price: 99, source: "mock", observedAt: "2026-09-08T09:35:00+08:00" },
];

if (!FormatRegistry.Has("date-time")) {
  FormatRegistry.Set("date-time", (value) => !Number.isNaN(Date.parse(value)));
}
if (!FormatRegistry.Has("email")) {
  FormatRegistry.Set("email", (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

const service = new CooCooService(new BrowserStateRepository());
let planningRepository = new MemoryPlanningRepository();
let mockRecipeSettings = { purchaseBudget: 100, confirmed: true, version: 1 };
const planningContext = (weekStart: string, energyLevel: "low" | "normal" = "normal"): MealPlanningContext => {
  const state = service.state();
  const profile = state.onboardingProfile;
  const mealSlots = (profile?.plannedMealSlots?.length ? profile.plannedMealSlots : ["dinner"]) as MealSlot[];
  const cookwareTypes = profile?.cookware.map((item) => item.type) ?? state.cookware.flatMap((item) => [item.type, item.name]);
  return {
    weekStart,
    weeklyTarget: profile?.weeklyGoalTarget ?? state.weeklyGoal.target,
    mealSlots,
    servings: profile?.householdServings ?? 1,
    restrictions: profile?.restrictions ?? [],
    cookwareTypes: cookwareTypes.length ? cookwareTypes : ["電磁爐"],
    perMealBudget: null,
    inventory: state.inventory.map((item) => ({ ingredientKey: item.name, name: item.name, daysLeft: item.daysLeft, quantity: item.qty, unit: item.unit })),
    energyLevel,
  };
};
const ok = <T>(data: T, status = 200) =>
  HttpResponse.json({ data }, { status });
const error = (cause: unknown, status = 422) => {
  const code = cause instanceof Error ? cause.message : "UNKNOWN_ERROR";
  const messages: Record<string, string> = {
    ITEM_NOT_FOUND: "找不到食材",
    UNSAFE_ACTION: "不安全食材只能丟棄",
    INGREDIENT_REQUIRED: "請至少選擇一項食材",
    duplicate: "這次料理已經記錄過",
  };
  return HttpResponse.json(
    {
      error: {
        code,
        message: messages[code] || "操作未完成，請稍後再試。",
        requestId: crypto.randomUUID(),
      },
    },
    { status },
  );
};
const validated = <T extends TSchema>(schema: T, value: unknown): Static<T> => {
  if (!Value.Check(schema, value)) throw new Error("VALIDATION_ERROR");
  return value as Static<T>;
};

export const handlers = [
  http.get("/api/v1/state", () => ok(service.state())),
  http.get("/api/v1/session", () => ok(service.state().session)),
  http.post("/api/v1/auth/login", async ({ request }) => {
    try {
      return ok(
        service.login(
          validated(ContractSchemas.LoginRequestSchema, await request.json())
            .email,
        ),
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/auth/logout", () => ok(service.logout())),
  http.put("/api/v1/onboarding", async ({ request }) => {
    try {
      const profile = validated(
        ContractSchemas.OnboardingProfileSchema,
        await request.json(),
      );
      return ok(service.completeOnboarding(profile));
    } catch (e) {
      return error(e);
    }
  }),
  http.patch("/api/v1/weekly-goal", async ({ request }) => {
    try {
      const body = validated(ContractSchemas.WeeklyGoalPatchSchema, await request.json());
      const state = service.state();
      state.weeklyGoal = { ...state.weeklyGoal, ...body, updatedAt: new Date().toISOString() };
      new BrowserStateRepository().write(state);
      return ok(state.weeklyGoal);
    } catch (e) { return error(e); }
  }),
  http.patch("/api/v1/settings/reminders", async ({ request }) => {
    try {
      const body = validated(ContractSchemas.ReminderPreferencesPatchSchema, await request.json());
      const state = service.state();
      state.reminderPreferences = {
        ...(state.reminderPreferences ?? {
          pushEnabled: false,
          quietHoursStart: "21:00",
          quietHoursEnd: "09:00",
          weeklyLimit: 3,
        }),
        ...body,
      };
      new BrowserStateRepository().write(state);
      return ok(state.reminderPreferences);
    } catch (e) { return error(e); }
  }),
  http.get("/api/v1/inventory", () => ok(service.state().inventory)),
  http.post("/api/v1/inventory", async ({ request }) => {
    try {
      return ok(
        service.addInventory(
          validated(
            ContractSchemas.InventoryCreateSchema,
            await request.json(),
          ),
        ),
        201,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.delete("/api/v1/inventory/:id", ({ params }) => {
    service.deleteInventory(String(params.id));
    return ok({ id: params.id });
  }),
  http.get("/api/v1/inventory/rescue-candidates", () =>
    ok(
      service
        .state()
        .inventory.filter((i) => i.chamber === "cold" && i.daysLeft <= 3)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map((item) => ({ item, plan: getRescuePlan(item) })),
    ),
  ),
  http.post("/api/v1/inventory/:id/rescue", async ({ params, request }) => {
    try {
      const body = validated(
        ContractSchemas.RescueCommandSchema,
        await request.json(),
      );
      return ok(service.rescue(String(params.id), body.action, body.foodSafe));
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/recipes/generate", async ({ request }) => {
    try {
      const b = validated(
        ContractSchemas.RecipeGenerateSchema,
        await request.json(),
      );
      const state = service.state();
      if (b.ingredientIds.some((id) => !state.inventory.some((item) => item.id === id))) throw new Error("ITEM_NOT_FOUND");
      const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
      const decision = createTodayDecision(planningContext(weekOf(today)), { date: today, slot: "dinner" });
      const recipe = [decision.primary, ...decision.alternatives].find((item) => item && item.title !== b.excludeTitle);
      if (!recipe) throw new Error("NO_SAFE_RECIPE_AVAILABLE");
      return ok({ recipe: await planningRepository.savePackage("preview", recipe), source: "brand_safe", notice: "本機預覽使用人工檢查過的安全食譜；連接正式 API 後才會呼叫 AI。" });
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/recipes/search", async ({request})=>{try{const body=validated(ContractSchemas.RecipeSearchRequestSchema,await request.json());const state=service.state();return ok({items:searchRecipes(brandSafeRecipes,state.inventory,body.query,body.ingredientKeywords,new Set(state.recipeFavoriteIds??[])),notice:"可靠食譜庫優先；全符合排在部分符合之前。"});}catch(e){return error(e)}}),
  http.put("/api/v1/recipes/:id/favorite",({params})=>{const state=service.state();const id=String(params.id);state.recipeFavoriteIds=Array.from(new Set([...(state.recipeFavoriteIds??[]),id]));new BrowserStateRepository().write(state);return ok({recipeId:id,favorite:true})}),
  http.delete("/api/v1/recipes/:id/favorite",({params})=>{const state=service.state();const id=String(params.id);state.recipeFavoriteIds=(state.recipeFavoriteIds??[]).filter((value)=>value!==id);new BrowserStateRepository().write(state);return ok({recipeId:id,favorite:false})}),
  http.post("/api/v1/recipes/:id/adjustments/preview",async({params,request})=>{try{const body=validated(ContractSchemas.RecipeAdjustmentRequestSchema,await request.json());const recipe=brandSafeRecipes.find((item)=>item.id===params.id||item.recipeId===params.id);if(!recipe)throw new Error("RECIPE_NOT_FOUND");const factor=body.servings/Math.max(1,recipe.servings);const adjustedRecipe={...structuredClone(recipe),id:`${recipe.id}:adjusted:${body.operationId}`,servings:body.servings,ingredients:recipe.ingredients.map((item)=>({...item,quantity:Math.round(item.quantity*factor*100)/100}))};const preview={previewId:body.operationId,originalRecipeId:recipe.recipeId,adjustedRecipe,changes:recipe.servings===body.servings?[]:[{field:"servings",before:`${recipe.servings} 份`,after:`${body.servings} 份`,reason:"依本次用餐人數調整"}],missing:[],safetyChecks:["飲食硬限制已重新檢查","廚具維持原食譜需求","確認後才建立 MealTask"],source:"rules" as const,expiresAt:new Date(Date.now()+30*60_000).toISOString()};const state=service.state();state.recipeAdjustmentPreviews=[...(state.recipeAdjustmentPreviews??[]).filter((item)=>item.previewId!==preview.previewId),preview];new BrowserStateRepository().write(state);return ok(preview);}catch(e){return error(e)}}),
  http.post("/api/v1/meal-tasks",async({request})=>{try{const body=validated(ContractSchemas.MealTaskCreateSchema,await request.json());const state=service.state();if(state.mealTasks?.some((task)=>task.operationId===body.operationId))return ok(state.mealTasks.find((task)=>task.operationId===body.operationId));const baseRecipe=brandSafeRecipes.find((item)=>item.id===body.recipePackageId||item.recipeId===body.recipePackageId);if(!baseRecipe)throw new Error("RECIPE_NOT_FOUND");const preview=body.adjustmentPreviewId?(state.recipeAdjustmentPreviews??[]).find((item)=>item.previewId===body.adjustmentPreviewId&&item.originalRecipeId===baseRecipe.recipeId&&Date.parse(item.expiresAt)>Date.now()):undefined;if(body.adjustmentPreviewId&&!preview)throw new Error("ADJUSTMENT_PREVIEW_INVALID");const task=createMealTask(body,preview?.adjustedRecipe??baseRecipe,state.inventory,state.onboardingProfile?.restrictions??[]);state.mealTasks=[...(state.mealTasks??[]),task];new BrowserStateRepository().write(state);return ok(task,201)}catch(e){return error(e)}}),
  http.post("/api/v1/meal-servings/:id/eat",async({params,request})=>{try{const body=validated(ContractSchemas.PreparedServingEatSchema,await request.json());return ok(service.eatPreparedServing(String(params.id),body.operationId));}catch(e){return error(e)}}),
  http.get("/api/v1/meal-tasks",()=>ok(service.state().mealTasks??[])),
  http.get("/api/v1/chef-chat/sessions",()=>ok((service.state().chefChatSessions??[]).slice(-10).reverse())),
  http.post("/api/v1/chef-chat/sessions",async({request})=>{try{const body=validated(ContractSchemas.ChefChatSendSchema,await request.json());const state=service.state();const today=new Date().toISOString().slice(0,10);const used=(state.chefChatSessions??[]).flatMap((session)=>session.messages).filter((message)=>message.role==="user"&&message.createdAt.startsWith(today)).length;if(used>=30)throw new Error("AI_DAILY_LIMITED");const now=new Date().toISOString();const session={id:crypto.randomUUID(),title:body.message.slice(0,24),source:"rules" as const,createdAt:now,updatedAt:now,messages:[{id:crypto.randomUUID(),role:"user" as const,content:body.message,createdAt:now},{id:crypto.randomUUID(),role:"assistant" as const,content:"AI 目前未連線，我先用規則型協助：從即期食材選一項，再挑 30 分鐘內、符合廚具與飲食限制的食譜。你也可以到食譜頁用多食材搜尋。",createdAt:now}]};state.chefChatSessions=[...(state.chefChatSessions??[]).slice(-9),session];new BrowserStateRepository().write(state);return ok(session,201)}catch(e){return error(e)}}),
  http.delete("/api/v1/chef-chat/sessions/:id",({params})=>{const state=service.state();state.chefChatSessions=(state.chefChatSessions??[]).filter((session)=>session.id!==params.id);new BrowserStateRepository().write(state);return ok({id:params.id})}),
  http.get("/api/v1/meal-decisions/today", ({ request }) => {
    try {
      const url = new URL(request.url);
      const date = url.searchParams.get("date") || new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
      const energy = url.searchParams.get("energy") === "low" ? "low" : "normal";
      const context = planningContext(weekOf(date), energy);
      return ok(createTodayDecision(context, { date, slot: context.mealSlots[0] || "dinner" }));
    } catch (e) {
      return error(e);
    }
  }),
  http.get("/api/v1/meal-plans", async ({ request }) => {
    try {
      const weekStart = new URL(request.url).searchParams.get("weekStart") || weekOf(new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10));
      const saved = await planningRepository.current("preview", weekStart);
      return ok(saved ? { ...saved, ...refreshAvailability(saved.plan, planningContext(weekStart).inventory) } : null);
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/meal-plans", async ({ request }) => {
    try {
      const body = validated(ContractSchemas.MealPlanCreateSchema, await request.json());
      const context = planningContext(body.weekStart);
      const saved = await planningRepository.current("preview", body.weekStart) || await planningRepository.save("preview", createMealPlan(context));
      return ok({ ...saved, ...refreshAvailability(saved.plan, context.inventory) }, 201);
    } catch (e) {
      return error(e);
    }
  }),
  http.patch("/api/v1/meal-plans/meals/:id", async ({ params, request }) => {
    try {
      const body = validated(ContractSchemas.MealPostponeSchema, await request.json()) as MealPostpone;
      const saved = await planningRepository.current("preview", body.weekStart);
      if (!saved) throw new Error("PLANNED_MEAL_NOT_FOUND");
      const context = planningContext(body.weekStart);
      const changed = rescheduleMeal(saved.plan, String(params.id), body, context.mealSlots);
      await planningRepository.reschedule("preview", saved.plan, changed.meals.find((meal) => meal.id === params.id)!, body.expectedUpdatedAt);
      const updated = await planningRepository.current("preview", body.weekStart);
      if (!updated) throw new Error("PLANNED_MEAL_NOT_FOUND");
      return ok({ ...updated, ...refreshAvailability(updated.plan, context.inventory) });
    } catch (e) {
      return error(e, e instanceof Error && e.message === "MEAL_PLAN_CONFLICT" ? 409 : 422);
    }
  }),
  http.post("/api/v1/cooking/outcomes", async ({ request }) => {
    try {
      const result = service.completeCooking(
        validated(
          ContractSchemas.CookingOutcomeCommandSchema,
          await request.json(),
        ),
      );
      return result.accepted
        ? ok(result, 201)
        : error(new Error(result.reason || "COOKING_REJECTED"), 409);
    } catch (e) {
      return error(e);
    }
  }),
  http.get("/api/v1/shopping-items", () => ok(service.state().shoppingItems)),
  http.post("/api/v1/shopping-items", async ({ request }) => {
    try {
      return ok(
        service.saveShopping(
          validated(ContractSchemas.ShoppingWriteSchema, await request.json()),
        ),
        201,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.patch("/api/v1/shopping-items/:id", async ({ params, request }) => {
    try {
      const b = validated(
        ContractSchemas.ShoppingWriteSchema,
        await request.json(),
      );
      return ok(service.saveShopping({ ...b, id: String(params.id) }));
    } catch (e) {
      return error(e);
    }
  }),
  http.delete("/api/v1/shopping-items/:id", ({ params }) => {
    service.deleteShopping(String(params.id));
    return ok({ id: params.id });
  }),
  http.post("/api/v1/shopping/restock", () => ok(service.restock())),
  http.post("/api/v1/shopping/parse", async ({ request }) => {
    try {
      return ok(
        parseShoppingText(
          validated(ContractSchemas.ShoppingParseSchema, await request.json())
            .text,
        ),
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/shopping/analyze", () =>
    ok({
      summary: "優先補足即期餐需要的蔬菜與蛋白質。",
      recommendations: service.state().shoppingItems.slice(0, 3).map((item) => ({
        item,
        action: "buy_now" as const,
        reason: "本機預覽依採買清單與品項分類排序。",
      })),
      estimatedTotal: service.state().shoppingItems.slice(0, 3).reduce((total, item) => total + item.estCost, 0),
      budgetStatus: "unknown" as const,
      source: "rules" as const,
      model: null,
      notice: "本機預覽使用安全採買規則；切換真實 API 後才會呼叫 OpenRouter。",
    }),
  ),
  http.get("/api/v1/settings/fridge", () => ok(service.state().fridgeProfile)),
  http.put("/api/v1/settings/fridge", async ({ request }) => {
    try {
      return ok(
        service.updateSettings({
          fridgeProfile: validated(
            ContractSchemas.FridgeProfileSchema,
            await request.json(),
          ),
        }).fridgeProfile,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.get("/api/v1/settings/cookware", () => ok(service.state().cookware)),
  http.put("/api/v1/settings/cookware", async ({ request }) => {
    try {
      return ok(
        service.updateSettings({
          cookware: validated(
            ContractSchemas.CookwareListSchema,
            await request.json(),
          ),
        }).cookware,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.get("/api/v1/settings/recipes", () => ok(mockRecipeSettings)),
  http.put("/api/v1/settings/recipes", async ({ request }) => {
    try {
      const b = (await request.json()) as { purchaseBudget: number; expectedVersion: number };
      mockRecipeSettings = { purchaseBudget: b.purchaseBudget, confirmed: true, version: (mockRecipeSettings.version || 1) + 1 };
      return ok(mockRecipeSettings);
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/recipes/recommendations", async ({ request }) => {
    try {
      const body = (await request.json()) as { mode: "inventory_only" | "small_purchase"; purchaseBudget: number; allowRepeat?: boolean; energy?: "low" | "normal" };
      const date = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
      const context = planningContext(weekOf(date), body.energy || "normal");
      const result = recommend(brandSafeRecipes, context, { mode: body.mode, purchaseBudget: body.purchaseBudget ?? 100, allowRepeat: body.allowRepeat ?? false, energy: body.energy }, mockStarterPrices, []);
      return ok(result);
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/__mock/reset", () => {
    planningRepository = new MemoryPlanningRepository();
    mockRecipeSettings = { purchaseBudget: 100, confirmed: true, version: 1 };
    return ok(service.reset());
  }),
];
