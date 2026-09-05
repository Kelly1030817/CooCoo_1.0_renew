import type { MealPlan, PlannedMeal, RecipePackage } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";
import { packageForMeal } from "./meal-planning";

type PlanRow={id:string;week_start:string;overlap_rate:number|string;inventory_coverage_rate:number|string;updated_at:string};
type MealRow={id:string;planned_date:string;meal_slot:PlannedMeal["slot"];recipe_id:string;status:PlannedMeal["status"];servings:number;estimated_cost:number;energy_level:PlannedMeal["energyLevel"]};
type RecipeRow={id:string;title:string;servings:number;prep_minutes:number;total_minutes:number;estimated_cost:number;cookware_types:string[];ingredients:RecipePackage["ingredients"];steps:RecipePackage["steps"];image_path:string|null;fallback_image_url:string};

export class SupabaseMealPlanRepository {
  async current(userId:string,weekStart?:string):Promise<{plan:MealPlan;packages:RecipePackage[]}|null>{
    const client=getSupabaseAdmin();
    let query=client.from("meal_plans").select("*").eq("user_id",userId);
    query=weekStart?query.eq("week_start",weekStart):query.order("week_start",{ascending:false}).limit(1);
    const result=await query.maybeSingle();if(result.error)throw result.error;if(!result.data)return null;
    const planRow=result.data as PlanRow;
    const mealsResult=await client.from("planned_meals").select("*").eq("user_id",userId).eq("meal_plan_id",planRow.id).order("planned_date").order("meal_slot");
    if(mealsResult.error)throw mealsResult.error;
    const mealRows=(mealsResult.data||[]) as MealRow[];
    const recipeIds=mealRows.map(row=>row.recipe_id);
    const recipesResult=recipeIds.length?await client.from("recipes").select("*").eq("user_id",userId).in("id",recipeIds):{data:[],error:null};
    if(recipesResult.error)throw recipesResult.error;
    const recipes=new Map(((recipesResult.data||[]) as RecipeRow[]).map(row=>[row.id,row]));
    const meals:PlannedMeal[]=mealRows.map(row=>{const recipe=recipes.get(row.recipe_id);if(!recipe)throw new Error("RECIPE_PACKAGE_NOT_FOUND");return {id:row.id,date:row.planned_date,slot:row.meal_slot,recipeId:row.recipe_id,title:recipe.title,status:row.status,servings:row.servings,ingredients:recipe.ingredients,estimatedCost:row.estimated_cost,totalMinutes:recipe.total_minutes,cookwareTypes:recipe.cookware_types,energyLevel:row.energy_level}});
    const plan:MealPlan={id:planRow.id,weekStart:planRow.week_start,meals,overlapRate:Number(planRow.overlap_rate),inventoryCoverageRate:Number(planRow.inventory_coverage_rate),updatedAt:planRow.updated_at};
    const packages:RecipePackage[]=meals.map(meal=>{const row=recipes.get(meal.recipeId)!;return {id:`package-${row.id}`,recipeId:row.id,title:row.title,servings:row.servings,prepMinutes:row.prep_minutes,totalMinutes:row.total_minutes,estimatedCost:row.estimated_cost,cookwareTypes:row.cookware_types,ingredients:row.ingredients,steps:row.steps,imageUrl:row.image_path,fallbackImageUrl:row.fallback_image_url,downloadedAt:null}});
    return {plan,packages};
  }

  async save(userId:string,plan:MealPlan){
    const packages=plan.meals.map(packageForMeal);
    const {error}=await getSupabaseAdmin().rpc("replace_meal_plan",{p_user_id:userId,p_plan:{...plan,packages}});
    if(error)throw error;
    const saved=await this.current(userId,plan.weekStart);if(!saved)throw new Error("MEAL_PLAN_NOT_SAVED");return saved;
  }

  async reschedule(userId:string,plan:MealPlan,meal:PlannedMeal,expectedUpdatedAt:string){
    const {error}=await getSupabaseAdmin().rpc("reschedule_planned_meal",{p_user_id:userId,p_plan_id:plan.id,p_meal_id:meal.id,p_expected:expectedUpdatedAt,p_date:meal.date,p_slot:meal.slot,p_status:meal.status});
    if(error)throw error;
  }

  async savePackage(userId:string,recipe:RecipePackage,source:"gemini"|"brand_safe"){
    const recipeId=crypto.randomUUID();
    const {error}=await getSupabaseAdmin().from("recipes").insert({id:recipeId,user_id:userId,title:recipe.title,servings:recipe.servings,prep_minutes:recipe.prepMinutes,total_minutes:recipe.totalMinutes,estimated_cost:recipe.estimatedCost,cookware_types:recipe.cookwareTypes,ingredients:recipe.ingredients,steps:recipe.steps,image_path:recipe.imageUrl,fallback_image_url:recipe.fallbackImageUrl,safety_reviewed:source==="brand_safe",source});
    if(error)throw error;
    return {...recipe,id:`package-${recipeId}`,recipeId};
  }

  async package(userId:string,recipeId:string){
    const client=getSupabaseAdmin();const {data,error}=await client.from("recipes").select("*").eq("user_id",userId).eq("id",recipeId).maybeSingle();
    if(error)throw error;if(!data)throw new Error("RECIPE_PACKAGE_NOT_FOUND");const row=data as RecipeRow;
    return {id:`package-${row.id}`,recipeId:row.id,title:row.title,servings:row.servings,prepMinutes:row.prep_minutes,totalMinutes:row.total_minutes,estimatedCost:row.estimated_cost,cookwareTypes:row.cookware_types,ingredients:row.ingredients,steps:row.steps,imageUrl:row.image_path,fallbackImageUrl:row.fallback_image_url,downloadedAt:null} satisfies RecipePackage;
  }
}
