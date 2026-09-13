import { Elysia, t } from "elysia";
import { Value } from "@sinclair/typebox/value";
import { MealPlanCreateSchema, MealPostponeSchema, RecipePackageSchema, RecipeGenerateSchema, type MealPlan, type MealPlanCreate, type PlannedMeal, type RecipePackage, type RecipeGeneration, type WeeklyStockupItem } from "@coocoo/contracts";
import { brandSafeRecipes, evaluateRecipe } from "@coocoo/core";
import { assertDate, buildWeeklyStockupDraft, createMealPlan, createTodayDecision, refreshAvailability, rescheduleMeal, scalePackage, taipeiDate, weekOf, packageForMeal, unfilledMealSlots, type MealPlanningContext } from "./meal-planning";
import { generateRecipe, type RecipeGenerationWithUsage, type RecipeRequestContext } from "../recipes/openrouter-recipe.service";

export interface PlanningRepository {
  current(userId:string,weekStart?:string):Promise<{plan:MealPlan;packages:RecipePackage[]}|null>;
  save(userId:string,plan:MealPlan,packages?:RecipePackage[]):Promise<{plan:MealPlan;packages:RecipePackage[]}>;
  reschedule(userId:string,plan:MealPlan,meal:PlannedMeal,expectedUpdatedAt:string):Promise<void>;
  package(userId:string,recipeId:string):Promise<RecipePackage>;
  savePackage(userId:string,recipe:RecipePackage,source:"gemini"|"openrouter"|"brand_safe"|"catalog"):Promise<RecipePackage>;
}
export interface PlanningDependencies {
  authenticate(authorization?:string):Promise<{id:string}>;
  context(userId:string,weekStart:string):Promise<MealPlanningContext & { cookware:RecipeRequestContext["cookware"]; ingredientIds:Record<string,string> }>;
  repository:PlanningRepository;
  catalog?: { published():Promise<RecipePackage[]>; assertAvailable(recipe:RecipePackage):Promise<void> };
  generate?:(context:RecipeRequestContext,client?:undefined,allowAi?:boolean)=>Promise<RecipeGeneration & Partial<Pick<RecipeGenerationWithUsage,"aiAttempted"|"costUsd"|"model">>>;
  reserveGenerate?:(userId:string,operationId:string,input:unknown)=>Promise<RecipeGeneration|null>;
  settleGenerate?:(userId:string,operationId:string,status:"completed"|"failed",actualTwd:number,result:RecipeGeneration|null)=>Promise<void>;
  onPlanSaved?:(userId:string,plan:MealPlan,shoppingDraft:WeeklyStockupItem[])=>Promise<void>|void;
}
export function planningRoutes(deps:PlanningDependencies){
  const withAvailability=(saved:{plan:MealPlan;packages:RecipePackage[]},context:MealPlanningContext)=>{const refreshed=refreshAvailability(saved.plan,context.inventory);return {...saved,...refreshed,unfilledSlots:unfilledMealSlots(context,refreshed.plan),purchaseCandidates:context.purchaseCandidates||[],shoppingDraft:buildWeeklyStockupDraft(refreshed.plan,context.inventory)}};
  const stockupContext=(context:MealPlanningContext,input:MealPlanCreate)=>({...context,weeklyTarget:input.mealCount??context.weeklyTarget,recipes:context.strictCatalog?[...(context.recipes??[]),...(context.purchaseCandidates??[]).map(item=>item.recipe).filter((recipe,index,items)=>items.findIndex(item=>item.recipeId===recipe.recipeId)===index)]:context.recipes});
  return new Elysia({name:"planning-routes"})
    .get("/api/v1/meal-plans",async({headers,query})=>{
      const user=await deps.authenticate(headers.authorization);const week=query.weekStart||weekOf(taipeiDate());assertDate(week);
      const [context,saved]=await Promise.all([deps.context(user.id,week),deps.repository.current(user.id,week)]);
      return {data:saved?withAvailability(saved,context):null};
    },{query:t.Object({weekStart:t.Optional(t.String())})})
    .post("/api/v1/meal-plans/preview",async({headers,body})=>{
      const user=await deps.authenticate(headers.authorization);const context=stockupContext(await deps.context(user.id,body.weekStart),body);
      const plan=createMealPlan(context,{startDate:body.startDate,mealCount:body.mealCount});
      return {data:withAvailability({plan,packages:plan.meals.map(meal=>packageForMeal(meal,context.recipes))},context)};
    },{body:MealPlanCreateSchema})
    .post("/api/v1/meal-plans",async({headers,body})=>{
      const user=await deps.authenticate(headers.authorization);const context=stockupContext(await deps.context(user.id,body.weekStart),body);
      const existing=await deps.repository.current(user.id,body.weekStart);
      const plan=existing?.plan||createMealPlan(context,{startDate:body.startDate,mealCount:body.mealCount});
      const saved=existing||await deps.repository.save(user.id,plan,context.recipes?plan.meals.map(m=>packageForMeal(m,context.recipes)):undefined);
      const result=withAvailability(saved,context);
      await deps.onPlanSaved?.(user.id,result.plan,result.shoppingDraft);
      return {data:result};
    },{body:MealPlanCreateSchema})
    .patch("/api/v1/meal-plans/meals/:id",async({headers,params,body})=>{
      const user=await deps.authenticate(headers.authorization);
      const [context,saved]=await Promise.all([deps.context(user.id,body.weekStart),deps.repository.current(user.id,body.weekStart)]);
      if(!saved)throw new Error("PLANNED_MEAL_NOT_FOUND");
      const changed=rescheduleMeal(saved.plan,params.id,body,context.mealSlots);
      await deps.repository.reschedule(user.id,saved.plan,changed.meals.find(meal=>meal.id===params.id)!,body.expectedUpdatedAt);
      const result=await deps.repository.current(user.id,body.weekStart);if(!result)throw new Error("PLANNED_MEAL_NOT_FOUND");
      const refreshed=withAvailability(result,context);
      await deps.onPlanSaved?.(user.id,refreshed.plan,refreshed.shoppingDraft);
      return {data:refreshed};
    },{body:MealPostponeSchema})
    .get("/api/v1/meal-decisions/today",async({headers,query})=>{
      const user=await deps.authenticate(headers.authorization);const date=query.date||taipeiDate();assertDate(date);
      const context=await deps.context(user.id,weekOf(date));context.energyLevel=query.energy==="low"?"low":"normal";
      return {data:createTodayDecision(context,{date,slot:context.mealSlots[0]||"dinner"})};
    },{query:t.Object({date:t.Optional(t.String()),energy:t.Optional(t.Union([t.Literal("low"),t.Literal("normal")]))})})
    .get("/api/v1/recipes/:id/package",async({headers,params})=>{
      const user=await deps.authenticate(headers.authorization);const context=await deps.context(user.id,weekOf(taipeiDate()));
      const brand=(deps.catalog?await deps.catalog.published():brandSafeRecipes).find(recipe=>recipe.recipeId===params.id);
      const recipe=brand?scalePackage(brand,context.servings,context.inventory):await deps.repository.package(user.id,params.id);
      await deps.catalog?.assertAvailable(recipe);
      if(!Value.Check(RecipePackageSchema,recipe))throw new Error("RECIPE_PACKAGE_INVALID");
      const check=evaluateRecipe(recipe,{restrictions:context.restrictions,cookwareTypes:context.cookwareTypes,dailyBudget:context.perMealBudget===null?null:context.perMealBudget*recipe.servings,energyLevel:"normal"});
      if(!check.eligible)throw new Error("NO_SAFE_RECIPE_AVAILABLE");
      return {data:scalePackage(recipe,recipe.servings,context.inventory)};
    })
    .post("/api/v1/recipes/generate",async({headers,body})=>{
      const user=await deps.authenticate(headers.authorization);const context=await deps.context(user.id,weekOf(taipeiDate()));
      if(body.ingredientIds.some(id=>!context.ingredientIds[id]))throw new Error("ITEM_NOT_FOUND");
      const operationId=body.operationId||crypto.randomUUID();
      const input={ingredientIds:body.ingredientIds,style:body.style||"台式家常",excludeTitle:body.excludeTitle,restrictions:context.restrictions,cookware:context.cookware,budget:context.perMealBudget};
      let allowAi=true;let cached:RecipeGeneration|null|undefined;
      try{cached=await deps.reserveGenerate?.(user.id,operationId,input);}catch(error){const message=error instanceof Error?error.message:String(error);if(message.includes("AI_BUDGET_EXHAUSTED")||message.includes("AI_DAILY_LIMITED"))allowAi=false;else throw error;}
      if(cached)return {data:cached};
      let result:RecipeGeneration & Partial<Pick<RecipeGenerationWithUsage,"aiAttempted"|"costUsd"|"model">>;
      try {
        result=await(deps.generate||generateRecipe)({style:body.style||"台式家常",excludeTitle:body.excludeTitle,ingredientNames:body.ingredientIds.map(id=>context.ingredientIds[id]),restrictions:context.restrictions,cookware:context.cookware,budget:context.perMealBudget,energyLevel:"normal",inventory:context.inventory,recipes:deps.catalog?await deps.catalog.published():undefined},undefined,allowAi);
        const recipe=scalePackage(result.recipe,context.servings,context.inventory);
        result={...result,recipe:await deps.repository.savePackage(user.id,recipe,result.source)};
      } catch(error) { if(allowAi)await deps.settleGenerate?.(user.id,operationId,"failed",Number(process.env.RECIPE_AI_MAX_CALL_TWD||2),null);throw error; }
      const {aiAttempted=false,costUsd,model,...publicResult}=result;
      const actualTwd=costUsd===undefined?(aiAttempted?Number(process.env.RECIPE_AI_MAX_CALL_TWD||2):0):costUsd*Number(process.env.OPENROUTER_USD_TO_TWD_RATE||process.env.CATALOG_USD_TO_TWD_RATE||35);
      if(allowAi)await deps.settleGenerate?.(user.id,operationId,result.source==="openrouter"?"completed":"failed",actualTwd,publicResult);
      return {data:publicResult};
    },{body:RecipeGenerateSchema});
}
