import type { DietaryRestriction, MealPlan, MealSlot, PlannedMeal, RecipePackage, TodayDecision, MealPostpone } from "@coocoo/contracts";
import { brandSafeRecipes, rankRecipes, refreshPlanRates } from "@coocoo/core";

export interface Stock { ingredientKey: string; name?: string; daysLeft: number; quantity?: number; unit?: string }
export interface MealPlanningContext {
  weekStart: string;
  weeklyTarget: number;
  mealSlots: readonly MealSlot[];
  servings: number;
  restrictions: DietaryRestriction[];
  cookwareTypes: string[];
  perMealBudget: number;
  inventory: Stock[];
  energyLevel?: "low" | "normal";
}
const normalize = (value: string) => value.trim().toLocaleLowerCase("zh-TW");
export function assertDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date+"T12:00:00Z")) || new Date(date+"T12:00:00Z").toISOString().slice(0,10) !== date) throw new Error("INVALID_DATE");
  return date;
}
export function dateAt(date: string, offset: number) {
  const value = new Date(assertDate(date)+"T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
export function taipeiDate() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0,10); }
export function weekOf(date: string) { const day = new Date(assertDate(date)+"T12:00:00Z").getUTCDay() || 7; return dateAt(date, 1-day); }

// Quantities describe the entire package. Only matching units count as available stock.
export function coverIngredients(ingredients: RecipePackage["ingredients"], inventory: Stock[]) {
  const remaining = inventory.map(item => ({ ...item, quantity: item.quantity ?? 0 }));
  return ingredients.map(ingredient => {
    let needed = ingredient.quantity;
    for (const stock of remaining) {
      if (stock.unit !== ingredient.unit || ![stock.ingredientKey, stock.name || ""].some(key => [ingredient.ingredientKey, ingredient.name].map(normalize).includes(normalize(key)))) continue;
      const used = Math.min(needed, stock.quantity);
      needed -= used; stock.quantity -= used;
    }
    return { ...ingredient, coveredByInventory: needed <= 0 };
  });
}
export function scalePackage(recipe: RecipePackage, servings: number, inventory: Stock[]): RecipePackage {
  const factor = servings / recipe.servings;
  return { ...structuredClone(recipe), servings, estimatedCost: Math.ceil(recipe.estimatedCost * factor), ingredients: coverIngredients(recipe.ingredients.map(item => ({ ...item, quantity: item.quantity * factor })), inventory), downloadedAt: null };
}
function eligiblePackages(context: MealPlanningContext) {
  return rankRecipes(brandSafeRecipes, { restrictions: context.restrictions, cookwareTypes: context.cookwareTypes, dailyBudget: context.perMealBudget, energyLevel: context.energyLevel || "normal" }, context.inventory)
    .map(({ recipe }) => scalePackage(recipe, context.servings, context.inventory));
}
export function createTodayDecision(context: MealPlanningContext, input: { date: string; slot: MealSlot }): TodayDecision {
  assertDate(input.date);
  const recipes = eligiblePackages(context);
  return { date: input.date, slot: input.slot, primary: recipes[0] ?? null, alternatives: recipes.slice(1,3), source: "brand_safe", notice: recipes.length ? "依你的飲食限制、廚具、預算與庫存挑選品牌食譜。" : "目前沒有符合飲食限制、廚具與預算的餐點，請調整設定後再試。" };
}
export function createMealPlan(context: MealPlanningContext, options: { now?: Date; id?: () => string } = {}): MealPlan {
  if (weekOf(context.weekStart) !== context.weekStart) throw new Error("WEEK_START_MUST_BE_MONDAY");
  const recipes = eligiblePackages(context);
  if (!recipes.length) throw new Error("NO_SAFE_RECIPE_AVAILABLE");
  if (!context.mealSlots.length || context.weeklyTarget < 1 || context.weeklyTarget > context.mealSlots.length * 7) throw new Error("WEEKLY_TARGET_EXCEEDS_SLOTS");
  const id = options.id || (() => crypto.randomUUID());
  const slots = Array.from({ length: 7 }, (_, day) => context.mealSlots.map(slot => ({ date: dateAt(context.weekStart,day), slot }))).flat();
  const meals: PlannedMeal[] = slots.slice(0, context.weeklyTarget).map((target,index) => {
    const recipe = recipes[index % recipes.length];
    return { id:id(), ...target, recipeId:id(), title:recipe.title, status:"planned", servings:recipe.servings, ingredients:recipe.ingredients, estimatedCost:recipe.estimatedCost, totalMinutes:recipe.totalMinutes, cookwareTypes:recipe.cookwareTypes, energyLevel:context.energyLevel || "normal" };
  });
  return refreshAvailability({ id:id(), weekStart:context.weekStart, meals, overlapRate:0, inventoryCoverageRate:0, updatedAt:(options.now || new Date()).toISOString() },context.inventory).plan;
}
export function refreshAvailability(plan: MealPlan, inventory: Stock[], today=taipeiDate()) {
  const active=plan.meals.filter(meal=>meal.status!=="cancelled" && meal.status!=="cooked").sort((a,b)=>a.date.localeCompare(b.date)||["breakfast","lunch","dinner"].indexOf(a.slot)-["breakfast","lunch","dinner"].indexOf(b.slot));
  const covered=coverIngredients(active.flatMap(meal=>meal.ingredients),inventory);
  let offset=0;
  const mapped=new Map(active.map(meal=>{const ingredients=covered.slice(offset,offset+meal.ingredients.length);offset+=meal.ingredients.length;return [meal.id,{...meal,ingredients}] as const}));
  const meals=plan.meals.map(meal=>mapped.get(meal.id)||meal);
  const expiryWarnings=Array.from(new Set(active.flatMap(meal=>meal.ingredients.flatMap(ingredient=>inventory.filter(stock=>normalize(stock.ingredientKey)===normalize(ingredient.ingredientKey)&&dateAt(today,stock.daysLeft)<meal.date).map(()=>ingredient.name+" 可能在 "+meal.date+" 料理前到期，請提早使用或確認保存方式。")))));
  const requirements=covered.filter(i=>!i.isPantryStaple);
  return { plan:{...refreshPlanRates({...plan,meals},plan.updatedAt),inventoryCoverageRate:requirements.length?requirements.filter(i=>i.coveredByInventory).length/requirements.length:0}, expiryWarnings };
}
export function rescheduleMeal(plan: MealPlan, mealId: string, command: MealPostpone, slots: readonly MealSlot[]) {
  const meal=plan.meals.find(item=>item.id===mealId);
  if(!meal)throw new Error("PLANNED_MEAL_NOT_FOUND");
  if(meal.status==="cooked"||meal.status==="cancelled")throw new Error("MEAL_NOT_EDITABLE");
  let date=command.date,slot=command.slot;
  const occupied=(d:string,s:MealSlot)=>plan.meals.some(item=>item.id!==mealId&&item.status!=="cancelled"&&item.date===d&&item.slot===s);
  if(command.kind==="next_slot") {
    const order=["breakfast","lunch","dinner"];
    const candidates=Array.from({length:8},(_,i)=>slots.map(s=>({date:dateAt(meal.date,i),slot:s}))).flat().filter(c=>c.date>meal.date||order.indexOf(c.slot)>order.indexOf(meal.slot));
    const target=candidates.find(c=>!occupied(c.date,c.slot));date=target?.date;slot=target?.slot;
  }
  if(command.kind!=="cancel") {
    if(!date||!slot||!slots.includes(slot))throw new Error("INVALID_MEAL_SLOT");
    assertDate(date);
    if(occupied(date,slot))throw new Error("MEAL_SLOT_OCCUPIED");
  }
  return {...plan,meals:plan.meals.map(item=>item.id!==mealId?item:{...item,date:date||item.date,slot:slot||item.slot,status:command.kind==="cancel"?"cancelled" as const:"planned" as const})};
}
export function packageForMeal(meal: PlannedMeal): RecipePackage {
  const source=brandSafeRecipes.find(recipe=>recipe.title===meal.title);
  if(!source)throw new Error("RECIPE_PACKAGE_NOT_FOUND");
  return {...structuredClone(source),id:"package-"+meal.recipeId,recipeId:meal.recipeId,servings:meal.servings,estimatedCost:meal.estimatedCost,ingredients:meal.ingredients,downloadedAt:null};
}
