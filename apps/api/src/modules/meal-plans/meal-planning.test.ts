import { describe, expect, test } from "bun:test";
import { buildWeeklyStockupDraft, createMealPlan, createTodayDecision, unfilledMealSlots } from "./meal-planning";

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
  test("strict catalog leaves explicit gaps instead of repeating or inventing recipes",()=>{
    const strict={...context,strictCatalog:true,recipes:[]};
    const plan=createMealPlan(strict);
    expect(plan.meals).toHaveLength(0);
    expect(unfilledMealSlots(strict,plan)).toEqual([
      {date:"2026-09-07",slot:"dinner"},
      {date:"2026-09-08",slot:"dinner"},
      {date:"2026-09-09",slot:"dinner"},
    ]);
  });

  test("starts a weekly stockup plan on the first open date instead of scheduling past meals",()=>{
    let id=0;
    const plan=createMealPlan(context,{startDate:"2026-09-10",mealCount:2,id:()=>`00000000-0000-4000-8000-${String(++id).padStart(12,"0")}`});
    expect(plan.meals.map(meal=>meal.date)).toEqual(["2026-09-10","2026-09-11"]);
  });

  test("combines the full week and subtracts inventory once for a single stockup list",()=>{
    let id=0;
    const plan=createMealPlan({...context,weeklyTarget:2,inventory:[]},{mealCount:2,id:()=>`00000000-0000-4000-8000-${String(++id).padStart(12,"0")}`});
    plan.meals[1]={...plan.meals[1],ingredients:structuredClone(plan.meals[0].ingredients)};
    const ingredient=plan.meals[0].ingredients[0];
    const draft=buildWeeklyStockupDraft(plan,[{ingredientKey:ingredient.ingredientKey,name:ingredient.name,quantity:ingredient.quantity/2,unit:ingredient.unit,daysLeft:2}]);
    const item=draft.find(value=>value.ingredientKey===ingredient.ingredientKey);
    expect(item?.plannedMeals).toBe(2);
    expect(item?.quantity).toBe(ingredient.quantity*1.5);
  });

  test("rejects a meal count that cannot fit in the remaining week",()=>{
    expect(()=>createMealPlan(context,{startDate:"2026-09-13",mealCount:2})).toThrow("WEEKLY_TARGET_EXCEEDS_REMAINING_SLOTS");
  });
});
