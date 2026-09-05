import type { DietaryRestriction, MealSlot } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";
import { SupabaseOnboardingRepository } from "../onboarding/supabase-onboarding.repository";
import { assertDate } from "./meal-planning";
import type { PlanningDependencies } from "./routes";

export const cloudPlanningContext:PlanningDependencies["context"]=async(userId,weekStart)=>{
  assertDate(weekStart);
  const [onboarding,stock]=await Promise.all([new SupabaseOnboardingRepository().read(userId),getSupabaseAdmin().from("inventory_batches").select("id,name,ingredient_key,quantity,unit,expires_on").eq("user_id",userId).gt("quantity",0)]);
  if(stock.error)throw stock.error;
  if(!onboarding.profile||onboarding.profile.onboarding_status!=="complete")throw new Error("ONBOARDING_REQUIRED");
  const p=onboarding.profile;
  const cookware=(onboarding.cookware||[]).map(item=>({type:String(item.type),capacity:item.capacity as string|null,limitations:(item.limitations||[]) as string[]}));
  const restrictions=(onboarding.restrictions||[]).map(item=>({id:item.id,label:item.label,kind:item.kind,ingredientKeys:item.ingredient_keys,isHardLimit:item.is_hard_limit})) as DietaryRestriction[];
  const slots=p.planned_meal_slots as MealSlot[];
  return {weekStart,weeklyTarget:Number(p.weekly_home_cook_target),mealSlots:slots,servings:Number(p.household_servings),restrictions,cookware,cookwareTypes:cookware.map(item=>item.type),perMealBudget:Math.floor(p.daily_meal_budget/Math.max(1,slots.length)),inventory:(stock.data||[]).map(row=>({ingredientKey:row.ingredient_key,name:row.name,quantity:Number(row.quantity),unit:row.unit,daysLeft:row.expires_on?Math.floor((Date.parse(row.expires_on+"T23:59:59+08:00")-Date.now())/86400000):365})),ingredientIds:Object.fromEntries((stock.data||[]).map(row=>[row.id,row.name]))};
};
