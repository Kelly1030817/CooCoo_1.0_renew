import type { RecipePackage } from "@coocoo/contracts";

// Editorial recipe, not model output or a claim of a physical kitchen trial.
export const firstMealRecipe: RecipePackage = {
  id: "curated-bok-choy-egg-soup-v1",
  recipeId: "c4444444-4444-4444-8444-444444444444",
  source: "catalog",
  title: "快煮鍋小白菜蛋花湯",
  servings: 2,
  prepMinutes: 5,
  totalMinutes: 15,
  estimatedCost: 0,
  cookwareTypes: ["快煮鍋"],
  ingredients: [
    {
      ingredientKey: "小白菜",
      name: "小白菜",
      quantity: 250,
      unit: "克",
      isPantryStaple: false,
      isVegetable: true,
      coveredByInventory: false,
    },
    {
      ingredientKey: "雞蛋",
      name: "雞蛋",
      quantity: 4,
      unit: "顆",
      isPantryStaple: false,
      isVegetable: false,
      coveredByInventory: false,
    },
    {
      ingredientKey: "飲用水",
      name: "飲用水",
      quantity: 600,
      unit: "毫升",
      isPantryStaple: true,
      isVegetable: false,
      coveredByInventory: false,
    },
    {
      ingredientKey: "鹽",
      name: "鹽",
      quantity: 2,
      unit: "克",
      isPantryStaple: true,
      isVegetable: false,
      coveredByInventory: false,
    },
  ],
  steps: [
    {
      id: "bce-1",
      order: 1,
      instruction:
        "確認快煮鍋可煮湯，600 毫升水加上 250 克小白菜與 4 顆蛋後仍低於最高水位；容量不足就分兩批煮，每批使用全部食材的一半。小白菜逐葉洗淨、切成約 3 公分段，菜梗與菜葉分開；雞蛋打入碗中攪拌均勻。",
      compactInstruction:
        "確認總量低於最高水位，不足就分兩批各用一半食材；洗淨 250 克小白菜切 3 公分段並分開梗葉，打散 4 顆蛋。",
      guidance: {
        successCue: "食材洗淨、蛋液均勻，已確認鍋具容量與可煮湯功能。",
        why: "先確認容量，避免加料後溢出。",
        rescueTip: "分批時每批為小白菜 125 克、雞蛋 2 顆、水 300 毫升、鹽 1 克。",
      },
      voiceText: "先確認容量，洗淨切好小白菜並打散雞蛋。",
      timerSeconds: null,
      safetyNote: "依鍋具說明使用；接觸蛋殼與蛋液後洗手，刀具與桌面清洗乾淨。",
    },
    {
      id: "bce-2",
      order: 2,
      instruction:
        "快煮鍋加入 600 毫升飲用水，開啟煮水或煮湯功能，加熱至明顯沸騰；煮沸所需時間依設備而異。全程有人看顧，不空燒。",
      compactInstruction: "600 毫升飲用水以煮水或煮湯功能加熱至明顯沸騰，全程看顧、不空燒。",
      guidance: {
        successCue: "水面持續出現大氣泡。",
        why: "水沸騰後再加料，較容易確認後續加熱狀態。",
        rescueTip: "若設備自動斷電，依說明重新啟動煮湯功能。",
      },
      voiceText: "把飲用水煮至明顯沸騰。",
      timerSeconds: null,
      safetyNote: "蒸氣口遠離臉部與手；不要超過鍋具最高水位。",
    },
    {
      id: "bce-3",
      order: 3,
      instruction:
        "加入小白菜菜梗，待湯再次沸騰後煮 2 分鐘；再加入菜葉，待再次沸騰後煮 1 分鐘，直到梗葉都變軟。若尚硬，繼續煮至變軟。",
      compactInstruction: "菜梗入鍋再沸後煮 2 分鐘；加入菜葉再沸後煮 1 分鐘，梗葉未軟就續煮。",
      guidance: {
        successCue: "菜梗可用筷子輕易夾彎，菜葉已軟。",
        why: "較厚的菜梗先煮，葉片後放。",
        rescueTip: "快溢出時依設備說明調低加熱，避免密閉鍋蓋。",
      },
      voiceText: "先煮菜梗兩分鐘，再放菜葉煮一分鐘，確認變軟。",
      timerSeconds: null,
      safetyNote: "加料時靠近鍋面緩慢放入，避免沸水濺出。",
    },
    {
      id: "bce-4",
      order: 4,
      instruction:
        "湯維持沸騰時，將打散的蛋液沿鍋緣緩慢倒入，輕輕攪散；等湯重新沸騰後開始計時 2 分鐘。確認蛋花全部凝固、沒有透明蛋白或流動蛋液；有食物溫度計時確認中心至少 71°C，未達就續煮。加入 2 克鹽攪勻後關機，分成 2 份。",
      compactInstruction:
        "沸湯中慢慢倒入蛋液並輕攪，再沸後煮 2 分鐘至蛋花完全凝固；有溫度計時確認至少 71°C，不足續煮。拌入 2 克鹽、關機，分成 2 份。",
      guidance: {
        successCue: "蛋花完全凝固，沒有流動蛋液，蔬菜柔軟。",
        why: "重新沸騰才計時，避免把降溫時間算成煮熟時間。",
        rescueTip: "若蛋液結成較大塊，用筷子輕撥散並繼續煮熟。",
      },
      voiceText: "慢慢加入蛋液，再沸後煮兩分鐘，確認蛋花完全凝固，拌鹽後關機。",
      timerSeconds: 120,
      safetyNote: "計時只是輔助，仍須確認蛋完全熟；盛湯時使用隔熱用品，避免燙傷。",
    },
  ],
  imageUrl: null,
  fallbackImageUrl: "/favicon.svg",
  downloadedAt: null,
};
