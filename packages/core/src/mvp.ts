import type {
  DietaryRestriction,
  MealPlan,
  MealServing,
  PlannedMeal,
  RecipePackage,
  CookingCostRecord,
} from "@coocoo/contracts";
import { sameIngredient } from "./ingredient";

export interface RecommendationContext {
  restrictions: DietaryRestriction[];
  cookwareTypes: string[];
  dailyBudget: number | null;
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
      {ingredientKey:"番茄",name:"番茄",quantity:250,unit:"克",isPantryStaple:false,isVegetable:true,coveredByInventory:false},
      {ingredientKey:"白飯",name:"白飯",quantity:1,unit:"碗",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"油",name:"食用油",quantity:5,unit:"毫升",isPantryStaple:true,isVegetable:false,coveredByInventory:false},
    ],
    steps:[
      {id:"te-1",order:1,instruction:"將 250 克番茄洗淨後切成約 2 公分小塊；雞蛋打入碗中，攪拌到蛋白與蛋黃均勻。",compactInstruction:"250 克番茄切成 2 公分小塊，雞蛋打散。",guidance:{successCue:"番茄大小接近、蛋液顏色均勻且沒有明顯蛋白塊。",why:"大小一致能讓番茄受熱與出汁速度接近。",rescueTip:"番茄汁較多時先保留，炒番茄時再一起加入。"},voiceText:"將二百五十克番茄切成小塊，雞蛋打散。",timerSeconds:null,safetyNote:"切菜時讓指尖向內收。"},
      {id:"te-2",order:2,instruction:"鍋中加入少量油，以中火加熱後倒入蛋液；用鍋鏟由外往內推，約 90 秒炒到表面仍微濕的半熟狀態，立刻盛起。",compactInstruction:"少量油中火炒蛋約 90 秒，表面微濕時先盛起。",guidance:{successCue:"蛋大致凝固、表面仍帶光澤，鍋底沒有焦褐色。",why:"先盛起可避免回鍋後過熟變乾。",rescueTip:"蛋凝固太快時立刻關小火並把鍋移離爐面。"},voiceText:"中火炒蛋到半熟後先盛起。",timerSeconds:90,safetyNote:null},
      {id:"te-3",order:3,instruction:"使用同一鍋以中火炒番茄約 3 分鐘，直到果肉變軟並明顯出汁；放回先盛起的雞蛋拌勻，繼續加熱到蛋液完全凝固。",compactInstruction:"同鍋中火炒番茄 3 分鐘至出汁，放回雞蛋拌至完全凝固。",guidance:{successCue:"番茄有汁、蛋塊熟透且看不到流動蛋液。",why:"番茄先出汁能形成醬汁，也讓雞蛋回鍋後均勻裹味。",rescueTip:"鍋底太乾時加入一大匙水，避免加更多油。"},voiceText:"炒番茄至出汁，放回雞蛋拌勻。",timerSeconds:180,safetyNote:"蛋液需完全凝固。"},
    ],imageUrl:null,fallbackImageUrl:"/favicon.svg",downloadedAt:null,
  },
  {
    id:"brand-miso-udon-v1",recipeId:"22222222-2222-4222-8222-222222222222",title:"味噌蔬菜烏龍麵",servings:1,prepMinutes:5,totalMinutes:15,estimatedCost:65,cookwareTypes:["電磁爐"],
    ingredients:[
      {ingredientKey:"青花菜",name:"青花菜",quantity:100,unit:"克",isPantryStaple:false,isVegetable:true,coveredByInventory:false},
      {ingredientKey:"蛋",name:"雞蛋",quantity:1,unit:"顆",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"烏龍麵",name:"冷凍烏龍麵",quantity:1,unit:"包",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"味噌",name:"味噌",quantity:18,unit:"克",isPantryStaple:true,isVegetable:false,coveredByInventory:false},
    ],
    steps:[
      {id:"mu-1",order:1,instruction:"鍋中加水煮到持續冒大泡，放入烏龍麵與 100 克青花菜，以中火煮 3 分鐘；麵條自然散開後再輕輕攪動。",compactInstruction:"水滾後放入烏龍麵與 100 克青花菜，中火煮 3 分鐘。",guidance:{successCue:"麵條已散開且中心沒有硬芯，青花菜轉為鮮綠。",why:"等麵條受熱後再攪動，比較不容易斷裂。",rescueTip:"湯汁快溢出時轉小火並短暫移開鍋蓋。"},voiceText:"一鍋水煮滾，放入烏龍麵與一百克青花菜。",timerSeconds:180,safetyNote:"避免蒸氣燙傷。"},
      {id:"mu-2",order:2,instruction:"維持中火，將雞蛋打入鍋中後煮約 2 分 30 秒；確認蛋白與蛋黃都完全凝固，不可留下流動蛋液。",compactInstruction:"打入雞蛋，中火煮 2 分 30 秒至蛋白蛋黃完全凝固。",guidance:{successCue:"蛋白、蛋黃都已凝固，沒有透明或流動部分。",why:"雞蛋完全熟透可降低食安風險。",rescueTip:"蛋仍未凝固時每次延長 30 秒並再次確認。"},voiceText:"打入雞蛋，煮到蛋白完全凝固。",timerSeconds:150,safetyNote:"雞蛋需完全熟透。"},
      {id:"mu-3",order:3,instruction:"完全關火，先用少量熱湯把味噌調開，再倒回鍋中攪拌均勻；加入後不要重新煮滾。",compactInstruction:"關火後用熱湯調開味噌，倒回拌勻，不再煮滾。",guidance:{successCue:"味噌完全散開，湯中沒有明顯結塊。",why:"關火後再加味噌可避免香氣因持續沸騰而流失。",rescueTip:"仍有結塊時用湯勺背面壓散，不必重新開火。"},voiceText:"關火後再拌入味噌。",timerSeconds:null,safetyNote:null},
    ],imageUrl:null,fallbackImageUrl:"/favicon.svg",downloadedAt:null,
  },
  {
    id:"brand-sesame-chicken-v1",recipeId:"33333333-3333-4333-8333-333333333333",title:"胡麻雞絲拌麵",servings:1,prepMinutes:8,totalMinutes:25,estimatedCost:88,cookwareTypes:["電磁爐"],
    ingredients:[
      {ingredientKey:"青花菜",name:"青花菜",quantity:100,unit:"克",isPantryStaple:false,isVegetable:true,coveredByInventory:false},
      {ingredientKey:"雞肉",name:"雞胸肉",quantity:120,unit:"克",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"麵條",name:"麵條",quantity:100,unit:"克",isPantryStaple:false,isVegetable:false,coveredByInventory:false},
      {ingredientKey:"胡麻醬",name:"胡麻醬",quantity:20,unit:"毫升",isPantryStaple:true,isVegetable:false,coveredByInventory:false},
    ],
    steps:[
      {id:"sc-1",order:1,instruction:"雞胸肉放入滾水後轉中火煮約 10 分鐘；用食物溫度計插入最厚處，確認中心至少 74°C，再取出稍微放涼並撕成絲。",compactInstruction:"雞胸肉中火煮 10 分鐘，最厚處達 74°C 後取出撕絲。",guidance:{successCue:"食物溫度計在肉最厚處顯示至少 74°C。",why:"中心溫度是確認禽肉安全熟度的可靠依據。",rescueTip:"未達 74°C 時放回鍋中，每次加熱 1 分鐘後重新測量。"},voiceText:"雞胸肉中心至少七十四度後撕成絲。",timerSeconds:600,safetyNote:"使用食物溫度計確認中心至少 74°C，不以顏色作為唯一熟度判斷。"},
      {id:"sc-2",order:2,instruction:"使用同一鍋水，放入 100 克麵條與 100 克青花菜煮 5 分鐘；確認麵條沒有硬芯後，小心撈起並充分瀝乾。",compactInstruction:"同鍋煮 100 克麵條與 100 克青花菜 5 分鐘，撈起瀝乾。",guidance:{successCue:"麵條沒有硬芯，青花菜熟而仍保持綠色。",why:"同鍋烹煮可減少清洗，也能縮短準備時間。",rescueTip:"麵條仍偏硬時每次延長 30 秒並試吃確認。"},voiceText:"同鍋煮一百克麵條與一百克青花菜，撈起瀝乾。",timerSeconds:300,safetyNote:"撈麵時小心熱水。"},
      {id:"sc-3",order:3,instruction:"把瀝乾的麵、青花菜與雞絲放入碗中，加入 20 毫升胡麻醬，從底部翻拌到所有食材均勻裹上醬汁。",compactInstruction:"麵、青花菜與雞絲加入 20 毫升胡麻醬，拌勻即可。",guidance:{successCue:"食材表面均勻裹上胡麻醬，碗底沒有大量未拌開的醬。",why:"趁食材仍微溫時拌醬會比較容易均勻。",rescueTip:"醬汁太稠時加入一茶匙煮麵水調開。"},voiceText:"拌入雞絲與胡麻醬。",timerSeconds:null,safetyNote:"芝麻過敏者不可食用。"},
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
    const directHeaters = ["瓦斯爐", "電磁爐", "ih爐", "卡式爐", "黑晶爐", "快煮鍋", "電子壓力鍋", "電鍋", "多功能電子鍋", "萬用鍋", "電子鍋"];
    return directHeaters.some((h) => available.has(normalize(h)));
  }
  return false;
}

export function evaluateRecipe(
  recipe: RecipePackage,
  context: RecommendationContext,
): RecipeEligibility {
  const hardRestrictions = context.restrictions.filter((item) => item.isHardLimit);
  const blocked = hardRestrictions.filter((restriction) =>
    [restriction.label, ...restriction.ingredientKeys].some((key) =>
      recipe.ingredients.some((ingredient) => sameIngredient(
        { ingredientKey: key, name: restriction.label },
        ingredient,
      )),
    ),
  );
  const availableCookware = new Set(context.cookwareTypes.map(normalize));
  const missingCookware = recipe.cookwareTypes.filter((item) => !isCookwareSufficient(item, availableCookware));
  const cost = recipe.estimatedCost;
  const reasons: string[] = [];
  if (blocked.length) reasons.push(`含有禁用食材：${blocked.map((item) => item.label).join("、")}`);
  if (missingCookware.length) reasons.push(`缺少廚具：${missingCookware.join("、")}`);
  if (context.dailyBudget !== null && cost > context.dailyBudget) reasons.push("超出本餐可用預算");
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
  ingredientCost: number;
  comparisonMealPrice?: number;
  trackCost: boolean;
}

export interface CookingCompletionState {
  completedOperationIds: string[];
  servings: MealServing[];
  cookingCosts: CookingCostRecord[];
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
  const servings = Array.from({ length: input.servingsCooked }, (_, index): MealServing => ({
    id: `${input.sessionId}:serving:${index + 1}`,
    cookingSessionId: input.sessionId,
    status: index < input.servingsEaten ? "eaten" : "prepared_inventory",
    eatenAt: index < input.servingsEaten ? now : null,
    vegetableKeys: [],
  }));
  const cookingCosts = input.trackCost ? [...state.cookingCosts, {
    id: `${input.operationId}:cost`,
    cookingSessionId: input.sessionId,
    comparisonMealPrice: Math.max(0, input.comparisonMealPrice ?? 0),
    actualIngredientCost: input.ingredientCost,
    difference: Math.max(0, (input.comparisonMealPrice ?? 0) - input.ingredientCost),
    createdAt: now,
  }] : state.cookingCosts;
  return {
    completedOperationIds: [...state.completedOperationIds, input.operationId],
    servings: [...state.servings, ...servings],
    cookingCosts,
    accepted: true,
    homeCookedMealsAdded: input.servingsEaten,
  };
}
