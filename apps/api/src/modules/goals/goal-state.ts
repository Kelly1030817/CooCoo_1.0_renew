import type { AmountEvent, CookingPlan, MoneyGoal } from "@coocoo/contracts";
import { calculateEstimatedSaving, createMilestones } from "@coocoo/core";

type GoalRow = { id:string;purpose:string|null;name:string;target_amount:number;target_date:string|null;status:"active"|"completed"|"archived";created_at:string;completed_at:string|null };
type ProfileRow = { daily_meal_budget:number;outside_meal_price:number;weekly_home_cook_target:number;planned_meal_slots:string[] };
type GoalEventRow = { id:string;goal_id:string;type:"opening_balance"|"balance_adjustment"|"extra_deposit";amount:number;created_at:string };
type SavingsRow = { id:string;goal_id:string|null;cooking_session_id:string;confirmed_amount:number;created_at:string };

export function buildGoalState(input:{goal:GoalRow|null;profile:ProfileRow|null;goalEvents:GoalEventRow[];savingsEvents:SavingsRow[]}) {
  const goal:MoneyGoal|null=input.goal?{
    id:input.goal.id,
    purpose:input.goal.purpose||"dream",
    name:input.goal.name,
    targetAmount:input.goal.target_amount,
    targetDate:input.goal.target_date,
    status:input.goal.status,
    createdAt:input.goal.created_at,
    completedAt:input.goal.completed_at,
    milestones:createMilestones(input.goal.target_amount).milestones,
  }:null;
  const slotCount=Math.max(1,input.profile?.planned_meal_slots?.length||1);
  const homeCookBudget=input.profile?Math.floor(input.profile.daily_meal_budget/slotCount):0;
  const cookingPlan:CookingPlan|null=input.profile?{
    eatingOutMeals:1,
    eatingOutTotal:input.profile.outside_meal_price,
    eatingOutCost:input.profile.outside_meal_price,
    homeCookBudget,
    weeklyCookingMeals:input.profile.weekly_home_cook_target,
    estimatedSavingPerMeal:calculateEstimatedSaving(input.profile.outside_meal_price,homeCookBudget),
    updatedAt:new Date().toISOString(),
  }:null;
  const ownGoalId=goal?.id;
  const amountEvents:AmountEvent[]=[
    ...input.goalEvents.filter(row=>row.goal_id===ownGoalId).map(row=>({id:row.id,goalId:row.goal_id,type:row.type,amount:row.amount,createdAt:row.created_at})),
    ...input.savingsEvents.filter(row=>row.goal_id===ownGoalId).map(row=>({id:row.id,goalId:row.goal_id!,outcomeId:row.cooking_session_id,type:"meal_deposit" as const,amount:row.confirmed_amount,createdAt:row.created_at})),
  ].sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  return {goal,cookingPlan,amountEvents};
}
