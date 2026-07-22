import React, { useState } from 'react';

export default function AiAssistantOnboarding({ inventory = [], onAcceptQuest, onAddShoppingItems, onGoShopping, onSkip }) {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'dish_selection' | 'dish_recommendation'
  const [selectedDish, setSelectedDish] = useState(null);
  const [customDish, setCustomDish] = useState('');
  const [recommendation, setRecommendation] = useState(null);

  const presetDishes = [
    { title: '經典台式三杯雞', style: '台式家常', prepTime: '15 分鐘', estCost: 'NT$ 85' },
    { title: '日式牛肉丼飯', style: '日式和風', prepTime: '12 分鐘', estCost: 'NT$ 90' },
    { title: '番茄牛肉燉湯', style: '低卡健康', prepTime: '20 分鐘', estCost: 'NT$ 110' },
    { title: '蒜香雞胸沙拉', style: '高蛋白輕食', prepTime: '10 分鐘', estCost: 'NT$ 70' },
    { title: '清炒時令蔬菜', style: '快速備菜', prepTime: '8 分鐘', estCost: 'NT$ 40' },
  ];

  const getRealIngredientsForDish = (dishTitle) => {
    const name = dishTitle.trim();

    if (name.includes('三杯雞')) {
      return {
        howToBuy: '🛒 食材盤點與建議：建議補買：【去骨雞腿肉】1盒、【九層塔】1包與【老薑】1塊。',
        items: [
          { name: '去骨雞腿肉 (盒)', category: 'protein', estCost: 120, unit: '盒', qty: 1 },
          { name: '九層塔 (包)', category: 'produce', estCost: 25, unit: '包', qty: 1 },
          { name: '老薑 (塊)', category: 'produce', estCost: 15, unit: '塊', qty: 1 }
        ]
      };
    }

    if (name.includes('牛丼') || name.includes('牛肉丼')) {
      return {
        howToBuy: '🛒 食材盤點與建議：建議採買：【牛五花肉片】1盒、【洋蔥】1顆與【放牧土雞蛋】1盒。',
        items: [
          { name: '牛五花肉片 (盒)', category: 'protein', estCost: 130, unit: '盒', qty: 1 },
          { name: '洋蔥 (顆)', category: 'produce', estCost: 20, unit: '顆', qty: 1 },
          { name: '放牧土雞蛋 (盒)', category: 'protein', estCost: 65, unit: '盒', qty: 1 }
        ]
      };
    }

    if (name.includes('番茄牛肉') || name.includes('牛肉燉湯')) {
      return {
        howToBuy: '🛒 食材盤點與建議：建議採買：【牛腩肉】1包、【牛番茄】3顆與【洋蔥】1顆。',
        items: [
          { name: '牛腩肉 (包)', category: 'protein', estCost: 160, unit: '包', qty: 1 },
          { name: '牛番茄 (顆)', category: 'produce', estCost: 45, unit: '顆', qty: 3 },
          { name: '洋蔥 (顆)', category: 'produce', estCost: 20, unit: '顆', qty: 1 }
        ]
      };
    }

    if (name.includes('雞胸') || name.includes('沙拉')) {
      return {
        howToBuy: '🛒 食材盤點與建議：建議採買：【履歷雞胸肉】1盒、【綜合沙拉生菜】1包與【蒜頭】1袋。',
        items: [
          { name: '履歷雞胸肉 (盒)', category: 'protein', estCost: 95, unit: '盒', qty: 1 },
          { name: '綜合沙拉生菜 (包)', category: 'produce', estCost: 55, unit: '包', qty: 1 },
          { name: '蒜頭 (袋)', category: 'produce', estCost: 30, unit: '袋', qty: 1 }
        ]
      };
    }

    if (name.includes('時令蔬菜') || name.includes('炒高麗菜') || name.includes('清炒')) {
      return {
        howToBuy: '🛒 食材盤點與建議：建議採買：【有機高麗菜】1顆與【蒜頭】1袋。',
        items: [
          { name: '有機高麗菜 (顆)', category: 'produce', estCost: 45, unit: '顆', qty: 1 },
          { name: '蒜頭 (袋)', category: 'produce', estCost: 30, unit: '袋', qty: 1 }
        ]
      };
    }

    if (name.includes('麻婆豆腐') || name.includes('豆腐')) {
      return {
        howToBuy: '🛒 食材盤點與建議：建議採買：【嫩豆腐】2盒與【優質豬絞肉】1盒。',
        items: [
          { name: '嫩豆腐 (盒)', category: 'dairy_egg_soy', estCost: 30, unit: '盒', qty: 2 },
          { name: '優質豬絞肉 (盒)', category: 'protein', estCost: 85, unit: '盒', qty: 1 }
        ]
      };
    }

    if (name.includes('茄子') || name.includes('紅燒')) {
      return {
        howToBuy: '🛒 食材盤點與建議：建議採買：【鮮嫩茄子】2條與【蒜頭】1袋。',
        items: [
          { name: '鮮嫩茄子 (條)', category: 'produce', estCost: 35, unit: '條', qty: 2 },
          { name: '蒜頭 (袋)', category: 'produce', estCost: 30, unit: '袋', qty: 1 }
        ]
      };
    }

    const proteinMatch = name.match(/雞|豬|牛|羊|蝦|魚|蛤|干貝|肉|豆腐|蛋/);
    const mainProtein = proteinMatch ? proteinMatch[0] : null;

    const proteinItemName = mainProtein 
      ? (mainProtein === '雞' ? '嚴選雞肉切塊 (盒)' : mainProtein === '豬' ? '優質豬肉片 (盒)' : mainProtein === '牛' ? '牛五花肉片 (盒)' : mainProtein === '魚' ? '鮮美鮭魚菲力 (片)' : mainProtein === '蝦' ? '白蝦 (盒)' : mainProtein === '豆腐' ? '有機嫩豆腐 (盒)' : `${mainProtein}類精選食材 (盒)`)
      : `${name} 專屬食材 (包)`;

    return {
      howToBuy: `🛒 食材盤點與建議：針對「${name}」，建議採買【${proteinItemName}】1份與【時令季節蔬菜】1包。`,
      items: [
        { name: proteinItemName, category: mainProtein === '豆腐' ? 'dairy_egg_soy' : 'protein', estCost: 95, unit: '盒', qty: 1 },
        { name: '時令季節蔬菜 (包)', category: 'produce', estCost: 40, unit: '包', qty: 1 }
      ]
    };
  };

  const handleSelectDish = (dishTitle) => {
    setSelectedDish(dishTitle);
    const dishData = getRealIngredientsForDish(dishTitle);
    const rec = {
      title: dishTitle,
      chefIntro: `👨‍🍳 主廚評語：這道「${dishTitle}」色香味俱全，口感豐富，非常適合今天的自煮時光！`,
      howToCook: '🍳 物理熱力學控溫：肉類先以高溫短時間煎封定型鎖住組織液，再關火蓋鍋利用餘溫慢熟，蔬菜靜置去水避免過多蒸氣。',
      howToBuy: dishData.howToBuy,
      itemsToAdd: dishData.items
    };
    setRecommendation(rec);
    setStep('dish_recommendation');
  };

  const handleAddShoppingItems = () => {
    if (recommendation?.itemsToAdd && onAddShoppingItems) {
      onAddShoppingItems(recommendation.itemsToAdd);
    }
    if (recommendation?.itemsToAdd && onAcceptQuest) {
      onAcceptQuest({
        id: 'dish-' + Date.now(),
        title: recommendation.title,
        description: `採買並完成「${recommendation.title}」`,
        exp: 50
      });
    }
    if (onGoShopping) onGoShopping();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm px-4 text-center">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl animate-fade-in border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-3xl">restaurant_menu</span>
            </div>
            <div className="text-left">
              <h2 className="text-xl font-extrabold text-slate-blue">主廚相談室 👨‍🍳</h2>
              <p className="text-xs text-gray-500">專屬 AI 主廚 ‧ 為您量身推薦</p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
            title="關閉相談室"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* STEP 1: Welcome Options */}
        {step === 'welcome' && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-stone-700 leading-relaxed text-left py-2 px-1">
              👋 歡迎來到 CooCoo 煮煮！我是您的專屬主廚 👨‍🍳 今天想怎麼安排您的美食體驗呢？
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onGoShopping}
                className="w-full rounded-2xl border-2 border-secondary/30 bg-secondary/10 py-3.5 px-4 font-extrabold text-secondary hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <span className="material-symbols-outlined text-xl">shopping_cart</span>
                我想去採買新食材
              </button>

              <button
                onClick={() => setStep('dish_selection')}
                className="w-full rounded-2xl border-2 border-primary/30 bg-primary/10 py-3.5 px-4 font-extrabold text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <span className="material-symbols-outlined text-xl">skillet</span>
                我想選料理 / 吃好料
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Dish Selection */}
        {step === 'dish_selection' && (
          <div className="space-y-4 text-left">
            <p className="text-xs font-bold text-slate-blue bg-amber-50 p-3 rounded-xl border border-amber-200">
              👨‍🍳 主廚詢問：請問您今天想吃什麼類型的料理呢？可點選下方熱門菜色或輸入菜名：
            </p>

            <div className="grid grid-cols-2 gap-2">
              {presetDishes.map((dish) => (
                <button
                  key={dish.title}
                  onClick={() => handleSelectDish(dish.title)}
                  className="p-3 bg-stone-50 hover:bg-primary/10 border border-stone-200 hover:border-primary/40 rounded-2xl text-left transition-all group"
                >
                  <strong className="block text-xs font-extrabold text-slate-blue group-hover:text-primary">{dish.title}</strong>
                  <span className="text-[10px] text-gray-500">{dish.prepTime} ‧ {dish.estCost}</span>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="自訂菜名，例如：麻婆豆腐..."
                value={customDish}
                onChange={(e) => setCustomDish(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => customDish.trim() && handleSelectDish(customDish.trim())}
                disabled={!customDish.trim()}
                className="bg-primary text-white font-bold px-3 py-2 rounded-xl text-xs disabled:opacity-40"
              >
                主廚推薦
              </button>
            </div>

            <button
              onClick={() => setStep('welcome')}
              className="text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors block mx-auto pt-1"
            >
              ← 返回選擇
            </button>
          </div>
        )}

        {/* STEP 3: Dish Recommendation Result */}
        {step === 'dish_recommendation' && recommendation && (
          <div className="space-y-4 text-left">
            <div className="bg-[#fdfae7] p-4 rounded-2xl border border-amber-300 space-y-3">
              <h3 className="text-base font-extrabold text-terracotta flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">restaurant</span>
                {recommendation.title}
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                {recommendation.chefIntro}
              </p>
              <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1.5">
                <strong className="text-primary block font-bold">{recommendation.howToCook}</strong>
                <p className="text-stone-600">{recommendation.howToBuy}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleAddShoppingItems}
                className="w-full bg-secondary text-white font-extrabold py-3 px-4 rounded-2xl text-xs shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                將缺少的食材加入補貨區並前往採買
              </button>

              <button
                onClick={() => setStep('dish_selection')}
                className="w-full bg-stone-100 text-stone-700 font-bold py-2 px-4 rounded-2xl text-xs hover:bg-stone-200 transition-all"
              >
                🔄 選其他料理
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
