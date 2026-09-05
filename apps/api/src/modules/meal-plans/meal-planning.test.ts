import { describe, expect, test } from "bun:test";
import { createMealPlan, createTodayDecision } from "./meal-planning";

const context={
  weekStart:"2026-09-07",
  weeklyTarget:3,
  mealSlots:["dinner"] as const,
  servings:1,
  restrictions:[{id:"peanut",label:"花生過敏",kind:"allergy" as const,ingredientKeys:["花生"],isHardLimit:true}],
  cookwareTypes:["電磁爐"],
  perMealBudget:100,
  inventory:[{ingredientKey:"番茄",daysLeft:1}],
};

describe("meal planning application service",()=>{
  test("creates a persisted-shape weekly plan from eligible recipes",()=>{
    let id=0;
    const plan=createMealPlan(context,{now:new Date("2026-09-04T00:00:00.000Z"),id:()=>`00000000-0000-4000-8000-${String(++id).padStart(12,"0")}`});
    expect(plan.meals).toHaveLength(3);
    expect(plan.meals[0]).toMatchObject({date:"2026-09-07",slot:"dinner",title:"番茄滑蛋飯"});
    expect(plan.overlapRate).toBeGreaterThan(0);
    expect(plan.meals.every(meal=>meal.estimatedCost<=100)).toBeTrue();
  });

  test("returns one primary choice and no unsafe alternatives",()=>{
    const decision=createTodayDecision({...context,energyLevel:"low"},{date:"2026-09-07",slot:"dinner"});
    expect(decision.primary?.title).toBe("番茄滑蛋飯");
    expect(decision.alternatives).toHaveLength(2);
    expect([decision.primary,...decision.alternatives].filter(Boolean).every(meal=>meal!.totalMinutes<=30)).toBeTrue();
  });
});
