export type IngredientCategory =
  | "melon"
  | "mushroom"
  | "root"
  | "leafy"
  | "egg_dairy_bean"
  | "meat_seafood"
  | "staple"
  | "condiment"
  | "general";

export function detectIngredientCategory(name: string): IngredientCategory {
  const n = name.trim().toLowerCase();

  if (/水餃|餃子|餛飩|烏龍|拉麵|義大利麵|通心麵|冬粉|米粉|麵條|白飯|糙米飯|年糕|吐司|麵包/.test(n) || (/(飯|麵|粉)$/.test(n) && !/胡椒粉|辣椒粉|太白粉|地瓜粉/.test(n))) return "staple";
  if (/蛋|豆腐|豆漿|豆花|豆皮|豆包|乾絲|起司|乳酪|起士|牛奶|優格|毛豆|黃豆|黑豆/.test(n)) return "egg_dairy_bean";
  if (/食用油|橄欖油|香油|沙拉油|麻油|醬油|蠔油|豆瓣醬|番茄醬|沙茶|味醂|胡椒|鹽巴|海鹽|砂糖|黑糖|烏醋|白醋|味噌|辣醬|辣椒醬|美乃滋|泡菜|醃|漬|醬/.test(n)) return "condiment";
  if (/肉|豬|牛|雞|羊|鴨|鵝|魚|蝦|蛤|蚵|花枝|魷魚|干貝|海鮮|培根|火腿|熱狗|香腸|絞肉/.test(n)) return "meat_seafood";
  if (/菇|木耳|蕈|蘑菇|菌/.test(n)) return "mushroom";
  if (/菜|葉|菠菜|空心菜|小白菜|青江菜|地瓜葉|茼蒿|水蓮|萵苣|娃娃菜|羽衣甘藍|芥藍/.test(n)) return "leafy";
  if (/地瓜|番薯|馬鈴薯|山藥|芋頭|蓮藕|牛蒡|竹筍|筍|蘿蔔|洋蔥|洋葱|蒜|蒜頭|蔥|蔥花|青蔥|薑|老薑|生薑/.test(n)) return "root";
  if (/節瓜|櫛瓜|南瓜|絲瓜|苦瓜|冬瓜|胡瓜|小黃瓜|大黃瓜|佛手瓜|扁蒲|瓠瓜|木瓜|西瓜|瓜/.test(n)) return "melon";
  if (/米|麥|麵|飯/.test(n)) return "staple";
  if (/油|鹽|糖|醋|醬/.test(n)) return "condiment";
  return "general";
}
