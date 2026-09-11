import { syncRoutes } from "./modules/sync/routes";
import { CatalogRepository } from './modules/catalog/repository';
import { catalogRoutes } from './modules/catalog/routes';
import { recommend } from './modules/catalog/recommendations';
import { Elysia } from "elysia";
import { brandSafeRecipes, CooCooService, createMealTask, deriveGrowthProfile, getRescuePlan, parseShoppingText, searchRecipes } from "@coocoo/core";
import type { InventoryItem, MealTask, RecipeGeneration, RecipePackage } from "@coocoo/contracts";
import { ContractSchemas } from "@coocoo/contracts";
import { MemoryStateRepository } from "./shared/infrastructure/memory-state.repository";
import { authenticateRequest, getSupabaseAdmin } from "./shared/infrastructure/supabase";
import { OpenRouterReceiptModel, recognizeReceipt } from "./modules/receipts/openrouter-receipt-recognizer";
import { SupabaseReceiptRepository } from "./modules/receipts/supabase-receipt.repository";
import { SupabaseOnboardingRepository } from "./modules/onboarding/supabase-onboarding.repository";
import type { OnboardingProfile } from "@coocoo/contracts";
import { SupabaseInviteRepository } from "./modules/admin/supabase-invite.repository";
import { SupabaseAiUsageRepository } from "./modules/ai/supabase-ai-usage.repository";
import { OpenRouterHttpError } from "./modules/ai/openrouter-json-client";
import { SupabaseInventoryRepository } from "./modules/inventory/supabase-inventory.repository";
import { SupabaseShoppingRepository } from "./modules/shopping/supabase-shopping.repository";
import { SupabaseCookingRepository } from "./modules/cooking/supabase-cooking.repository";
import { SupabaseAccountRepository } from "./modules/account/supabase-account.repository";
import { SupabaseSettingsRepository } from "./modules/settings/supabase-settings.repository";
import { analyzeShopping } from "./modules/shopping/openrouter-shopping.service";
import { planningRoutes } from "./modules/meal-plans/routes";
import { cloudPlanningContext } from "./modules/meal-plans/context";
import { SupabaseMealPlanRepository } from "./modules/meal-plans/supabase-meal-plan.repository";
import { MemoryPlanningRepository } from "./modules/meal-plans/memory-planning.repository";
import { weekOf, taipeiDate } from "./modules/meal-plans/meal-planning";
import { runCatalogWorker } from "./modules/catalog/worker";
import { answerChefChat } from "./modules/chef-chat/chef-chat.service";
import { OpenRouterJsonClient } from "./modules/ai/openrouter-json-client";
import { previewRecipeAdjustment } from "./modules/recipes/recipe-adjustment.service";

function matchesSecret(value:string|undefined,expected:string|undefined){
  if(!value||!expected)return false;
  const left=new TextEncoder().encode(value),right=new TextEncoder().encode(expected);
  if(left.length!==right.length)return false;
  let difference=0;for(let index=0;index<left.length;index+=1)difference|=left[index]^right[index];
  return difference===0;
}

const requestId = () => crypto.randomUUID();
const ok = <T>(data: T) => ({ data });
const fail = (error: unknown) => {
  const code = error instanceof Error ? error.message : typeof error==="object"&&error&&"message" in error?String(error.message):"UNKNOWN_ERROR";
  const messages: Record<string, string> = {
    ITEM_NOT_FOUND: "找不到食材",
    UNSAFE_ACTION: "不安全食材只能丟棄",
    INGREDIENT_REQUIRED: "請至少選擇一項食材",
    AI_RATE_LIMITED: "AI 使用次數已達上限，請稍後再試。",
    AI_DAILY_LIMITED: "今天的 AI 使用次數已達上限，仍可使用不需 AI 的功能。",
    AI_BUDGET_EXHAUSTED: "本月 AI 預算已用完，仍可使用現有食譜與手動輸入。",
    AI_OPERATION_CONFLICT: "這筆 AI 請求內容已變更，請重新操作。",
    AI_OPERATION_IN_PROGRESS: "這筆 AI 請求正在處理，請稍候。",
    AI_OPERATION_FAILED: "這筆 AI 請求未完成，請重新操作。",
    AUTH_REQUIRED: "請先登入再使用這項功能。",
    AUTH_INVALID: "登入狀態已失效，請重新登入。",
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
    INVALID_SERVING_COUNT: "食用份數不可大於烹煮份數。",
    duplicate: "這份料理已經記錄過，請勿重複結算。",
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
const cloudDataEnabled = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
const catalogRepository=new CatalogRepository();
const catalogContext:typeof cloudPlanningContext=async(user,week)=>{if(user==="00000000-0000-4000-8000-000000000001")return previewPlanningContext(user,week);const [c,recipes,prices,settings,excluded]=await Promise.all([cloudPlanningContext(user,week),catalogRepository.published(),catalogRepository.prices(),catalogRepository.settings(user),catalogRepository.excluded(user)]);const inventoryOnly=recommend(recipes,c,{mode:"inventory_only",purchaseBudget:settings.purchaseBudget},prices,excluded);const withPurchase=recommend(recipes,c,{mode:"small_purchase",purchaseBudget:settings.purchaseBudget},prices,excluded);return {...c,strictCatalog:true,recipes:inventoryOnly.eligible.map(r=>r.recipe),purchaseCandidates:[...withPurchase.eligible,...withPurchase.needsConfirmation].filter(item=>item.missing.length).slice(0,3)}};
const mealPlanRepository=cloudDataEnabled?new SupabaseMealPlanRepository():new MemoryPlanningRepository();
const previewPlanningContext=async(_userId:string,weekStart:string)=>{const state=service.state();const profile=state.onboardingProfile;if(!profile)throw new Error("ONBOARDING_REQUIRED");return{weekStart,weeklyTarget:profile.weeklyGoalTarget,mealSlots:profile.plannedMealSlots,servings:profile.householdServings,restrictions:profile.restrictions,cookware:profile.cookware.map(item=>({type:item.type,capacity:item.capacity||null,limitations:item.limitations})),cookwareTypes:profile.cookware.map(item=>item.type),perMealBudget:null,inventory:state.inventory.map(item=>({ingredientKey:item.ingredientKey,name:item.name,quantity:item.qty,unit:item.unit,daysLeft:item.daysLeft})),ingredientIds:Object.fromEntries(state.inventory.map(item=>[item.id,item.name]))}};

function recipePackageFromRow(row:Record<string,unknown>):RecipePackage{
  return {id:String(row.id),recipeId:String(row.id),title:String(row.title),servings:Number(row.servings),prepMinutes:Number(row.prep_minutes),totalMinutes:Number(row.total_minutes),estimatedCost:Number(row.estimated_cost??0),cookwareTypes:(row.cookware_types??[]) as string[],ingredients:(row.ingredients??[]) as RecipePackage["ingredients"],steps:(row.steps??[]) as RecipePackage["steps"],imageUrl:null,fallbackImageUrl:"/favicon.svg",downloadedAt:null,source:(row.source??"brand_safe") as RecipePackage["source"]};
}

function mealTaskFromRow(row:Record<string,unknown>):MealTask{
  if(!row.recipes||Array.isArray(row.recipes))throw new Error("MEAL_TASK_RECIPE_MISSING");
  return {id:String(row.id),operationId:String(row.operation_id),recipe:recipePackageFromRow(row.recipes as Record<string,unknown>),status:row.status as MealTask["status"],currentMeal:row.current_meal as MealTask["currentMeal"],nextMeal:row.next_meal as MealTask["nextMeal"],plannedTotalServings:Number(row.planned_total_servings),shortages:(row.shortages??[]) as MealTask["shortages"],revision:Number(row.revision),createdAt:String(row.created_at),updatedAt:String(row.updated_at)};
}

async function integratedState(authorization?:string){
  const user=await authenticateRequest(authorization);
  if(user.id==="00000000-0000-4000-8000-000000000001")return service.state();
  const base=service.state();
  const client=getSupabaseAdmin();const currentWeek=weekOf(taipeiDate());
  const [inventory,shopping,onboarding,servingsResult,fridge,mealPlan,weeklyResult,expResult,badgeResult,favoriteResult,sessionResult,taskResult,reminderResult]=await Promise.all([inventoryRepository.list(user.id),shoppingRepository.list(user.id),onboardingRepository.read(user.id),client.from("meal_servings").select("*").eq("user_id",user.id),settingsRepository.fridge(user.id),mealPlanRepository.current(user.id,currentWeek),client.from("weekly_goals_v2").select("*").eq("user_id",user.id).eq("week_start",currentWeek).maybeSingle(),client.from("exp_events").select("*").eq("user_id",user.id).order("created_at"),client.from("badge_awards").select("*").eq("user_id",user.id).order("awarded_at"),client.from("recipe_favorites").select("recipe_id").eq("user_id",user.id),client.from("cooking_sessions").select("*,recipes(title)").eq("user_id",user.id).eq("status","completed").order("completed_at"),client.from("meal_tasks").select("*,recipes(*)").eq("user_id",user.id).order("updated_at",{ascending:false}),client.from("notification_preferences").select("*").eq("user_id",user.id).maybeSingle()]);
  for(const result of [servingsResult,weeklyResult,expResult,badgeResult,favoriteResult,sessionResult,taskResult,reminderResult])if(result.error)throw result.error;
  const mealServings=(servingsResult.data||[]).map(row=>({id:row.id,cookingSessionId:row.cooking_session_id,status:row.status,eatenAt:row.eaten_at,vegetableKeys:row.vegetable_keys||[]}));const eaten=mealServings.filter(item=>item.status==="eaten");const weeklyCompletions=eaten.reduce<Record<string,number>>((counts,item)=>{if(!item.eatenAt)return counts;const date=new Date(item.eatenAt);const day=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()-day+1);const key=date.toISOString().slice(0,10);counts[key]=(counts[key]||0)+1;return counts},{});
  const expEvents=(expResult.data||[]).map(row=>({id:row.id,operationId:row.operation_id,type:row.event_type,points:row.points,sourceId:row.source_id,createdAt:row.created_at}));const badgeAwards=(badgeResult.data||[]).map(row=>({id:row.id,badgeKey:row.badge_key,category:row.category,tier:row.tier,title:row.title,awardedAt:row.awarded_at}));const cookingOutcomes=(sessionResult.data||[]).map(row=>({id:row.id,completionKey:row.operation_id,mealName:(row.recipes as {title?:string}|null)?.title||"自煮料理",source:"recipe",ingredientCost:0,servingsCooked:row.servings_cooked,servingsEaten:mealServings.filter(item=>item.cookingSessionId===row.id&&item.status==="eaten").length,expAwarded:expEvents.filter(event=>event.sourceId===row.id).reduce((sum,event)=>sum+event.points,0),createdAt:row.completed_at||row.started_at}));const counters={cooking:cookingOutcomes.length,rhythm:expEvents.filter(event=>event.type==="weekly_goal_completed").length,wasteLess:expEvents.filter(event=>event.type==="expiring_ingredient_used"||event.type==="prepared_serving_eaten").length,exploration:new Set(cookingOutcomes.map(item=>item.mealName)).size};
  const weeklyGoal=weeklyResult.data?{id:weeklyResult.data.id,weekStart:weeklyResult.data.week_start,metric:weeklyResult.data.metric,target:weeklyResult.data.target,progress:weeklyResult.data.progress,rewardGrantedAt:weeklyResult.data.reward_granted_at,updatedAt:weeklyResult.data.updated_at}:base.weeklyGoal;const reminder=reminderResult.data;const reminderPreferences=reminder?{expiringIngredients:reminder.expiring_ingredients,plannedMeals:reminder.planned_meals,weeklyRhythm:reminder.weekly_rhythm,pushEnabled:reminder.push_enabled,quietHoursStart:String(reminder.quiet_hours_start).slice(0,5),quietHoursEnd:String(reminder.quiet_hours_end).slice(0,5),weeklyLimit:3 as const}:base.reminderPreferences;
  const profile=onboarding.profile;const onboardingProfile=profile?{status:profile.onboarding_status,currentStep:profile.onboarding_step,cookingExperience:profile.cooking_experience,currentWeeklyCookingFrequency:profile.current_weekly_cooking_frequency,habitBarriers:profile.habit_barriers??[],guidanceMode:profile.guidance_mode,householdServings:profile.household_servings,cookware:(onboarding.cookware||[]).map((item:{type:string;capacity:string|null;limitations:string[]})=>({type:item.type,capacity:item.capacity??undefined,limitations:item.limitations??[]})),restrictions:(onboarding.restrictions||[]).map((item:{id:string;label:string;kind:"allergy"|"avoid"|"preference";ingredient_keys:string[];is_hard_limit:boolean})=>({id:item.id,label:item.label,kind:item.kind,ingredientKeys:item.ingredient_keys,isHardLimit:item.is_hard_limit})),preferredFlavors:profile.preferred_flavors??[],availableMinutes:profile.available_minutes,inventoryReviewed:true,hasNoInventory:inventory.length===0,plannedMealSlots:profile.planned_meal_slots??[],primaryGoalMetric:profile.primary_goal_metric,weeklyGoalTarget:weeklyGoal.target,reminders:reminderPreferences,completedAt:profile.updated_at} as OnboardingProfile:undefined;
  return {...base,session:{user:{id:user.id,email:user.email,displayName:user.email.split("@")[0]}},inventory,shoppingItems:shopping,fridgeProfile:fridge,cookware:(onboarding.cookware||[]).map((item:{id:string;type:string;capacity:string|null})=>({id:item.id,type:item.type,name:item.type,brand:"",model:"",capacity:item.capacity||"",wattage:0})),onboardingProfile,mealServings,mealPlan:mealPlan?.plan,recipePackages:mealPlan?.packages,weeklyGoal,expEvents,badgeAwards,growth:deriveGrowthProfile(expEvents,badgeAwards,counters),recipeFavoriteIds:(favoriteResult.data||[]).map(row=>row.recipe_id),cookingOutcomes,mealTasks:(taskResult.data||[]).map(row=>mealTaskFromRow(row as Record<string,unknown>)),reminderPreferences,habitProgress:{totalMeals:eaten.length,weeklyCompletions,events:eaten.filter(item=>item.eatenAt).map(item=>({outcomeId:item.cookingSessionId,createdAt:item.eatenAt!,weekKey:Object.keys(weeklyCompletions).find(key=>item.eatenAt!.slice(0,10)>=key)||item.eatenAt!.slice(0,10)}))}};
}

export const app = new Elysia({ name: "coocoo-api" })
  .post("/api/v1/internal/catalog/tick",async({headers,set})=>{
    const bearer=headers.authorization?.replace(/^Bearer\s+/i,'');
    if(!matchesSecret(bearer,process.env.CATALOG_CRON_SECRET)){set.status=401;return fail(new Error('CRON_AUTH_INVALID'));}
    return ok(await runCatalogWorker());
  })
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
  .use(planningRoutes({authenticate:cloudDataEnabled?authenticateRequest:async()=>({id:"preview"}),context:cloudDataEnabled?catalogContext:previewPlanningContext,catalog:cloudDataEnabled?catalogRepository:undefined,repository:mealPlanRepository,reserveGenerate:cloudDataEnabled?async(userId,operationId,input)=>aiUsageRepository.reserve<RecipeGeneration>(userId,operationId,"recipe_generation",await aiUsageRepository.hash(input),process.env.OPENROUTER_MODEL||"google/gemini-3.7-flash",Number(process.env.RECIPE_AI_MAX_CALL_TWD||2)):undefined,settleGenerate:cloudDataEnabled?async(userId,operationId,status,actual,result)=>aiUsageRepository.settle(userId,operationId,status,actual,result):undefined}))
  .use(cloudDataEnabled?syncRoutes():new Elysia())
  .use(cloudDataEnabled?catalogRoutes(authenticateRequest,cloudPlanningContext,catalogRepository):new Elysia())
  .get("/api/v1/health", () => ok({ status: "ok" }))
  .get("/api/v1/state", async ({headers}) => ok(cloudDataEnabled?await integratedState(headers.authorization):service.state()))
  .get("/api/v1/session", () => ok(service.state().session))
  .post("/api/v1/auth/login", ({ body }) => ok(service.login(body.email)), {
    body: ContractSchemas.LoginRequestSchema,
  })
  .post("/api/v1/auth/logout", () => ok(service.logout()))
  .patch("/api/v1/weekly-goal", async ({body,headers}) => {
    if(cloudDataEnabled){
      const user=await authenticateRequest(headers.authorization);
      const weekStart=weekOf(taipeiDate());
      const {data,error}=await getSupabaseAdmin().from("weekly_goals_v2").upsert({user_id:user.id,week_start:weekStart,metric:body.metric,target:body.target,updated_at:new Date().toISOString()},{onConflict:"user_id,week_start"}).select().single();
      if(error)throw error;return ok(data);
    }
    const state=service.state();state.weeklyGoal={...state.weeklyGoal,...body,updatedAt:new Date().toISOString()};repository.write(state);return ok(state.weeklyGoal);
  },{body:ContractSchemas.WeeklyGoalPatchSchema})
  .patch("/api/v1/settings/reminders", async ({body,headers}) => {
    if(cloudDataEnabled){
      const user=await authenticateRequest(headers.authorization);
      const {data,error}=await getSupabaseAdmin().from("notification_preferences").upsert({user_id:user.id,expiring_ingredients:body.expiringIngredients,planned_meals:body.plannedMeals,weekly_rhythm:body.weeklyRhythm,weekly_limit:3,updated_at:new Date().toISOString()},{onConflict:"user_id"}).select().single();
      if(error)throw error;
      return ok(data);
    }
    const state=service.state();
    state.reminderPreferences={...(state.reminderPreferences??{pushEnabled:false,quietHoursStart:"21:00",quietHoursEnd:"09:00",weeklyLimit:3}),...body};
    repository.write(state);
    return ok(state.reminderPreferences);
  },{body:ContractSchemas.ReminderPreferencesPatchSchema})
  .post("/api/v1/recipes/search",async({body,headers})=>{const state=cloudDataEnabled?await integratedState(headers.authorization):service.state();let favorites=new Set<string>();if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const result=await getSupabaseAdmin().from("recipe_favorites").select("recipe_id").eq("user_id",user.id);if(result.error)throw result.error;favorites=new Set((result.data||[]).map((row)=>row.recipe_id));}return ok({items:searchRecipes(brandSafeRecipes,state.inventory,body.query,body.ingredientKeywords,favorites),notice:"可靠食譜庫優先；全符合排在部分符合之前。"})},{body:ContractSchemas.RecipeSearchRequestSchema})
  .put("/api/v1/recipes/:id/favorite",async({params,headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {error}=await getSupabaseAdmin().from("recipe_favorites").upsert({user_id:user.id,recipe_id:params.id});if(error)throw error;}else{const state=service.state();state.recipeFavoriteIds=Array.from(new Set([...(state.recipeFavoriteIds??[]),params.id]));repository.write(state);}return ok({recipeId:params.id,favorite:true})})
  .delete("/api/v1/recipes/:id/favorite",async({params,headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {error}=await getSupabaseAdmin().from("recipe_favorites").delete().eq("user_id",user.id).eq("recipe_id",params.id);if(error)throw error;}else{const state=service.state();state.recipeFavoriteIds=(state.recipeFavoriteIds??[]).filter((id)=>id!==params.id);repository.write(state);}return ok({recipeId:params.id,favorite:false})})
  .post("/api/v1/recipes/:id/adjustments/preview",async({params,body,headers})=>{const state=cloudDataEnabled?await integratedState(headers.authorization):service.state();const recipe=brandSafeRecipes.find((item)=>item.id===params.id||item.recipeId===params.id);if(!recipe)throw new Error("RECIPE_NOT_FOUND");let reserved=false;let userId=state.session.user?.id??"00000000-0000-4000-8000-000000000001";if(cloudDataEnabled){userId=(await authenticateRequest(headers.authorization)).id;try{await aiUsageRepository.reserve(userId,body.operationId,"recipe_generation",await aiUsageRepository.hash({recipe:recipe.id,body}),process.env.OPENROUTER_MODEL||"google/gemini-3.7-flash",Number(process.env.RECIPE_AI_MAX_CALL_TWD||2));reserved=true;}catch(error){if(!(error instanceof Error&&(error.message.includes("AI_BUDGET_EXHAUSTED")||error.message.includes("AI_DAILY_LIMITED"))))throw error;}}const preview=await previewRecipeAdjustment(recipe,body,state.inventory,state.onboardingProfile?.restrictions??[],reserved?new OpenRouterJsonClient():undefined);if(reserved)await aiUsageRepository.settle(userId,body.operationId,preview.source==="openrouter"?"completed":"failed",preview.source==="openrouter"?(preview.costUsd??0)*Number(process.env.OPENROUTER_USD_TO_TWD_RATE||35):0,preview);if(cloudDataEnabled){const client=getSupabaseAdmin();const recipeWrite=await client.from("recipes").upsert({id:recipe.recipeId,user_id:userId,title:recipe.title,servings:recipe.servings,prep_minutes:recipe.prepMinutes,total_minutes:recipe.totalMinutes,cookware_types:recipe.cookwareTypes,ingredients:recipe.ingredients,steps:recipe.steps,safety_reviewed:true,source:"brand_safe"});if(recipeWrite.error)throw recipeWrite.error;const saved=await client.from("recipe_adjustment_previews").upsert({user_id:userId,operation_id:body.operationId,original_recipe_id:recipe.recipeId,adjusted_recipe:preview.adjustedRecipe,changes:preview.changes,missing:preview.missing,safety_checks:preview.safetyChecks,source:preview.source,expires_at:preview.expiresAt},{onConflict:"user_id,operation_id"});if(saved.error)throw saved.error;}else{const {costUsd:__,...storedPreview}=preview;state.recipeAdjustmentPreviews=[...(state.recipeAdjustmentPreviews??[]).filter((item)=>item.previewId!==storedPreview.previewId),storedPreview];repository.write(state);}const {costUsd:_,...publicPreview}=preview;return ok(publicPreview)},{body:ContractSchemas.RecipeAdjustmentRequestSchema})
  .get("/api/v1/meal-tasks",async({headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {data,error}=await getSupabaseAdmin().from("meal_tasks").select("*,recipes(*)").eq("user_id",user.id).order("updated_at",{ascending:false});if(error)throw error;return ok((data??[]).map((row)=>mealTaskFromRow(row as Record<string,unknown>)));}return ok(service.state().mealTasks??[])})
  .post("/api/v1/meal-tasks",async({body,headers,set})=>{
    const state=cloudDataEnabled?await integratedState(headers.authorization):service.state();
    const baseRecipe=brandSafeRecipes.find((item)=>item.id===body.recipePackageId||item.recipeId===body.recipePackageId);
    if(!baseRecipe){set.status=404;return fail(new Error("RECIPE_NOT_FOUND"));}
    let recipe=baseRecipe;
    let cloudPreviewId:string|null=null;
    if(body.adjustmentPreviewId){
      if(cloudDataEnabled){
        const user=await authenticateRequest(headers.authorization);const client=getSupabaseAdmin();
        const {data:preview,error}=await client.from("recipe_adjustment_previews").select("*").eq("user_id",user.id).eq("operation_id",body.adjustmentPreviewId).maybeSingle();
        if(error)throw error;
        if(!preview||preview.original_recipe_id!==baseRecipe.recipeId||Date.parse(preview.expires_at)<=Date.now())throw new Error("ADJUSTMENT_PREVIEW_INVALID");
        recipe=preview.adjusted_recipe as RecipePackage;cloudPreviewId=preview.id;
      }else{
        const preview=(state.recipeAdjustmentPreviews??[]).find((item)=>item.previewId===body.adjustmentPreviewId&&item.originalRecipeId===baseRecipe.recipeId&&Date.parse(item.expiresAt)>Date.now());
        if(!preview)throw new Error("ADJUSTMENT_PREVIEW_INVALID");
        recipe=preview.adjustedRecipe;
      }
    }
    const task=createMealTask(body,recipe,state.inventory,state.onboardingProfile?.restrictions??[]);
    if(cloudDataEnabled){
      const user=await authenticateRequest(headers.authorization);const client=getSupabaseAdmin();const storedRecipeId=body.adjustmentPreviewId?body.operationId:baseRecipe.recipeId;
      const recipeWrite=await client.from("recipes").upsert({id:storedRecipeId,user_id:user.id,title:recipe.title,servings:recipe.servings,prep_minutes:recipe.prepMinutes,total_minutes:recipe.totalMinutes,cookware_types:recipe.cookwareTypes,ingredients:recipe.ingredients,steps:recipe.steps,safety_reviewed:true,source:recipe.source??"brand_safe"}).select().single();
      if(recipeWrite.error)throw recipeWrite.error;
      const result=await client.from("meal_tasks").upsert({id:task.id,user_id:user.id,operation_id:task.operationId,recipe_id:storedRecipeId,adjustment_preview_id:cloudPreviewId,status:task.status,current_meal:task.currentMeal,next_meal:task.nextMeal,planned_total_servings:task.plannedTotalServings,shortages:task.shortages,revision:task.revision},{onConflict:"user_id,operation_id"}).select("*,recipes(*)").single();
      if(result.error)throw result.error;
      if(cloudPreviewId){const confirmed=await client.from("recipe_adjustment_previews").update({confirmed_at:new Date().toISOString()}).eq("id",cloudPreviewId).eq("user_id",user.id);if(confirmed.error)throw confirmed.error;}
      return ok(mealTaskFromRow(result.data as Record<string,unknown>));
    }
    state.mealTasks=[...(state.mealTasks??[]).filter((item)=>item.operationId!==task.operationId),task];repository.write(state);return ok(task);
  },{body:ContractSchemas.MealTaskCreateSchema})
  .get("/api/v1/chef-chat/sessions",async({headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {data,error}=await getSupabaseAdmin().from("chef_chat_sessions").select("*,chef_chat_messages(*)").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(10);if(error)throw error;return ok((data??[]).map((session)=>({id:session.id,title:session.title,source:session.source,createdAt:session.created_at,updatedAt:session.updated_at,messages:(session.chef_chat_messages??[]).sort((a:{created_at:string},b:{created_at:string})=>a.created_at.localeCompare(b.created_at)).map((message:{id:string;role:"user"|"assistant"|"system";content:string;created_at:string})=>({id:message.id,role:message.role,content:message.content,createdAt:message.created_at}))})));}return ok((service.state().chefChatSessions??[]).slice(-10).reverse())})
  .post("/api/v1/chef-chat/sessions",async({body,headers})=>{const state=cloudDataEnabled?await integratedState(headers.authorization):service.state();let reserved=false;let userId=state.session.user?.id??"00000000-0000-4000-8000-000000000001";if(cloudDataEnabled){userId=(await authenticateRequest(headers.authorization)).id;try{await aiUsageRepository.reserve(userId,body.operationId,"chef_chat",await aiUsageRepository.hash(body),process.env.OPENROUTER_MODEL||"google/gemini-3.7-flash",Number(process.env.CHEF_CHAT_AI_MAX_CALL_TWD||2));reserved=true;}catch(error){if(!(error instanceof Error&&(error.message.includes("AI_BUDGET_EXHAUSTED")||error.message.includes("AI_DAILY_LIMITED"))))throw error;}}const answer=await answerChefChat({inventory:state.inventory,restrictions:state.onboardingProfile?.restrictions??[],availableMinutes:state.onboardingProfile?.availableMinutes??30,message:body.message},reserved?new OpenRouterJsonClient():undefined);if(reserved)await aiUsageRepository.settle(userId,body.operationId,answer.source==="openrouter"?"completed":"failed",answer.source==="openrouter"?answer.costUsd*Number(process.env.CATALOG_USD_TO_TWD_RATE||35):0,answer);const now=new Date().toISOString();const session={id:crypto.randomUUID(),title:body.message.slice(0,24),source:answer.source,createdAt:now,updatedAt:now,messages:[{id:crypto.randomUUID(),role:"user" as const,content:body.message,createdAt:now},{id:crypto.randomUUID(),role:"assistant" as const,content:answer.reply,createdAt:now}]};if(cloudDataEnabled){const client=getSupabaseAdmin();const saved=await client.from("chef_chat_sessions").insert({id:session.id,user_id:userId,title:session.title,source:session.source}).select().single();if(saved.error)throw saved.error;const messages=await client.from("chef_chat_messages").insert(session.messages.map((message)=>({id:message.id,user_id:userId,session_id:session.id,role:message.role,content:message.content})));if(messages.error)throw messages.error;}else{state.chefChatSessions=[...(state.chefChatSessions??[]).slice(-9),session];repository.write(state);}return ok(session)},{body:ContractSchemas.ChefChatSendSchema})
  .delete("/api/v1/chef-chat/sessions/:id",async({params,headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {error}=await getSupabaseAdmin().from("chef_chat_sessions").delete().eq("id",params.id).eq("user_id",user.id);if(error)throw error;}else{const state=service.state();state.chefChatSessions=(state.chefChatSessions??[]).filter((session)=>session.id!==params.id);repository.write(state);}return ok({id:params.id})})
  .post("/api/v1/push-subscriptions",async({body,headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {data,error}=await getSupabaseAdmin().from("push_subscriptions").upsert({user_id:user.id,endpoint:body.endpoint,p256dh:body.p256dh,auth:body.auth},{onConflict:"user_id,endpoint"}).select("id,endpoint").single();if(error)throw error;return ok(data);}return ok({id:"preview",endpoint:body.endpoint})},{body:ContractSchemas.PushSubscriptionWriteSchema})
  .delete("/api/v1/push-subscriptions",async({body,headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {error}=await getSupabaseAdmin().from("push_subscriptions").delete().eq("user_id",user.id).eq("endpoint",body.endpoint);if(error)throw error;}return ok({endpoint:body.endpoint,deleted:true})},{body:ContractSchemas.PushSubscriptionDeleteSchema})
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
  .post("/api/v1/meal-servings/:id/eat",async({params,body,headers})=>{if(cloudDataEnabled){const user=await authenticateRequest(headers.authorization);const {data,error}=await getSupabaseAdmin().rpc("eat_prepared_serving_v2",{p_user_id:user.id,p_serving_id:params.id,p_operation_id:body.operationId});if(error)throw error;return ok(data);}return ok(service.eatPreparedServing(params.id,body.operationId))},{body:ContractSchemas.PreparedServingEatSchema})
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
  .post("/api/v1/shopping/analyze", async ({headers,body,set}) => {
    try {
      if(cloudDataEnabled){
        const user=await authenticateRequest(headers.authorization);
        const [shoppingItems,inventory,onboarding]=await Promise.all([
          shoppingRepository.list(user.id),
          inventoryRepository.list(user.id),
          onboardingRepository.read(user.id),
        ]);
        const profile=onboarding.profile as null|{planned_meal_slots:string[];weekly_home_cook_target:number};
        const restrictions=(onboarding.restrictions||[]).map((item:{id:string;label:string;kind:"allergy"|"avoid"|"preference";ingredient_keys:string[];is_hard_limit:boolean})=>({id:item.id,label:item.label,kind:item.kind,ingredientKeys:item.ingredient_keys,isHardLimit:item.is_hard_limit}));
        const model=process.env.OPENROUTER_MODEL||"google/gemini-3.7-flash";
        const operationId=(body as {operationId:string}).operationId;
        const inputHash=await aiUsageRepository.hash({shoppingItems,inventory,restrictions,profile});
        const context={shoppingItems,inventory,restrictions,dailyMealBudget:null,plannedMealSlots:profile?.planned_meal_slots??[],weeklyHomeCookTarget:profile?.weekly_home_cook_target??null};
        let cached:unknown;
        try{cached=await aiUsageRepository.reserve(user.id,operationId,"shopping_analysis",inputHash,model,Number(process.env.SHOPPING_AI_MAX_CALL_TWD||1));}
        catch(error){
          const message=error instanceof Error?error.message:String(error);
          if(message.includes('AI_BUDGET_EXHAUSTED')||message.includes('AI_DAILY_LIMITED'))return ok(await analyzeShopping(context,null));
          throw error;
        }
        if(cached)return ok(cached);
        const result=await analyzeShopping(context);
        const costUsd=Number((result as typeof result&{costUsd?:number}).costUsd||0);
        const publicResult={...result};delete (publicResult as typeof publicResult&{costUsd?:number}).costUsd;
        const actualTwd=result.source==='openrouter'?costUsd*Number(process.env.CATALOG_USD_TO_TWD_RATE||35):process.env.OPENROUTER_API_KEY?Number(process.env.SHOPPING_AI_MAX_CALL_TWD||1):0;
        await aiUsageRepository.settle(user.id,operationId,result.source==="openrouter"?'completed':'failed',actualTwd,publicResult);
        return ok(publicResult);
      }
      const state=service.state();
      return ok(await analyzeShopping({
        shoppingItems:state.shoppingItems,
        inventory:state.inventory,
        restrictions:state.onboardingProfile?.restrictions??[],
        dailyMealBudget:null,
        plannedMealSlots:state.onboardingProfile?.plannedMealSlots??[],
        weeklyHomeCookTarget:state.weeklyGoal.target,
      }));
    } catch(error) {
      set.status=error instanceof Error&&error.message==="AI_RATE_LIMITED"?429:422;
      return fail(error);
    }
  },{body:ContractSchemas.ShoppingAnalyzeSchema})
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
    try {
      const user = await authenticateRequest(headers.authorization);
      if (user.id === "00000000-0000-4000-8000-000000000001") {
        service.completeOnboarding(body as OnboardingProfile);
      }
      return ok(await onboardingRepository.save(user.id, body as OnboardingProfile));
    }
    catch (error) { set.status = 422; return fail(error); }
  }, { body: ContractSchemas.OnboardingProfileSchema })
  .get("/api/v1/profile", async ({headers,set})=>{try{const user=await authenticateRequest(headers.authorization);return ok(await onboardingRepository.read(user.id))}catch(error){set.status=401;return fail(error)}})
  .delete("/api/v1/profile",async({headers,set})=>{try{const user=await authenticateRequest(headers.authorization);return ok(await accountRepository.deleteAccount(user.id))}catch(error){set.status=422;return fail(error)}})
  .get("/api/v1/exports",async({headers,query,set})=>{try{const user=await authenticateRequest(headers.authorization);const exported=await accountRepository.export(user.id);if(query.format==="csv")return new Response(accountRepository.toCsv(exported),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=coocoo-export.csv"}});return ok(exported)}catch(error){set.status=422;return fail(error)}})
  .post("/api/v1/receipts/:id/recognize", async ({ params, headers, body, set }) => {
    let user: Awaited<ReturnType<typeof authenticateRequest>> | null = null;
    let operationId:string|null=null;let reserved=false;const maxTwd=Number(process.env.RECEIPT_AI_MAX_CALL_TWD||2);
    try {
      user = await authenticateRequest(headers.authorization);
      const image = await receiptRepository.image(user.id, params.id);
      operationId=typeof body==='object'&&body&&'operationId' in body?String(body.operationId):crypto.randomUUID();
      const inputHash=await aiUsageRepository.hash(image.bytes);
      const receiptModel=new OpenRouterReceiptModel();
      const cached=await aiUsageRepository.reserve(user.id,operationId,"receipt_ocr",inputHash,receiptModel.model,maxTwd);
      if(cached)return ok(cached);
      reserved=true;
      const result = await recognizeReceipt(receiptModel, { bytes: image.bytes, mimeType: image.mimeType });
      const saved=await receiptRepository.saveRecognition(user.id, params.id, result.recognition);
      await aiUsageRepository.settle(user.id,operationId,"completed",result.costUsd===undefined?maxTwd:result.costUsd*Number(process.env.OPENROUTER_USD_TO_TWD_RATE||process.env.CATALOG_USD_TO_TWD_RATE||35),saved);
      return ok(saved);
    } catch (error) {
      if(user&&operationId&&reserved)try{await aiUsageRepository.settle(user.id,operationId,"failed",error instanceof OpenRouterHttpError?0:maxTwd,null)}catch{}
      if (user) await receiptRepository.markFailed(user.id, params.id, error instanceof Error ? error.message : "OCR_FAILED");
      set.status = 422;
      return fail(error);
    }
  },{body:ContractSchemas.ReceiptRecognizeSchema})
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
