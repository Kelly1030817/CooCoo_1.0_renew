import type { MealPlan, PlannedMeal, RecipePackage } from "@coocoo/contracts";
import type { PlanningRepository } from "./routes";
import { packageForMeal } from "./meal-planning";

// Test/explicit local-preview adapter; production uses Supabase.
export class MemoryPlanningRepository implements PlanningRepository {
  private plans=new Map<string,{plan:MealPlan;packages:RecipePackage[]}>();
  private recipes=new Map<string,RecipePackage>();
  async current(userId:string,weekStart:string){return structuredClone(this.plans.get(userId+":"+weekStart)||null)}
  async save(userId:string,plan:MealPlan,suppliedPackages?:RecipePackage[]){const key=userId+":"+plan.weekStart;if(!this.plans.has(key)){const packages=suppliedPackages||plan.meals.map(m=>packageForMeal(m));this.plans.set(key,{plan:structuredClone(plan),packages});for(const recipe of packages)this.recipes.set(userId+":"+recipe.recipeId,recipe)}return (await this.current(userId,plan.weekStart))!}
  async reschedule(userId:string,plan:MealPlan,meal:PlannedMeal,expected:string){const value=this.plans.get(userId+":"+plan.weekStart);if(!value)throw new Error("PLANNED_MEAL_NOT_FOUND");if(value.plan.updatedAt!==expected)throw new Error("MEAL_PLAN_CONFLICT");value.plan={...value.plan,updatedAt:new Date(Math.max(Date.now(),Date.parse(expected)+1)).toISOString(),meals:value.plan.meals.map(item=>item.id===meal.id?structuredClone(meal):item)}}
  async package(userId:string,id:string){const value=this.recipes.get(userId+":"+id);if(!value)throw new Error("RECIPE_PACKAGE_NOT_FOUND");return structuredClone(value)}
  async savePackage(userId:string,recipe:RecipePackage,source:RecipePackage['source']='brand_safe'){const id=crypto.randomUUID();const value={...recipe,source,id:"package-"+id,recipeId:id};this.recipes.set(userId+":"+id,structuredClone(value));return value}
}
