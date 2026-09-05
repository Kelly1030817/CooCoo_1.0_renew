import type {
  DietaryRestriction,
  MealPlan,
  MealServing,
  PlannedMeal,
  RecipePackage,
  SavingsEvent,
} from "@coocoo/contracts";

export interface RecommendationContext {
  restrictions: DietaryRestriction[];
  cookwareTypes: string[];
  dailyBudget: number;
  energyLevel: "low" | "normal";
}

export interface RecipeEligibility {
  eligible: boolean;
  reasons: string[];
  quickMeal: boolean;
  lowEnergyMeal: boolean;
}

export const brandSafeRecipes: RecipePackage[] = [
  {
    id:"brand-tomato-egg-v1",recipeId:"11111111-1111-4111-8111-111111111111",title:"番茄滑蛋飯",servings:1,prepMinutes:7,totalMinutes:20,estimatedCost:72,cookwareTypes:["電磁爐"],
    ingredients:[
      {ingredientKey:"蛋",name:"雞蛋",quantity:2,unit:"顆",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"番茄",name:"番茄",quantity:2,unit:"顆",isPantryStaple:false,isVegetable:true,coveredByInventory:false},
      {ingredientKey:"白飯",name:"白飯",quantity:1,unit:"碗",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
    ],
    steps:[
      {id:"te-1",order:1,instruction:"番茄切成小塊，雞蛋打散。",voiceText:"番茄切成小塊，雞蛋打散。",timerSeconds:null,safetyNote:"切菜時讓指尖向內收。"},
      {id:"te-2",order:2,instruction:"鍋中少量油，中火炒蛋到半熟後先盛起。",voiceText:"中火炒蛋到半熟後先盛起。",timerSeconds:90,safetyNote:null},
      {id:"te-3",order:3,instruction:"同鍋炒番茄至出汁，放回雞蛋拌勻。",voiceText:"炒番茄至出汁，放回雞蛋拌勻。",timerSeconds:180,safetyNote:"蛋液需完全凝固。"},
    ],imageUrl:null,fallbackImageUrl:"/favicon.svg",downloadedAt:null,
  },
  {
    id:"brand-miso-udon-v1",recipeId:"22222222-2222-4222-8222-222222222222",title:"味噌蔬菜烏龍麵",servings:1,prepMinutes:5,totalMinutes:15,estimatedCost:65,cookwareTypes:["電磁爐"],
    ingredients:[
      {ingredientKey:"青菜",name:"當季青菜",quantity:1,unit:"把",isPantryStaple:false,isVegetable:true,coveredByInventory:false},
      {ingredientKey:"蛋",name:"雞蛋",quantity:1,unit:"顆",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"烏龍麵",name:"冷凍烏龍麵",quantity:1,unit:"包",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"味噌",name:"味噌",quantity:1,unit:"大匙",isPantryStaple:true,isVegetable:false,coveredByInventory:false},
    ],
    steps:[
      {id:"mu-1",order:1,instruction:"一鍋水煮滾，放入烏龍麵與青菜。",voiceText:"一鍋水煮滾，放入烏龍麵與青菜。",timerSeconds:180,safetyNote:"避免蒸氣燙傷。"},
      {id:"mu-2",order:2,instruction:"打入雞蛋，煮到蛋白完全凝固。",voiceText:"打入雞蛋，煮到蛋白完全凝固。",timerSeconds:150,safetyNote:"雞蛋需完全熟透。"},
      {id:"mu-3",order:3,instruction:"關火後再拌入味噌。",voiceText:"關火後再拌入味噌。",timerSeconds:null,safetyNote:null},
    ],imageUrl:null,fallbackImageUrl:"/favicon.svg",downloadedAt:null,
  },
  {
    id:"brand-sesame-chicken-v1",recipeId:"33333333-3333-4333-8333-333333333333",title:"胡麻雞絲拌麵",servings:1,prepMinutes:8,totalMinutes:25,estimatedCost:88,cookwareTypes:["電磁爐"],
    ingredients:[
      {ingredientKey:"青菜",name:"當季青菜",quantity:1,unit:"把",isPantryStaple:false,isVegetable:true,coveredByInventory:false},
      {ingredientKey:"雞肉",name:"雞胸肉",quantity:120,unit:"克",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"麵",name:"麵條",quantity:1,unit:"份",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"芝麻",name:"胡麻醬",quantity:1,unit:"大匙",isPantryStaple:true,isVegetable:false,coveredByInventory:false},
    ],
    steps:[
      {id:"sc-1",order:1,instruction:"雞胸肉煮至中心完全熟透後撕成絲。",voiceText:"雞胸肉煮熟後撕成絲。",timerSeconds:600,safetyNote:"雞肉中心不可呈粉紅色。"},
      {id:"sc-2",order:2,instruction:"同鍋煮麵與青菜，撈起瀝乾。",voiceText:"同鍋煮麵與青菜，撈起瀝乾。",timerSeconds:300,safetyNote:"撈麵時小心熱水。"},
      {id:"sc-3",order:3,instruction:"拌入雞絲與胡麻醬。",voiceText:"拌入雞絲與胡麻醬。",timerSeconds:null,safetyNote:"芝麻過敏者不可食用。"},
    ],imageUrl:null,fallbackImageUrl:"/favicon.svg",downloadedAt:null,
  },
];

export function rankRecipes(recipes:RecipePackage[],context:RecommendationContext,inventory:Array<{ingredientKey:string;daysLeft:number}>) {
  const available=new Map(inventory.map(item=>[normalize(item.ingredientKey),item.daysLeft]));
  return recipes.map(recipe=>({recipe,eligibility:evaluateRecipe(recipe,context),score:recipe.ingredients.reduce((score,item)=>{
    const days=available.get(normalize(item.ingredientKey));
    return score+(days===undefined?0:days<=3?100:20);
  },0)-recipe.estimatedCost/10})).filter(item=>item.eligibility.eligible).sort((a,b)=>b.score-a.score);
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("zh-TW");

export function isCookwareSufficient(required: string, available: Set<string>): boolean {
  const norm = normalize(required);
  if (available.has(norm)) return true;
  if (norm === "電磁爐" || norm === "瓦斯爐") {
    const directHeaters = ["瓦斯爐", "電磁爐", "ih爐", "卡式爐", "黑晶爐", "快煮鍋", "電子壓力鍋", "電鍋"];
    return directHeaters.some((h) => available.has(normalize(h)));
  }
  return false;
}

export function evaluateRecipe(
  recipe: RecipePackage,
  context: RecommendationContext,
): RecipeEligibility {
  const ingredientKeys = new Set(recipe.ingredients.map((item) => normalize(item.ingredientKey)));
  const hardRestrictions = context.restrictions.filter((item) => item.isHardLimit);
  const blocked = hardRestrictions.filter((restriction) =>
    restriction.ingredientKeys.some((key) => ingredientKeys.has(normalize(key))),
  );
  const availableCookware = new Set(context.cookwareTypes.map(normalize));
  const missingCookware = recipe.cookwareTypes.filter((item) => !isCookwareSufficient(item, availableCookware));
  const cost = recipe.estimatedCost;
  const reasons: string[] = [];
  if (blocked.length) reasons.push(`含有禁用食材：${blocked.map((item) => item.label).join("、")}`);
  if (missingCookware.length) reasons.push(`缺少廚具：${missingCookware.join("、")}`);
  if (cost > context.dailyBudget) reasons.push("超出本餐可用預算");
  const lowEnergyMeal = recipe.totalMinutes <= 30 && recipe.steps.length <= 6 && recipe.cookwareTypes.length <= 2;
  if (context.energyLevel === "low" && !lowEnergyMeal) reasons.push("不符合低體力餐條件");
  return {
    eligible: reasons.length === 0,
    reasons,
    quickMeal: recipe.totalMinutes <= 15,
    lowEnergyMeal,
  };
}

export function calculateIngredientOverlap(meals: PlannedMeal[]): number {
  const uses = new Map<string, Set<string>>();
  for (const meal of meals.filter((item) => item.status !== "cancelled")) {
    for (const ingredient of meal.ingredients.filter((item) => !item.isPantryStaple)) {
      const key = normalize(ingredient.ingredientKey);
      const mealIds = uses.get(key) ?? new Set<string>();
      mealIds.add(meal.id);
      uses.set(key, mealIds);
    }
  }
  if (!uses.size) return 0;
  const overlapping = [...uses.values()].filter((mealIds) => mealIds.size >= 2).length;
  return overlapping / uses.size;
}

export function calculateInventoryCoverage(meals: PlannedMeal[]): number {
  const requirements = meals
    .filter((item) => item.status !== "cancelled")
    .flatMap((meal) => meal.ingredients.filter((item) => !item.isPantryStaple));
  if (!requirements.length) return 0;
  return requirements.filter((item) => item.coveredByInventory).length / requirements.length;
}

export function refreshPlanRates(plan: MealPlan, updatedAt = new Date().toISOString()): MealPlan {
  return {
    ...plan,
    overlapRate: calculateIngredientOverlap(plan.meals),
    inventoryCoverageRate: calculateInventoryCoverage(plan.meals),
    updatedAt,
  };
}

export function postponeMeal(
  plan: MealPlan,
  mealId: string,
  choice: { kind: "next_slot" | "specific_date" | "cancel"; date?: string; slot?: PlannedMeal["slot"] },
): MealPlan {
  const meal = plan.meals.find((item) => item.id === mealId);
  if (!meal) throw new Error("PLANNED_MEAL_NOT_FOUND");
  const nextMeals = plan.meals.map((item) => item.id === mealId ? { ...item, status: "postponed" as const } : item);
  if (choice.kind === "cancel") {
    return refreshPlanRates({ ...plan, meals: nextMeals.map((item) => item.id === mealId ? { ...item, status: "cancelled" as const } : item) });
  }
  const target = choice.kind === "specific_date"
    ? { date: choice.date, slot: choice.slot }
    : findNextOpenSlot(nextMeals, meal.date, meal.slot);
  if (!target?.date || !target.slot) throw new Error("NEXT_MEAL_SLOT_NOT_FOUND");
  return refreshPlanRates({
    ...plan,
    meals: nextMeals.map((item) => item.id === mealId ? { ...item, date: target.date!, slot: target.slot!, status: "planned" as const } : item),
  });
}

function findNextOpenSlot(meals: PlannedMeal[], currentDate: string, currentSlot: PlannedMeal["slot"]) {
  const slots: PlannedMeal["slot"][] = ["breakfast", "lunch", "dinner"];
  const occupied = new Set(meals.filter((item) => item.status !== "cancelled").map((item) => `${item.date}:${item.slot}`));
  const cursor = new Date(`${currentDate}T12:00:00Z`);
  let index = slots.indexOf(currentSlot) + 1;
  for (let attempt = 0; attempt < 21; attempt += 1) {
    if (index >= slots.length) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      index = 0;
    }
    const date = cursor.toISOString().slice(0, 10);
    const slot = slots[index];
    index += 1;
    if (!occupied.has(`${date}:${slot}`)) return { date, slot };
  }
  return null;
}

export interface CookingCompletionInput {
  operationId: string;
  sessionId: string;
  servingsCooked: number;
  servingsEaten: number;
  outsideMealPrice: number;
  ingredientCost: number;
  confirmedSavings: number;
}

export interface CookingCompletionState {
  completedOperationIds: string[];
  servings: MealServing[];
  savingsEvents: SavingsEvent[];
}

export function completeCookingSession(
  state: CookingCompletionState,
  input: CookingCompletionInput,
  now = new Date().toISOString(),
): CookingCompletionState & { accepted: boolean; homeCookedMealsAdded: number } {
  if (state.completedOperationIds.includes(input.operationId)) {
    return { ...state, accepted: false, homeCookedMealsAdded: 0 };
  }
  if (input.servingsEaten > input.servingsCooked || input.servingsEaten < 0) {
    throw new Error("INVALID_SERVING_COUNT");
  }
  const maximumSaving = Math.max(0, input.outsideMealPrice * input.servingsEaten - input.ingredientCost);
  if (input.confirmedSavings > maximumSaving) throw new Error("SAVINGS_EXCEEDS_CALCULATED_AMOUNT");
  const servings = Array.from({ length: input.servingsCooked }, (_, index): MealServing => ({
    id: `${input.sessionId}:serving:${index + 1}`,
    cookingSessionId: input.sessionId,
    status: index < input.servingsEaten ? "eaten" : "prepared_inventory",
    eatenAt: index < input.servingsEaten ? now : null,
    vegetableKeys: [],
  }));
  const savingsEvents = input.confirmedSavings > 0 ? [...state.savingsEvents, {
    id: `${input.operationId}:savings`,
    cookingSessionId: input.sessionId,
    outsideMealPrice: input.outsideMealPrice,
    actualIngredientCost: input.ingredientCost,
    confirmedAmount: input.confirmedSavings,
    createdAt: now,
  }] : state.savingsEvents;
  return {
    completedOperationIds: [...state.completedOperationIds, input.operationId],
    servings: [...state.servings, ...servings],
    savingsEvents,
    accepted: true,
    homeCookedMealsAdded: input.servingsEaten,
  };
}
