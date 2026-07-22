// Built-in AI Storage Recommendation Engine for coocoo-webapp
export function getAISuggestedStorage(name, targetChamber = null) {
  if (!name) {
    return {
      chamber: "cold",
      recommendedChamber: "cold",
      coldDays: 5,
      frozenDays: 30,
      daysLeft: 5,
      category: "vegetable_fruit",
      storageProtocol: "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。",
    };
  }
  const cleanName = name.trim().toLowerCase();

  let chamber = "cold";
  let coldDays = 5;
  let frozenDays = 30;
  let category = "vegetable_fruit";
  let storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";

  if (cleanName.match(/肉|雞|豬|牛|羊|排|絞肉|肉絲|培根|火腿|香腸/)) {
    category = "meat_seafood";
    chamber = "cold";
    coldDays = cleanName.includes("絞肉") ? 2 : (cleanName.includes("牛") ? 4 : 3);
    frozenDays = 90;
    storageProtocol = "組織液阻斷：冷凍前必須以紙巾緊密包裹吸附組織液，壓扁冷凍最大化表面積，解凍快70%。";
  } else if (cleanName.match(/魚|鮭|蝦|蛤|蚵|干貝|海鮮|墨魚|蟹/)) {
    category = "meat_seafood";
    chamber = "cold";
    coldDays = 2;
    frozenDays = 60;
    storageProtocol = "極低溫保鮮：海鮮極易退化，冷藏需於 2 天內烹調，若未食用請拭乾水分分裝冷凍。";
  } else if (cleanName.match(/蛋/)) {
    category = "dairy_egg_soy";
    chamber = "cold";
    coldDays = 14;
    frozenDays = 30;
    storageProtocol = "鈍端朝上冷藏：維持氣室於頂部，防止蛋黃貼殼變質，置於冷藏室內部恆溫處。";
  } else if (cleanName.match(/奶|乳|起司|乾酪|豆腐|豆漿|豆干|納豆/)) {
    category = "dairy_egg_soy";
    chamber = "cold";
    coldDays = cleanName.includes("豆腐") ? 3 : (cleanName.includes("起司") ? 14 : 7);
    frozenDays = cleanName.includes("豆腐") ? 60 : 30;
    storageProtocol = "密封防腐：開啟後用烘焙紙包裹再裝入方形密封盒，防止冰箱水分降解與發霉。";
  } else if (cleanName.match(/薯|洋蔥|蒜|蕉|芒果|蘋果|柑橘|果/)) {
    category = "vegetable_fruit";
    chamber = "cold";
    coldDays = cleanName.match(/蘋果|柑橘/) ? 14 : 5;
    frozenDays = 90;
    storageProtocol = "避光保存。若已切開，表面滴檸檬汁並以保鮮膜緊貼冷藏，以阻斷氧化。";
  } else if (cleanName.match(/菜|葉|菇|木耳|蘿蔔|番茄|黃瓜|茄子|椒|筍|花椰菜/)) {
    category = "vegetable_fruit";
    chamber = "cold";
    coldDays = cleanName.match(/蘿蔔|地瓜|馬鈴薯/) ? 10 : 4;
    frozenDays = 30;
    storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";
  } else if (cleanName.match(/吐司|麵包|水餃|麵|飯|饅頭|蔥抓餅/)) {
    category = "cooked_others";
    chamber = cleanName.match(/水餃|蔥抓餅/) ? "frozen" : "cold";
    coldDays = 3;
    frozenDays = 60;
    storageProtocol = "密封隔離：完全冷卻後密封分裝，避免澱粉老化與異味吸收。";
  } else {
    category = "cooked_others";
    chamber = "cold";
    coldDays = 5;
    frozenDays = 30;
    storageProtocol = "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。";
  }

  const selectedChamber = targetChamber || chamber;
  const daysLeft = selectedChamber === "frozen" ? frozenDays : coldDays;

  return {
    chamber: selectedChamber,
    recommendedChamber: chamber,
    coldDays,
    frozenDays,
    daysLeft,
    category,
    storageProtocol,
  };
}
