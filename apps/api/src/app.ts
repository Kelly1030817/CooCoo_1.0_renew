import { syncRoutes } from "./modules/sync/routes";
import { CatalogRepository } from './modules/catalog/repository';
import { catalogRoutes } from './modules/catalog/routes';
import { recommend } from './modules/catalog/recommendations';
import { Elysia } from "elysia";
import { CooCooService, getRescuePlan, parseShoppingText } from "@coocoo/core";
import type { GoalDraft, InventoryItem } from "@coocoo/contracts";
import { ContractSchemas } from "@coocoo/contracts";
import { MemoryStateRepository } from "./shared/infrastructure/memory-state.repository";
import { authenticateRequest, getSupabaseAdmin } from "./shared/infrastructure/supabase";
import { GeminiReceiptModel, recognizeReceipt } from "./modules/receipts/gemini-receipt-recognizer";
import { SupabaseReceiptRepository } from "./modules/receipts/supabase-receipt.repository";
import { SupabaseOnboardingRepository } from "./modules/onboarding/supabase-onboarding.repository";
import type { OnboardingProfile } from "@coocoo/contracts";
import { SupabaseInviteRepository } from "./modules/admin/supabase-invite.repository";
import { SupabaseAiUsageRepository } from "./modules/ai/supabase-ai-usage.repository";
import { SupabaseInventoryRepository } from "./modules/inventory/supabase-inventory.repository";
import { SupabaseShoppingRepository } from "./modules/shopping/supabase-shopping.repository";
import { SupabaseCookingRepository } from "./modules/cooking/supabase-cooking.repository";
import { SupabaseAccountRepository } from "./modules/account/supabase-account.repository";
import { SupabaseSettingsRepository } from "./modules/settings/supabase-settings.repository";
import { analyzeShopping } from "./modules/shopping/openrouter-shopping.service";
import { SupabaseGoalRepository } from "./modules/goals/supabase-goal.repository";
import { planningRoutes } from "./modules/meal-plans/routes";
import { cloudPlanningContext } from "./modules/meal-plans/context";
import { SupabaseMealPlanRepository } from "./modules/meal-plans/supabase-meal-plan.repository";
import { MemoryPlanningRepository } from "./modules/meal-plans/memory-planning.repository";
import { weekOf, taipeiDate } from "./modules/meal-plans/meal-planning";

const requestId = () => crypto.randomUUID();
const ok = <T>(data: T) => ({ data });
const fail = (error: unknown) => {
  const code = error instanceof Error ? error.message : typeof error==="object"&&error&&"message" in error?String(error.message):"UNKNOWN_ERROR";
  const messages: Record<string, string> = {
    GOAL_NOT_FOUND: "找不到主要目標",
    ITEM_NOT_FOUND: "找不到食材",
    UNSAFE_ACTION: "不安全食材只能丟棄",
    INGREDIENT_REQUIRED: "請至少選擇一項食材",
    AI_RATE_LIMITED: "AI 使用次數已達本小時上限，請稍後再試。",
    AUTH_REQUIRED: "請先登入再使用這項功能。",
    AUTH_INVALID: "登入狀態已失效，請重新登入。",
    INVALID_GOAL_TARGET: "目標金額必須大於 0 元。",
    ONBOARDING_REQUIRED: "請先完成主廚相談室設定。",
    RECIPE_WITHDRAWN: "這份食譜已暫停提供，請改選其他料理。",
    PRICE_CONFIRMATION_REQUIRED: "參考價格或庫存尚待確認，暫不能加入這份補買方案。",
    PRICE_SOURCE_REQUIRED: "參考價格需附 https 網址或 receipt: 開頭的憑證說明。",
    PRICE_DATE_INVALID: "查價日期不可晚於今天。",
    RECOMMENDATION_CHANGED: "庫存或食譜已更新，請重新選擇。",
    SETTINGS_CONFLICT: "設定已在其他裝置更新，請重新載入後確認。",
    OWNER_ROLE_REQUIRED: "此功能僅限管理者。",
    NO_SAFE_RECIPE_AVAILABLE: "目前沒有符合飲食限制、廚具與預算的餐點。",
    PLANNED_MEAL_NOT_FOUND: "找不到這份預計餐點。",
    MEAL_NOT_EDITABLE: "這份餐點已完成或取消，無法再調整。",
    MEAL_SLOT_OCCUPIED: "這個時段已經安排其他餐點。",
    MEAL_PLAN_CONFLICT: "餐單已在其他裝置更新，請重新整理後再操作。",
    INVALID_DATE: "日期格式不正確。",
    WEEK_START_MUST_BE_MONDAY: "一週餐單必須從星期一開始。",
    WEEKLY_TARGET_EXCEEDS_SLOTS: "預計自煮餐數超過本週可安排的餐期。",
  };
  return {
    error: {
      code,
      message: messages[code] || "操作未完成，請稍後再試。",
      requestId: requestId(),
    },
  };
};

export const repository = new MemoryStateRepository();
export const service = new CooCooService(repository);
const receiptRepository = new SupabaseReceiptRepository();
const onboardingRepository = new SupabaseOnboardingRepository();
const inviteRepository = new SupabaseInviteRepository();
const aiUsageRepository = new SupabaseAiUsageRepository();
const inventoryRepository = new SupabaseInventoryRepository();
const shoppingRepository = new SupabaseShoppingRepository();
const cookingRepository = new SupabaseCookingRepository();
const accountRepository = new SupabaseAccountRepository();
const settingsRepository = new SupabaseSettingsRepository();
const goalRepository = new SupabaseGoalRepository();
const cloudDataEnabled = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
const catalogRepository=new CatalogRepository();
const catalogContext:typeof cloudPlanningContext=async(user,week)=>{const [c,recipes,prices,settings,excluded]=await Promise.all([cloudPlanningContext(user,week),catalogRepository.published(),catalogRepository.prices(),catalogRepository.settings(user),catalogRepository.excluded(user)]);const inventoryOnly=recommend(recipes,c,{mode:"inventory_only",purchaseBudget:settings.purchaseBudget},prices,excluded);const withPurchase=recommend(recipes,c,{mode:"small_purchase",purchaseBudget:settings.purchaseBudget},prices,excluded);return {...c,strictCatalog:true,recipes:inventoryOnly.eligible.map(r=>r.recipe),purchaseCandidates:[...withPurchase.eligible,...withPurchase.needsConfirmation].filter(item=>item.missing.length).slice(0,3)}};
const mealPlanRepository=cloudDataEnabled?new SupabaseMealPlanRepository():new MemoryPlanningRepository();
const previewPlanningContext=async(_userId:string,weekStart:string)=>{const state=service.state();const profile=state.onboardingProfile;if(!profile)throw new Error("ONBOARDING_REQUIRED");return{weekStart,weeklyTarget:profile.weeklyHomeCookTarget,mealSlots:profile.plannedMealSlots,servings:profile.householdServings,restrictions:profile.restrictions,cookware:profile.cookware.map(item=>({type:item.type,capacity:item.capacity||null,limitations:item.limitations})),cookwareTypes:profile.cookware.map(item=>item.type),perMealBudget:Math.floor(profile.dailyMealBudget/Math.max(1,profile.plannedMealSlots.length)),inventory:state.inventory.map(item=>({ingredientKey:item.name,name:item.name,quantity:item.qty,unit:item.unit,daysLeft:item.daysLeft})),ingredientIds:Object.fromEntries(state.inventory.map(item=>[item.id,item.name]))}};

async function integratedState(authorization?:string){
  const user=await authenticateRequest(authorization);const base=service.state();
  const [inventory,shopping,onboarding,goalState,servingsResult,savingsResult,fridge,mealPlan]=await Promise.all([inventoryRepository.list(user.id),shoppingRepository.list(user.id),onboardingRepository.read(user.id),goalRepository.read(user.id),getSupabaseAdmin().from("meal_servings").select("*").eq("user_id",user.id),getSupabaseAdmin().from("savings_events").select("*").eq("user_id",user.id).order("created_at"),settingsRepository.fridge(user.id),mealPlanRepository.current(user.id,weekOf(taipeiDate()))]);
  if(servingsResult.error)throw servingsResult.error;if(savingsResult.error)throw savingsResult.error;
  const mealServings=(servingsResult.data||[]).map(row=>({id:row.id,cookingSessionId:row.cooking_session_id,status:row.status,eatenAt:row.eaten_at,vegetableKeys:row.vegetable_keys||[]}));const eaten=mealServings.filter(item=>item.status==="eaten");const weeklyCompletions=eaten.reduce<Record<string,number>>((counts,item)=>{if(!item.eatenAt)return counts;const date=new Date(item.eatenAt);const day=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()-day+1);const key=date.toISOString().slice(0,10);counts[key]=(counts[key]||0)+1;return counts},{});const savingsEvents=(savingsResult.data||[]).map(row=>({id:row.id,cookingSessionId:row.cooking_session_id,outsideMealPrice:row.outside_meal_price,actualIngredientCost:row.actual_ingredient_cost,confirmedAmount:row.confirmed_amount,createdAt:row.created_at}));
  return {...base,session:{user:{id:user.id,email:user.email,displayName:user.email.split("@")[0]}},inventory,shoppingItems:shopping,fridgeProfile:fridge,cookware:(onboarding.cookware||[]).map((item:{id:string;type:string;capacity:string|null})=>({id:item.id,type:item.type,name:item.type,brand:"",model:"",capacity:item.capacity||"",wattage:0})),activeGoal:goalState.goal,amountEvents:goalState.amountEvents,savingsEvents,mealServings,mealPlan:mealPlan?.plan,recipePackages:mealPlan?.packages,habitProgress:{totalMeals:eaten.length,weeklyCompletions,events:eaten.filter(item=>item.eatenAt).map(item=>({outcomeId:item.cookingSessionId,createdAt:item.eatenAt!,weekKey:Object.keys(weeklyCompletions).find(key=>item.eatenAt!.slice(0,10)>=key)||item.eatenAt!.slice(0,10)}))},cookingPlan:goalState.cookingPlan};
}

export const app = new Elysia({ name: "coocoo-api" })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: { code: "VALIDATION_ERROR", message: error.message, requestId: requestId() } };
    }
    const errorCode = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (errorCode === "AUTH_REQUIRED" || errorCode === "AUTH_INVALID") set.status = 401;
    else if(errorCode === "OWNER_ROLE_REQUIRED")set.status=403;
    else if(errorCode === "SETTINGS_CONFLICT")set.status=409;
    else if(errorCode === "MEAL_PLAN_CONFLICT" || errorCode === "MEAL_SLOT_OCCUPIED")set.status=409;
    else set.status=422;
    return fail(error);
  })
  .use(planningRoutes({authenticate:cloudDataEnabled?authenticateRequest:async()=>({id:"preview"}),context:cloudDataEnabled?catalogContext:previewPlanningContext,catalog:cloudDataEnabled?catalogRepository:undefined,repository:mealPlanRepository,beforeGenerate:cloudDataEnabled?async userId=>{await aiUsageRepository.assertWithinLimit(userId,"recipe_generation");if(process.env.GEMINI_API_KEY)await aiUsageRepository.record(userId,"recipe_generation","started",0)}:undefined,afterGenerate:cloudDataEnabled&&process.env.GEMINI_API_KEY?async(userId,source)=>aiUsageRepository.record(userId,"recipe_generation",source==="gemini"?"succeeded":"failed",0):undefined}))
  .use(cloudDataEnabled?syncRoutes():new Elysia())
  .use(cloudDataEnabled?catalogRoutes(authenticateRequest,cloudPlanningContext,catalogRepository):new Elysia())
  .get("/api/v1/health", () => ok({ status: "ok" }))
  .get("/api/v1/state", async ({headers}) => ok(cloudDataEnabled?await integratedState(headers.authorization):service.state()))
  .get("/api/v1/session", () => ok(service.state().session))
  .post("/api/v1/auth/login", ({ body }) => ok(service.login(body.email)), {
    body: ContractSchemas.LoginRequestSchema,
  })
  .post("/api/v1/auth/logout", () => ok(service.logout()))
  .get("/api/v1/goals/current", async ({headers}) => {
    if(cloudDataEnabled){const state=await integratedState(headers.authorization);return ok({goal:state.activeGoal,cookingPlan:state.cookingPlan,amountEvents:state.amountEvents,habitProgress:state.habitProgress,healthAssets:state.healthAssets})}
    const s = service.state();
    return ok({
      goal: s.activeGoal,
      cookingPlan: s.cookingPlan,
      amountEvents: s.amountEvents,
      habitProgress: s.habitProgress,
      healthAssets: s.healthAssets,
    });
  })
  .post(
    "/api/v1/goals",
    async ({ body, set,headers }) => {
      if(cloudDataEnabled){try{return ok(await goalRepository.create((await authenticateRequest(headers.authorization)).id,body as GoalDraft))}catch(e){set.status=422;return fail(e)}}
      const result = service.createGoal(body as GoalDraft);
      if (!result.valid) {
        set.status = 422;
        return {
          error: {
            code: "VALIDATION_ERROR",
            message: result.errors.join(" "),
            requestId: requestId(),
          },
        };
      }
      return ok(result);
    },
    { body: ContractSchemas.GoalDraftSchema },
  )
  .patch(
    "/api/v1/goals/:id",
    async ({ body, set,headers,params }) => {
      if(cloudDataEnabled){try{return ok(await goalRepository.update((await authenticateRequest(headers.authorization)).id,params.id,body as Record<string,unknown>))}catch(e){set.status=422;return fail(e)}}
      try {
        return ok(service.adjustGoal(body as never));
      } catch (e) {
        set.status = 404;
        return fail(e);
      }
    },
    { body: ContractSchemas.GoalPatchSchema },
  )
  .post(
    "/api/v1/goals/:id/amount-events",
    async ({ body, set,headers,params }) => {
      if(cloudDataEnabled){try{return ok(await goalRepository.update((await authenticateRequest(headers.authorization)).id,params.id,{desiredSaved:Number(body.desiredSaved)}))}catch(e){set.status=422;return fail(e)}}
      try {
        return ok(
          service.adjustGoal({ desiredSaved: Number(body.desiredSaved) }),
        );
      } catch (e) {
        set.status = 404;
        return fail(e);
      }
    },
    { body: ContractSchemas.AmountEventCommandSchema },
  )
  .get("/api/v1/inventory", async ({headers}) => cloudDataEnabled?ok(await inventoryRepository.list((await authenticateRequest(headers.authorization)).id)):ok(service.state().inventory))
  .post(
    "/api/v1/inventory",
    async ({ body,headers }) => cloudDataEnabled?ok(await inventoryRepository.create((await authenticateRequest(headers.authorization)).id,body as Omit<InventoryItem,"id">)):ok(service.addInventory(body as Omit<InventoryItem, "id">)),
    { body: ContractSchemas.InventoryCreateSchema },
  )
  .delete("/api/v1/inventory/:id", async ({ params,headers }) => {
    if(cloudDataEnabled)return ok(await inventoryRepository.delete((await authenticateRequest(headers.authorization)).id,params.id));
    service.deleteInventory(params.id);
    return ok({ id: params.id });
  })
  .get("/api/v1/inventory/rescue-candidates", async ({headers}) =>
    cloudDataEnabled?ok((await inventoryRepository.list((await authenticateRequest(headers.authorization)).id)).filter(i=>i.chamber==="cold"&&i.daysLeft<=3).sort((a,b)=>a.daysLeft-b.daysLeft).map(item=>({item,plan:getRescuePlan(item)}))):ok(
      service
        .state()
        .inventory.filter((i) => i.chamber === "cold" && i.daysLeft <= 3)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map((item) => ({ item, plan: getRescuePlan(item) })),
    ),
  )
  .post(
    "/api/v1/inventory/:id/rescue",
    async ({ params, body, set,headers }) => {
      try {
        if(cloudDataEnabled)return ok(await inventoryRepository.rescue((await authenticateRequest(headers.authorization)).id,params.id,body.action,body.foodSafe));
        return ok(service.rescue(params.id, body.action, body.foodSafe));
      } catch (e) {
        set.status = 422;
        return fail(e);
      }
    },
    { body: ContractSchemas.RescueCommandSchema },
  )
  .post(
    "/api/v1/cooking/outcomes",
    async ({ body, set,headers }) => {
      if(cloudDataEnabled){try{return ok(await cookingRepository.complete((await authenticateRequest(headers.authorization)).id,body))}catch(error){set.status=409;return fail(error)}}
      const result = service.completeCooking(body);
      if (!result.accepted) {
        set.status = 409;
        return fail(new Error(result.reason || "COOKING_REJECTED"));
      }
      return ok(result);
    },
    { body: ContractSchemas.CookingOutcomeCommandSchema },
  )
  .get("/api/v1/shopping-items", async ({headers}) => cloudDataEnabled?ok(await shoppingRepository.list((await authenticateRequest(headers.authorization)).id)):ok(service.state().shoppingItems))
  .post(
    "/api/v1/shopping-items",
    async ({ body,headers }) => cloudDataEnabled?ok(await shoppingRepository.save((await authenticateRequest(headers.authorization)).id,body)):ok(service.saveShopping(body)),
    { body: ContractSchemas.ShoppingWriteSchema },
  )
  .patch(
    "/api/v1/shopping-items/:id",
    async ({ params, body,headers }) => cloudDataEnabled?ok(await shoppingRepository.save((await authenticateRequest(headers.authorization)).id,{...body,id:params.id})):ok(service.saveShopping({ ...body, id: params.id })),
    { body: ContractSchemas.ShoppingWriteSchema },
  )
  .delete("/api/v1/shopping-items/:id", async ({ params,headers }) => {
    if(cloudDataEnabled)return ok(await shoppingRepository.delete((await authenticateRequest(headers.authorization)).id,params.id));
    service.deleteShopping(params.id);
    return ok({ id: params.id });
  })
  .post("/api/v1/shopping/restock", async ({headers}) => cloudDataEnabled?ok(await shoppingRepository.restock((await authenticateRequest(headers.authorization)).id)):ok(service.restock()))
  .post(
    "/api/v1/shopping/parse",
    ({ body }) => ok(parseShoppingText(body.text)),
    { body: ContractSchemas.ShoppingParseSchema },
  )
  .post("/api/v1/shopping/analyze", async ({headers,set}) => {
    try {
      if(cloudDataEnabled){
        const user=await authenticateRequest(headers.authorization);
        await aiUsageRepository.assertWithinLimit(user.id,"shopping_analysis");
        const [shoppingItems,inventory,onboarding]=await Promise.all([
          shoppingRepository.list(user.id),
          inventoryRepository.list(user.id),
          onboardingRepository.read(user.id),
        ]);
        const profile=onboarding.profile as null|{daily_meal_budget:number;planned_meal_slots:string[];weekly_home_cook_target:number};
        const restrictions=(onboarding.restrictions||[]).map((item:{id:string;label:string;kind:"allergy"|"avoid"|"preference";ingredient_keys:string[];is_hard_limit:boolean})=>({id:item.id,label:item.label,kind:item.kind,ingredientKeys:item.ingredient_keys,isHardLimit:item.is_hard_limit}));
        const inputBytes=new TextEncoder().encode(JSON.stringify({shoppingItems,inventory,restrictions,profile})).byteLength;
        const model=process.env.OPENROUTER_MODEL||"google/gemini-3.7-flash";
        await aiUsageRepository.record(user.id,"shopping_analysis","started",inputBytes,model);
        const result=await analyzeShopping({
          shoppingItems,
          inventory,
          restrictions,
          dailyMealBudget:profile?.daily_meal_budget??null,
          plannedMealSlots:profile?.planned_meal_slots??[],
          weeklyHomeCookTarget:profile?.weekly_home_cook_target??null,
        });
        await aiUsageRepository.record(user.id,"shopping_analysis",result.source==="openrouter"?"succeeded":"failed",inputBytes,model);
        return ok(result);
      }
      const state=service.state();
      return ok(await analyzeShopping({
        shoppingItems:state.shoppingItems,
        inventory:state.inventory,
        restrictions:state.onboardingProfile?.restrictions??[],
        dailyMealBudget:state.onboardingProfile?.dailyMealBudget??null,
        plannedMealSlots:state.onboardingProfile?.plannedMealSlots??[],
        weeklyHomeCookTarget:state.cookingPlan?.weeklyCookingMeals??null,
      }));
    } catch(error) {
      set.status=error instanceof Error&&error.message==="AI_RATE_LIMITED"?429:422;
      return fail(error);
    }
  })
  .get("/api/v1/settings/fridge", async ({headers}) => cloudDataEnabled?ok(await settingsRepository.fridge((await authenticateRequest(headers.authorization)).id)):ok(service.state().fridgeProfile))
  .put(
    "/api/v1/settings/fridge",
    async ({ body,headers }) => cloudDataEnabled?ok(await settingsRepository.saveFridge((await authenticateRequest(headers.authorization)).id,body)):ok(service.updateSettings({ fridgeProfile: body }).fridgeProfile),
    { body: ContractSchemas.FridgeProfileSchema },
  )
  .get("/api/v1/settings/cookware", async ({headers}) => cloudDataEnabled?ok(await settingsRepository.cookware((await authenticateRequest(headers.authorization)).id)):ok(service.state().cookware))
  .put(
    "/api/v1/settings/cookware",
    async ({ body,headers }) => cloudDataEnabled?ok(await settingsRepository.saveCookware((await authenticateRequest(headers.authorization)).id,body)):ok(service.updateSettings({ cookware: body }).cookware),
    { body: ContractSchemas.CookwareListSchema },
  )
  .post("/api/v1/receipts", async ({ body, headers, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      const image = (body as { image?: File }).image;
      if (!(image instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 10 * 1024 * 1024) {
        set.status = 422;
        return fail(new Error("INVALID_RECEIPT_IMAGE"));
      }
      return ok(await receiptRepository.create(user.id, image));
    } catch (error) {
      set.status = 422;
      return fail(error);
    }
  })
  .get("/api/v1/onboarding", async ({ headers, set }) => {
    try { const user = await authenticateRequest(headers.authorization); return ok(await onboardingRepository.read(user.id)); }
    catch (error) { set.status = 401; return fail(error); }
  })
  .put("/api/v1/onboarding", async ({ headers, body, set }) => {
    try { const user = await authenticateRequest(headers.authorization); return ok(await onboardingRepository.save(user.id, body as OnboardingProfile)); }
    catch (error) { set.status = 422; return fail(error); }
  }, { body: ContractSchemas.OnboardingProfileSchema })
  .get("/api/v1/profile", async ({headers,set})=>{try{const user=await authenticateRequest(headers.authorization);return ok(await onboardingRepository.read(user.id))}catch(error){set.status=401;return fail(error)}})
  .delete("/api/v1/profile",async({headers,set})=>{try{const user=await authenticateRequest(headers.authorization);return ok(await accountRepository.deleteAccount(user.id))}catch(error){set.status=422;return fail(error)}})
  .get("/api/v1/exports",async({headers,query,set})=>{try{const user=await authenticateRequest(headers.authorization);const exported=await accountRepository.export(user.id);if(query.format==="csv")return new Response(accountRepository.toCsv(exported),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=coocoo-export.csv"}});return ok(exported)}catch(error){set.status=422;return fail(error)}})
  .post("/api/v1/receipts/:id/recognize", async ({ params, headers, set }) => {
    let user: Awaited<ReturnType<typeof authenticateRequest>> | null = null;
    try {
      user = await authenticateRequest(headers.authorization);
      const image = await receiptRepository.image(user.id, params.id);
      await aiUsageRepository.assertWithinLimit(user.id, "receipt_ocr");
      await aiUsageRepository.record(user.id, "receipt_ocr", "started", image.bytes.byteLength);
      const recognition = await recognizeReceipt(new GeminiReceiptModel(), { bytes: image.bytes, mimeType: image.mimeType });
      await aiUsageRepository.record(user.id, "receipt_ocr", "succeeded", image.bytes.byteLength);
      return ok(await receiptRepository.saveRecognition(user.id, params.id, recognition));
    } catch (error) {
      if (user) { await receiptRepository.markFailed(user.id, params.id, error instanceof Error ? error.message : "OCR_FAILED"); try { await aiUsageRepository.record(user.id, "receipt_ocr", "failed", 0); } catch {} }
      set.status = 422;
      return fail(error);
    }
  })
  .post("/api/v1/receipts/:id/confirm", async ({ params, headers, body, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      const items = (body as { items?: unknown[] }).items;
      if (!Array.isArray(items) || !items.length) throw new Error("RECEIPT_ITEMS_REQUIRED");
      return ok(await receiptRepository.confirm(user.id, params.id, items));
    } catch (error) {
      set.status = 422;
      return fail(error);
    }
  })
  .delete("/api/v1/receipts/:id", async ({ params, headers, set }) => {
    try { const user = await authenticateRequest(headers.authorization); return ok(await receiptRepository.delete(user.id, params.id)); }
    catch (error) { set.status = 422; return fail(error); }
  })
  .get("/api/v1/admin/invites", async ({ headers, set }) => {
    try { const user = await authenticateRequest(headers.authorization); return ok(await inviteRepository.list(user.id)); }
    catch (error) { set.status = 403; return fail(error); }
  })
  .post("/api/v1/admin/invites", async ({ headers, body, set }) => {
    try { const user = await authenticateRequest(headers.authorization); return ok(await inviteRepository.create(user.id, String((body as { email?: string }).email || ""))); }
    catch (error) { set.status = 422; return fail(error); }
  })
  .delete("/api/v1/admin/invites/:id", async ({ headers, params, set }) => {
    try { const user = await authenticateRequest(headers.authorization); return ok(await inviteRepository.revoke(user.id, params.id)); }
    catch (error) { set.status = 422; return fail(error); }
  });

if (process.env.NODE_ENV !== "production") app.post("/api/v1/__mock/reset", () => ok(service.reset()));
