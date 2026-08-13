export interface Recipe {
  slug: string;
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  equipment: string;
  estimatedCost: number;
  cleanupItemsCount: number;
  comparisonCost: number;
}

export const recipes: Recipe[] = [
  {
    slug: 'sesame-oil-chicken-noodle-soup',
    name: '15分鐘麻油雞湯麵',
    description: '香醇麻油搭配鮮嫩雞腿肉，快煮鍋一鍋到底，暖胃又暖心。',
    prepTime: 'PT5M',
    cookTime: 'PT10M',
    servings: 1,
    ingredients: ['去骨雞腿肉 100g', '麵條 1人份', '高麗菜 50g', '麻油 1大匙', '薑片 3片', '米酒 1大匙', '鹽 適量', '水 400ml'],
    steps: [
      '將快煮鍋加熱，倒入麻油，放入薑片煸香。',
      '加入雞腿肉塊炒至表面微焦。',
      '倒入米酒與水，煮滾後加入高麗菜與麵條。',
      '煮約3-5分鐘至麵條熟透，加鹽調味即可。'
    ],
    equipment: '快煮鍋',
    estimatedCost: 65,
    cleanupItemsCount: 1,
    comparisonCost: 150
  },
  {
    slug: 'tomato-egg-noodle-soup',
    name: '一鍋到底番茄蛋花麵',
    description: '酸甜開胃的番茄湯底，搭配滑嫩蛋花，簡單快速的宵夜首選。',
    prepTime: 'PT5M',
    cookTime: 'PT8M',
    servings: 1,
    ingredients: ['牛番茄 1顆', '雞蛋 1顆', '麵條 1人份', '蔥花 少許', '鹽 適量', '白胡椒 適量', '水 400ml'],
    steps: [
      '牛番茄切塊，電磁爐開中火，鍋中少許油將番茄炒軟出汁。',
      '加入水煮滾，放入麵條煮熟。',
      '將雞蛋打散，畫圈倒入鍋中形成蛋花。',
      '加入鹽和白胡椒調味，撒上蔥花即完成。'
    ],
    equipment: '單口電磁爐',
    estimatedCost: 35,
    cleanupItemsCount: 1,
    comparisonCost: 100
  },
  {
    slug: 'rice-cooker-lazy-curry',
    name: '電鍋懶人咖哩飯',
    description: '免顧火的極致懶人料理，食材通通丟進電鍋，下班後的救星。',
    prepTime: 'PT10M',
    cookTime: 'PT30M',
    servings: 1,
    ingredients: ['白米 0.5杯', '豬肉片 100g', '馬鈴薯 半顆', '紅蘿蔔 1/4根', '咖哩塊 1塊', '水 適量'],
    steps: [
      '白米洗淨放入內鍋，加入正常比例的水。',
      '馬鈴薯與紅蘿蔔切小塊，鋪在白米上方。',
      '放上豬肉片與剝碎的咖哩塊。',
      '外鍋加一杯水，按下開關，跳起後攪拌均勻即可食用。'
    ],
    equipment: '電鍋',
    estimatedCost: 55,
    cleanupItemsCount: 2,
    comparisonCost: 120
  },
  {
    slug: 'osmotic-cucumber-salad',
    name: '滲透壓脫水鹽漬小黃瓜',
    description: '清脆爽口的涼拌小菜，完全免開火，利用科學原理快速入味。',
    prepTime: 'PT5M',
    cookTime: 'PT0M',
    servings: 1,
    ingredients: ['小黃瓜 1根', '鹽 1小匙', '蒜末 1小匙', '香油 少許', '白醋 1小匙'],
    steps: [
      '小黃瓜洗淨，用刀背拍碎後切小段。',
      '加入鹽巴抓勻，靜置10分鐘利用滲透壓讓小黃瓜出水。',
      '將釋出的水分倒掉。',
      '加入蒜末、香油、白醋拌勻即可。'
    ],
    equipment: '免開火',
    estimatedCost: 20,
    cleanupItemsCount: 1,
    comparisonCost: 50
  },
  {
    slug: 'miso-tofu-seaweed-soup',
    name: '味噌豆腐海帶湯',
    description: '日式經典湯品，富含蛋白質，快煮鍋輕鬆搞定。',
    prepTime: 'PT3M',
    cookTime: 'PT5M',
    servings: 1,
    ingredients: ['嫩豆腐 半盒', '乾燥海帶芽 1大匙', '味噌 1大匙', '蔥花 少許', '水 300ml'],
    steps: [
      '快煮鍋加水煮滾。',
      '放入切塊的豆腐與海帶芽煮1分鐘。',
      '將味噌放入漏勺中，在湯裡攪拌化開。',
      '關火撒上蔥花即可。'
    ],
    equipment: '快煮鍋',
    estimatedCost: 25,
    cleanupItemsCount: 1,
    comparisonCost: 60
  },
  {
    slug: 'garlic-butter-mushroom-pasta',
    name: '蒜香奶油菇菇義大利麵',
    description: '奶香濃郁，蒜味撲鼻，一鍋到底煮義大利麵，省水又省洗碗。',
    prepTime: 'PT5M',
    cookTime: 'PT12M',
    servings: 1,
    ingredients: ['義大利麵 80g', '鴻禧菇 半包', '蒜末 1大匙', '奶油 1小塊', '鹽 適量', '黑胡椒 適量', '水 300ml'],
    steps: [
      '電磁爐開中小火，平底鍋放入奶油融化，炒香蒜末與鴻禧菇。',
      '加入水與少許鹽，煮滾後放入折半的義大利麵。',
      '中小火煨煮至水分收乾，麵條熟透。',
      '撒上黑胡椒拌勻即完成。'
    ],
    equipment: '單口電磁爐',
    estimatedCost: 45,
    cleanupItemsCount: 1,
    comparisonCost: 180
  },
  {
    slug: 'korean-kimchi-pork-ramen',
    name: '韓式泡菜豬肉拉麵',
    description: '酸辣開胃，濃郁湯頭撫慰一天的疲憊。',
    prepTime: 'PT5M',
    cookTime: 'PT10M',
    servings: 1,
    ingredients: ['韓國泡麵 1包', '韓式泡菜 50g', '豬肉片 50g', '蔥花 少許', '雞蛋 1顆', '水 500ml'],
    steps: [
      '快煮鍋加水煮滾。',
      '放入泡菜與豬肉片煮熟，釋放鮮甜味。',
      '加入泡麵與調味料煮約4分鐘。',
      '打入雞蛋，煮至喜歡的熟度，撒上蔥花即完成。'
    ],
    equipment: '快煮鍋',
    estimatedCost: 60,
    cleanupItemsCount: 1,
    comparisonCost: 160
  },
  {
    slug: 'century-egg-pork-congee',
    name: '皮蛋瘦肉粥',
    description: '經典暖胃粥品，用剩飯與快煮鍋就能輕鬆完成。',
    prepTime: 'PT5M',
    cookTime: 'PT10M',
    servings: 1,
    ingredients: ['白飯 1碗', '豬絞肉 50g', '皮蛋 1顆', '蔥花 少許', '鹽 適量', '白胡椒 適量', '水 400ml'],
    steps: [
      '快煮鍋倒入水與白飯，煮滾後轉小火煮5分鐘。',
      '加入豬絞肉攪拌至變色熟透。',
      '皮蛋切碎放入鍋中拌勻。',
      '加鹽、白胡椒調味，撒上蔥花即可。'
    ],
    equipment: '快煮鍋',
    estimatedCost: 45,
    cleanupItemsCount: 1,
    comparisonCost: 100
  },
  {
    slug: 'hot-and-sour-noodle-soup',
    name: '酸辣湯麵',
    description: '酸辣過癮，快速解決一餐的美味湯麵。',
    prepTime: 'PT5M',
    cookTime: 'PT10M',
    servings: 1,
    ingredients: ['麵條 1人份', '木耳絲 少許', '紅蘿蔔絲 少許', '嫩豆腐 1/4盒', '雞蛋 1顆', '烏醋 2大匙', '白胡椒 1小匙', '鹽 適量', '水 400ml'],
    steps: [
      '快煮鍋加水，放入木耳絲與紅蘿蔔絲煮滾。',
      '加入麵條與切塊的嫩豆腐煮熟。',
      '淋上打散的蛋液，形成蛋花。',
      '加入烏醋、白胡椒與鹽調味即完成。'
    ],
    equipment: '快煮鍋',
    estimatedCost: 40,
    cleanupItemsCount: 1,
    comparisonCost: 90
  },
  {
    slug: 'steamed-egg-rice-cooker',
    name: '電鍋蒸蛋',
    description: '滑嫩如布丁的蒸蛋，簡單零失敗的蛋白質料理。',
    prepTime: 'PT3M',
    cookTime: 'PT15M',
    servings: 1,
    ingredients: ['雞蛋 2顆', '溫水 200ml', '醬油 1小匙', '鹽 少許', '蔥花 少許'],
    steps: [
      '雞蛋打散，加入溫水、鹽和醬油拌勻。',
      '用濾網過濾蛋液倒入碗中，表面蓋上盤子。',
      '電鍋外鍋加半杯水，按下開關。',
      '跳起後撒上蔥花即可食用。'
    ],
    equipment: '電鍋',
    estimatedCost: 20,
    cleanupItemsCount: 1,
    comparisonCost: 60
  },
  {
    slug: 'mushroom-chicken-rice',
    name: '香菇雞肉炊飯',
    description: '香氣四溢的電鍋炊飯，一鍵搞定主食與配菜。',
    prepTime: 'PT10M',
    cookTime: 'PT30M',
    servings: 1,
    ingredients: ['白米 0.5杯', '去骨雞腿肉 100g', '乾香菇 2朵', '醬油 1大匙', '米酒 1小匙', '香菇水+清水 適量'],
    steps: [
      '乾香菇泡軟切絲，雞腿肉切塊，與醬油、米酒抓勻醃製。',
      '白米洗淨，倒入內鍋，加入香菇水與清水，總水量與米等比例。',
      '鋪上醃好的雞肉與香菇。',
      '外鍋加一杯水，按下開關，跳起後拌勻即完成。'
    ],
    equipment: '電鍋',
    estimatedCost: 60,
    cleanupItemsCount: 2,
    comparisonCost: 150
  },
  {
    slug: 'taiwanese-braised-pork-rice',
    name: '電鍋版滷肉飯',
    description: '家常經典美味，免顧火也能滷出膠質滿滿的滷肉。',
    prepTime: 'PT10M',
    cookTime: 'PT40M',
    servings: 1,
    ingredients: ['五花絞肉 150g', '紅蔥酥 1大匙', '醬油 2大匙', '米酒 1大匙', '冰糖 半大匙', '五香粉 少許', '水 150ml'],
    steps: [
      '將五花絞肉與所有調味料放入內鍋拌勻。',
      '外鍋加1.5杯水，按下開關。',
      '跳起後稍微攪拌，可再加半杯水燉煮一次讓味道更融合。',
      '淋在白飯上即可享用。'
    ],
    equipment: '電鍋',
    estimatedCost: 70,
    cleanupItemsCount: 2,
    comparisonCost: 120
  },
  {
    slug: 'sweet-potato-oatmeal-porridge',
    name: '地瓜燕麥粥 (早餐)',
    description: '健康高纖的飽足早餐，電鍋定時早上起床就能吃。',
    prepTime: 'PT5M',
    cookTime: 'PT20M',
    servings: 1,
    ingredients: ['傳統燕麥片 40g', '地瓜 半顆', '水 250ml', '鮮奶 50ml (可選)'],
    steps: [
      '地瓜去皮切小塊。',
      '將燕麥片、地瓜塊與水放入內鍋。',
      '外鍋加半杯水，按下開關。',
      '跳起後可依喜好加入少許鮮奶拌勻。'
    ],
    equipment: '電鍋',
    estimatedCost: 25,
    cleanupItemsCount: 1,
    comparisonCost: 70
  },
  {
    slug: 'japanese-teriyaki-chicken-don',
    name: '日式照燒雞腿丼',
    description: '甜鹹醬汁包裹軟嫩雞肉，下飯神器的完美呈現。',
    prepTime: 'PT5M',
    cookTime: 'PT12M',
    servings: 1,
    ingredients: ['去骨雞腿肉 150g', '洋蔥 1/4顆', '醬油 1.5大匙', '味醂 1大匙', '米酒 1大匙', '糖 半小匙', '白飯 1碗'],
    steps: [
      '雞腿肉切塊，電磁爐開中火，雞皮朝下煎出油脂。',
      '翻面後加入切絲的洋蔥炒香。',
      '倒入醬油、味醂、米酒與糖，小火煮至醬汁收乾濃稠。',
      '鋪在白飯上即可享用。'
    ],
    equipment: '單口電磁爐',
    estimatedCost: 75,
    cleanupItemsCount: 2,
    comparisonCost: 180
  },
  {
    slug: 'scallion-egg-fried-rice',
    name: '蔥花蛋炒飯',
    description: '粒粒分明的金黃炒飯，簡單卻考驗功力的家常美味。',
    prepTime: 'PT5M',
    cookTime: 'PT8M',
    servings: 1,
    ingredients: ['冷藏隔夜飯 1碗', '雞蛋 2顆', '蔥花 2大匙', '醬油 1大匙', '鹽 少許', '油 1大匙'],
    steps: [
      '電磁爐開中大火，熱鍋下油，倒入打散的蛋液炒至半凝固。',
      '加入白飯，用鍋鏟將飯粒壓散炒勻。',
      '加入鹽調味，鍋邊熗入醬油炒出香氣。',
      '撒上蔥花拌炒均勻即完成。'
    ],
    equipment: '單口電磁爐',
    estimatedCost: 30,
    cleanupItemsCount: 1,
    comparisonCost: 90
  },
  {
    slug: 'thai-basil-pork-rice',
    name: '泰式打拋豬肉飯',
    description: '香辣下飯的泰式經典，不用買特殊醬料也能做。',
    prepTime: 'PT5M',
    cookTime: 'PT10M',
    servings: 1,
    ingredients: ['豬絞肉 100g', '九層塔 一把', '蒜末 1大匙', '辣椒 1根', '醬油 1大匙', '魚露 1小匙 (可省)', '檸檬汁 少許', '白飯 1碗'],
    steps: [
      '電磁爐開中火，鍋中少許油爆香蒜末與辣椒末。',
      '加入豬絞肉炒至變色熟透。',
      '加入醬油與魚露調味，炒至水分稍微收乾。',
      '關火，放入九層塔拌炒，擠上檸檬汁即可起鍋。'
    ],
    equipment: '單口電磁爐',
    estimatedCost: 65,
    cleanupItemsCount: 2,
    comparisonCost: 160
  },
  {
    slug: 'korean-soondubu-jjigae',
    name: '韓式豆腐鍋',
    description: '濃郁辣香的韓式湯底，滑嫩豆腐與豐富配料的完美結合。',
    prepTime: 'PT5M',
    cookTime: 'PT12M',
    servings: 1,
    ingredients: ['嫩豆腐 半盒', '豬肉片 50g', '韓式辣椒粉 1大匙', '蒜末 1小匙', '醬油 1小匙', '雞蛋 1顆', '水 300ml'],
    steps: [
      '電磁爐開小火，鍋中加少許油，炒香蒜末與辣椒粉。',
      '加入豬肉片炒熟，倒入醬油熗香。',
      '加入水煮滾，用湯匙挖入嫩豆腐。',
      '煮滾後打入雞蛋，關火即完成。'
    ],
    equipment: '單口電磁爐',
    estimatedCost: 55,
    cleanupItemsCount: 1,
    comparisonCost: 170
  },
  {
    slug: 'overnight-oats-yogurt',
    name: '隔夜燕麥優格杯 (早餐)',
    description: '前一晚準備好，隔天起床直接享用的冰涼健康早餐。',
    prepTime: 'PT5M',
    cookTime: 'PT0M',
    servings: 1,
    ingredients: ['傳統燕麥片 40g', '無糖優格 100g', '鮮奶 50ml', '奇亞籽 1小匙', '蜂蜜 1小匙', '水果丁 適量'],
    steps: [
      '將燕麥片、奇亞籽、鮮奶與優格放入玻璃罐中拌勻。',
      '加入蜂蜜調味。',
      '放入冰箱冷藏至少4小時或過夜。',
      '食用前鋪上喜歡的水果丁即完成。'
    ],
    equipment: '免開火',
    estimatedCost: 40,
    cleanupItemsCount: 1,
    comparisonCost: 120
  },
  {
    slug: 'avocado-tuna-sandwich',
    name: '酪梨鮪魚沙拉三明治',
    description: '高蛋白好油脂，免開火的輕食午餐。',
    prepTime: 'PT5M',
    cookTime: 'PT0M',
    servings: 1,
    ingredients: ['吐司 2片', '水煮鮪魚罐頭 半罐', '酪梨 1/4顆', '黑胡椒 適量', '檸檬汁 少許'],
    steps: [
      '鮪魚瀝乾水分。',
      '酪梨去皮搗成泥，與鮪魚均勻混合。',
      '加入少許檸檬汁與黑胡椒調味。',
      '夾入吐司中即可享用。'
    ],
    equipment: '免開火',
    estimatedCost: 50,
    cleanupItemsCount: 1,
    comparisonCost: 130
  },
  {
    slug: 'cold-wood-ear-mushroom',
    name: '涼拌木耳金針菇',
    description: '酸爽開胃，用熱水沖泡燜熟的免開火涼拌菜。',
    prepTime: 'PT8M',
    cookTime: 'PT0M',
    servings: 1,
    ingredients: ['乾木耳 一小把', '金針菇 半包', '蒜末 1小匙', '醬油 1大匙', '烏醋 1大匙', '香油 少許'],
    steps: [
      '乾木耳與金針菇洗淨放入碗中，倒入剛燒開的熱水，蓋上盤子燜5分鐘。',
      '將水瀝乾，加入蒜末。',
      '倒入醬油、烏醋與香油拌勻。',
      '放涼或冷藏後食用風味更佳。'
    ],
    equipment: '免開火',
    estimatedCost: 30,
    cleanupItemsCount: 1,
    comparisonCost: 65
  }
];
