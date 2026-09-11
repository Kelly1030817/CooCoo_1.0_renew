const normalize = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("zh-TW").replace(/[（(][^）)]*[）)]/g, "").trim();

const aliases: Record<string, string> = {
  egg: "蛋", eggs: "蛋", 雞蛋: "蛋", 蛋: "蛋",
  tofu: "豆腐", 豆腐: "豆腐",
  peanut: "花生", peanuts: "花生", 花生: "花生",
  shrimp: "蝦", prawn: "蝦", 蝦: "蝦", 蝦仁: "蝦",
  gluten: "麩質", wheat: "麩質", 小麥: "麩質", 麩質: "麩質",
  milk: "牛奶", dairy: "乳製品", 牛奶: "牛奶", 牛乳: "牛奶", 鮮乳: "牛奶", 乳製品: "乳製品",
  cheese: "起司", 起司: "起司", 芝士: "起司",
  chicken: "雞肉", chicken_breast: "雞肉", "chicken breast": "雞肉", 雞胸肉: "雞肉", 雞肉: "雞肉",
  chicken_thigh: "雞腿肉", "chicken thigh": "雞腿肉", 雞腿排: "雞腿肉", 雞腿肉: "雞腿肉",
  pork: "豬肉", pork_slices: "豬肉", "pork slices": "豬肉", 豬肉片: "豬肉", 豬肉: "豬肉",
  beef: "牛肉", beef_slices: "牛肉", "beef slices": "牛肉", 牛肉片: "牛肉", 牛肉: "牛肉",
  tomato: "番茄", tomatoes: "番茄", 番茄: "番茄", 蕃茄: "番茄",
  onion: "洋蔥", 洋蔥: "洋蔥",
  scallion: "青蔥", green_onion: "青蔥", "green onion": "青蔥", 青蔥: "青蔥", 蔥: "青蔥",
  carrot: "紅蘿蔔", 紅蘿蔔: "紅蘿蔔", 胡蘿蔔: "紅蘿蔔",
  enoki: "金針菇", enoki_mushroom: "金針菇", 金針菇: "金針菇",
  potato: "馬鈴薯", 馬鈴薯: "馬鈴薯",
  sweet_potato: "地瓜", "sweet potato": "地瓜", 地瓜: "地瓜",
  broccoli: "青花菜", 青花菜: "青花菜", 綠花椰菜: "青花菜",
  corn: "玉米粒", corn_kernels: "玉米粒", 玉米粒: "玉米粒",
  garlic: "蒜頭", 蒜頭: "蒜頭", 蒜米: "蒜頭",
  tuna: "鮪魚", 鮪魚: "鮪魚",
  rice: "白米", raw_rice: "白米", 白米: "白米", 白飯: "白飯",
  noodles: "麵條", noodle: "麵條", 麵: "麵條", 麵條: "麵條",
  udon: "烏龍麵", 烏龍麵: "烏龍麵",
  cooking_oil: "油", 食用油: "油", 油: "油",
  soy_sauce: "醬油", 醬油: "醬油",
  miso: "味噌", 味噌: "味噌",
  mirin: "味醂", 味醂: "味醂",
  sesame: "芝麻", 芝麻: "芝麻", sesame_sauce: "胡麻醬", 胡麻醬: "胡麻醬",
};

export const canonicalIngredient = (value: string) => aliases[normalize(value)] ?? normalize(value);

export function sameIngredient(
  left: { ingredientKey: string; name?: string },
  right: { ingredientKey: string; name?: string },
) {
  const leftTerms = [left.ingredientKey, left.name ?? ""].filter(Boolean).map(canonicalIngredient);
  const rightTerms = [right.ingredientKey, right.name ?? ""].filter(Boolean).map(canonicalIngredient);
  return leftTerms.some((term) => rightTerms.includes(term));
}
