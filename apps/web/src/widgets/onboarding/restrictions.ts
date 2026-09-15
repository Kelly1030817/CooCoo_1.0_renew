import type { DietaryRestriction } from "@coocoo/contracts";

export const restrictionQuickOptions: DietaryRestriction[] = [
  {
    id: "quick-peanut",
    label: "花生",
    kind: "allergy",
    ingredientKeys: ["花生", "花生醬"],
    isHardLimit: true,
  },
  {
    id: "quick-tree-nuts",
    label: "堅果",
    kind: "allergy",
    ingredientKeys: ["堅果", "腰果", "杏仁", "核桃"],
    isHardLimit: true,
  },
  {
    id: "quick-shellfish",
    label: "蝦蟹",
    kind: "allergy",
    ingredientKeys: ["蝦", "蟹", "甲殼類"],
    isHardLimit: true,
  },
  { id: "quick-fish", label: "魚", kind: "allergy", ingredientKeys: ["魚"], isHardLimit: true },
  {
    id: "quick-egg",
    label: "蛋",
    kind: "allergy",
    ingredientKeys: ["蛋", "雞蛋"],
    isHardLimit: true,
  },
  {
    id: "quick-milk",
    label: "牛奶",
    kind: "allergy",
    ingredientKeys: ["牛奶", "乳製品", "奶油", "起司"],
    isHardLimit: true,
  },
  {
    id: "quick-gluten",
    label: "小麥／麩質",
    kind: "allergy",
    ingredientKeys: ["小麥", "麩質", "麵粉", "麵包", "麵條"],
    isHardLimit: true,
  },
  {
    id: "quick-soy",
    label: "黃豆",
    kind: "allergy",
    ingredientKeys: ["黃豆", "大豆", "豆漿", "豆腐"],
    isHardLimit: true,
  },
];

export function hasRestriction(restrictions: DietaryRestriction[], option: DietaryRestriction) {
  return restrictions.some((item) => item.id === option.id || item.label === option.label);
}

export function toggleRestriction(restrictions: DietaryRestriction[], option: DietaryRestriction) {
  if (hasRestriction(restrictions, option)) {
    return restrictions.filter((item) => item.id !== option.id && item.label !== option.label);
  }
  return [...restrictions, option];
}

export function addCustomRestriction(restrictions: DietaryRestriction[], label: string) {
  const value = label.trim();
  if (!value || restrictions.some((item) => item.label === value)) return restrictions;
  return [
    ...restrictions,
    {
      id: `custom-${value}`,
      label: value,
      kind: "allergy" as const,
      ingredientKeys: [value],
      isHardLimit: true,
    },
  ];
}
