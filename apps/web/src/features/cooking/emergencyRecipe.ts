import type { DietaryRestriction, RecipePackage } from "@coocoo/contracts";

export const LOW_ENERGY_EMERGENCY_RECIPE: RecipePackage = {
  id: "recipe-pkg-sesame-oil-egg-noodles",
  recipeId: "recipe-sesame-oil-egg-noodles",
  source: "brand_safe",
  title: "麻油焦香煎蛋湯麵",
  servings: 1,
  prepMinutes: 2,
  totalMinutes: 11,
  estimatedCost: 45,
  cookwareTypes: ["單平底鍋或小湯鍋"],
  imageUrl: null,
  fallbackImageUrl: "",
  downloadedAt: null,
  ingredients: [
    {
      ingredientKey: "egg",
      name: "雞蛋",
      quantity: 1,
      unit: "顆",
      isPantryStaple: true,
      isVegetable: false,
      coveredByInventory: true,
    },
    {
      ingredientKey: "greens",
      name: "青菜",
      quantity: 1,
      unit: "株",
      isPantryStaple: false,
      isVegetable: true,
      coveredByInventory: true,
    },
    {
      ingredientKey: "noodles",
      name: "烏龍麵",
      quantity: 1,
      unit: "包",
      isPantryStaple: true,
      isVegetable: false,
      coveredByInventory: true,
    },
  ],
  steps: [
    {
      id: "step-1",
      order: 1,
      instruction: "單鍋熱鍋下麻油，打入雞蛋中火煎至邊緣微焦香酥脆（約 2 分鐘）。",
      voiceText: "單鍋熱鍋下麻油，打入雞蛋中火煎至邊緣微焦香酥脆",
      timerSeconds: 120,
      safetyNote: "熱油留意油花噴濺，下蛋後轉中小火",
    },
    {
      id: "step-2",
      order: 2,
      instruction: "免換鍋！直接沖入 400ml 熱開水，大火滾煮 1 分鐘激發濃郁白湯底。",
      voiceText: "免換鍋，直接沖入熱開水，大火滾煮激發濃郁白湯底",
      timerSeconds: 60,
      safetyNote: null,
    },
    {
      id: "step-3",
      order: 3,
      instruction: "放入烏龍麵與青菜，中火燜煮 3 分鐘，加少許鹽與白胡椒調味。",
      voiceText: "放入烏龍麵與青菜，中火燜煮三分鐘，加少許鹽與白胡椒調味",
      timerSeconds: 180,
      safetyNote: null,
    },
    {
      id: "step-4",
      order: 4,
      instruction: "整鍋端起即可享用！全程僅用 1 個鍋子，美味暖胃又免洗多餘碗盤。",
      voiceText: "整鍋端起即可享用，全程僅用一個鍋子",
      timerSeconds: null,
      safetyNote: null,
    },
  ],
};

export interface EmergencyMissingItem {
  key: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  estCost: number;
}

export const EMERGENCY_RECIPE_REQUIREMENTS: EmergencyMissingItem[] = [
  { key: "egg", name: "雞蛋", category: "protein", qty: 1, unit: "盒", estCost: 65 },
  { key: "greens", name: "青江菜", category: "produce", qty: 1, unit: "包", estCost: 35 },
  { key: "noodles", name: "烏龍麵", category: "pantry", qty: 1, unit: "包", estCost: 30 },
];

const emergencyDietaryTokens = new Set([
  "egg",
  "蛋",
  "雞蛋",
  "gluten",
  "wheat",
  "麩質",
  "小麥",
  "全素",
]);

const compatibleEmergencyHeaters = new Set([
  "瓦斯爐",
  "電磁爐",
  "ih爐",
  "卡式爐",
  "黑晶爐",
  "快煮鍋",
  "電子壓力鍋",
  "電鍋",
]);

export function hasCompatibleEmergencyCookware(cookwareTypes: string[] = []) {
  return cookwareTypes.some((type) =>
    compatibleEmergencyHeaters.has(type.trim().toLocaleLowerCase("zh-TW")),
  );
}

export function findEmergencyRecipeRestriction(
  restrictions: DietaryRestriction[] = [],
) {
  return restrictions.find((restriction) => {
    if (!restriction.isHardLimit) return false;
    const tokens = [restriction.label, ...restriction.ingredientKeys]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return tokens.some((token) =>
      [...emergencyDietaryTokens].some(
        (blocked) => token.includes(blocked) || blocked.includes(token),
      ),
    );
  });
}

export function checkEmergencyIngredients(inventoryNames: string[] = []) {
  const isMatch = (keywords: string[]) =>
    inventoryNames.some((inv) => keywords.some((k) => inv.includes(k)));

  const missing: EmergencyMissingItem[] = [];
  if (!isMatch(["蛋", "雞蛋"])) {
    missing.push(EMERGENCY_RECIPE_REQUIREMENTS[0]);
  }
  if (!isMatch(["菜", "青江菜", "高麗菜", "菠菜", "小白菜", "蔬"])) {
    missing.push(EMERGENCY_RECIPE_REQUIREMENTS[1]);
  }
  if (!isMatch(["麵", "烏龍麵", "意麵", "拉麵", "泡麵", "粉"])) {
    missing.push(EMERGENCY_RECIPE_REQUIREMENTS[2]);
  }

  return {
    isFullyCovered: missing.length === 0,
    missing,
  };
}
