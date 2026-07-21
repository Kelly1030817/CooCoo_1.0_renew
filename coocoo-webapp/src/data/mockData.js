export const defaultInventory = [
  {
    id: "i1",
    name: "酪梨",
    chamber: "cold",
    qty: 1,
    unit: "顆",
    daysLeft: 0,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdDfNSxxGjlHNotFR11Hpy8v0T59noNyOTeU1h1IVOWbvlNmeTxfenbqWlC9JlJd2C1uWaeGZG5NUNKAFPYf5DBYM0bqUZOJWTlGNP1mUVsE6KZuaqJaz4zegaSUCfDR9UIpbsS9babhgQP6pMXTPYuOXIC9YJTOBEonszTcpAxPE6ez7AWXLSJhAMj_VTRmcmzJKUxlOd4TjUmLfHCNZz6Txsts4f__iskIIzk63tGPapSOtIPGucoJDUZxE8L4U9g-NqDIYHwgw",
    addedDate: "2026-06-26",
    roi: { savings: 120, sodium: 200, fat: 15 },
    storageProtocol: "避光保存。若已切開，表面滴檸檬汁並以保鮮膜緊貼冷藏，以阻斷氧化。",
    boxSize: "S"
  },
  {
    id: "i2",
    name: "胡蘿蔔",
    chamber: "cold",
    qty: 3,
    unit: "條",
    daysLeft: 3,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCB6T3B4nig1ziAwIm1wSVgPv1ecoPiWrdICCeoGct9PZinlrXcpUQLkGSEkHJRIslOBINUxs6ZNwMBLnl1vyhYVduguWMa7x2HkBsxzHDaEOmF0agjsTINBgjsqQ7chfP3fC_mI20majBIld1HnR5Y8PNI7IT3u5wuu-5PNjoRFOkG_jreA3ffAQg0QVtjW-dvNnx_0Qj_eTq5Gessw8I9whoGXuCch4ME-JSUEsoNEJVFPUQcZhXzDIdVtyiXojBxpudh8aWhmeo",
    addedDate: "2026-06-23",
    roi: { savings: 45, sodium: 50, fat: 0 },
    storageProtocol: "切除頂部葉片，用廚房紙巾包裹後裝入保鮮盒冷藏。",
    boxSize: "M"
  },
  {
    id: "i3",
    name: "高麗菜",
    chamber: "cold",
    qty: 0.5,
    unit: "顆",
    daysLeft: 5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBC2QYv4Jm3h1D8G0D5P6I6D1JqLwWpB7_E4T5D4P1y9r9O1X9f7r7R2k9k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5", // mockup
    addedDate: "2026-06-21",
    roi: { savings: 60, sodium: 100, fat: 0 },
    storageProtocol: "切除菜心，塞入沾濕的廚房紙巾，裝入保鮮袋冷藏。",
    boxSize: "L"
  },
  {
    id: "i4",
    name: "梅花豬肉片",
    chamber: "frozen",
    qty: 300,
    unit: "g",
    daysLeft: 21,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3_k9j2_1f5Z8q3_W2Y1X9C4H9J6P2M9Z5K8R1D7_L3K8T5N2F4_B7W9X5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5k5Z3K8M9Q4Z3C1Q1W9y6Z9R2D5", // mockup
    addedDate: "2026-06-15",
    roi: { savings: 150, sodium: 300, fat: 20 },
    storageProtocol: "平鋪分裝於密封袋，排盡空氣後冷凍。",
    boxSize: "無"
  }
];

export const defaultFridgeProfile = {
  isConfigured: true,
  capacityLiters: 150
};

export const defaultShoppingList = [
  {
    id: "shop-1",
    name: "空心菜",
    category: "produce",
    qty: 2,
    unit: "把",
    estCost: 60,
    checked: false
  },
  {
    id: "shop-2",
    name: "雞蛋 (冷藏)",
    category: "protein",
    qty: 1,
    unit: "盒",
    estCost: 80,
    checked: true
  },
  {
    id: "shop-3",
    name: "豆腐",
    category: "protein",
    qty: 2,
    unit: "盒",
    estCost: 30,
    checked: false
  }
];

export function getInventoryItemCategory(item) {
  const name = item.name;
  if (name.includes("肉") || name.includes("蛋") || name.includes("魚") || name.includes("蝦") || name.includes("奶") || name.includes("豆腐") || name.includes("豆漿")) {
    return "protein";
  }
  return "produce";
}

export const defaultDreams = [
  {
    id: "dream-1",
    name: "全家去沖繩旅遊",
    description: "存錢帶家人去沖繩看海",
    type: "travel",
    icon: "flight_takeoff",
    targetAmount: 50000,
    savedAmount: 12500,
    isPaused: false
  },
  {
    id: "dream-2",
    name: "買洗碗機",
    description: "解放雙手，拯救婚姻",
    type: "savings",
    icon: "kitchen",
    targetAmount: 30000,
    savedAmount: 5000,
    isPaused: false
  }
];

export const defaultSavingsGoal = {
  monthlySaved: 2350,
  mealsCompleted: 15,
  rescuedItems: 6,
  sodiumReduced: 2500,
  fatReduced: 120
};
