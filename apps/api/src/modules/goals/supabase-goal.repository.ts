import type { GoalDraft } from "@coocoo/contracts";
import { calculateGoalProjection, createGoalFromDraft } from "@coocoo/core";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";
import { buildGoalState } from "./goal-state";

export class SupabaseGoalRepository {
  async read(userId:string) {
    const client=getSupabaseAdmin();
    const [goal,profile,goalEvents,savingsEvents]=await Promise.all([
      client.from("goals").select("*").eq("user_id",userId).in("status",["active","completed"]).order("created_at",{ascending:false}).limit(1).maybeSingle(),
      client.from("profiles").select("daily_meal_budget,outside_meal_price,weekly_home_cook_target,planned_meal_slots").eq("user_id",userId).maybeSingle(),
      client.from("goal_amount_events").select("*").eq("user_id",userId).order("created_at"),
      client.from("savings_events").select("id,goal_id,cooking_session_id,confirmed_amount,created_at").eq("user_id",userId).order("created_at"),
    ]);
    for(const result of [goal,profile,goalEvents,savingsEvents])if(result.error)throw result.error;
    return buildGoalState({goal:goal.data,profile:profile.data,goalEvents:goalEvents.data||[],savingsEvents:savingsEvents.data||[]});
  }

  async create(userId:string,draft:GoalDraft) {
    const checked=createGoalFromDraft(draft);
    if(!checked.valid)return checked;
    const {error}=await getSupabaseAdmin().rpc("replace_goal_settings",{p_user_id:userId,p_draft:draft});
    if(error)throw error;
    const state=await this.read(userId);
    const currentSaved=state.amountEvents.reduce((sum,event)=>sum+event.amount,0);
    return {valid:true as const,errors:[],goal:state.goal!,cookingPlan:state.cookingPlan!,openingEvent:state.amountEvents[0],projection:calculateGoalProjection({targetAmount:state.goal!.targetAmount,currentSavedAmount:currentSaved,estimatedSavingPerMeal:state.cookingPlan!.estimatedSavingPerMeal,weeklyCookingMeals:state.cookingPlan!.weeklyCookingMeals,targetDate:state.goal!.targetDate})};
  }

  async update(userId:string,goalId:string,patch:Record<string,unknown>) {
    const {error}=await getSupabaseAdmin().rpc("update_goal_settings",{p_user_id:userId,p_goal_id:goalId,p_patch:patch});
    if(error)throw error;
    return this.read(userId);
  }
}
