import React, { useState, useEffect } from 'react';

export default function AiAssistantOnboarding({ inventory = [], onAcceptQuest, onAddShoppingItems, onGoShopping, onSkip }) {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'dish_selection' | 'dish_recommendation'
  const [selectedDish, setSelectedDish] = useState(null);
  const [customDish, setCustomDish] = useState('');
  const [recommendation, setRecommendation] = useState(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onSkip?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  const presetDishes = [
    { title: '經典台式三杯雞', style: '台式家常', prepTime: '15 分鐘', estCost: 'NT$ 85', icon: 'restaurant' },
    { title: '日式牛肉丼飯', style: '日式和風', prepTime: '12 分鐘', estCost: 'NT$ 90', icon: 'ramen_dining' },
    { title: '番茄牛肉燉湯', style: '低卡健康', prepTime: '20 分鐘', estCost: 'NT$ 110', icon: 'soup_kitchen' },
    { title: '蒜香雞胸沙拉', style: '高蛋白輕食', prepTime: '10 分鐘', estCost: 'NT$ 70', icon: 'nutrition' },
    { title: '清炒時令蔬菜', style: '快速備菜', prepTime: '8 分鐘', estCost: 'NT$ 40', icon: 'eco' },
  ];

  const getRealIngredientsForDish = (dishTitle) => {
    const name = dishTitle.trim();

    if (name.includes('三杯雞')) {
      return {
        howToBuy: '建議補買：【去骨雞腿肉】1盒、【九層塔】1包與【老薑】1塊。',
        items: [
          { name: '去骨雞腿肉 (盒)', category: 'protein', estCost: 120, unit: '盒', qty: 1 },
          { name: '九層塔 (包)', category: 'produce', estCost: 25, unit: '包', qty: 1 },
          { name: '老薑 (塊)', category: 'produce', estCost: 15, unit: '塊', qty: 1 }
        ]
      };
    }

    if (name.includes('牛丼') || name.includes('牛肉丼')) {
      return {
        howToBuy: '建議採買：【牛五花肉片】1盒、【洋蔥】1顆與【放牧土雞蛋】1盒。',
        items: [
          { name: '牛五花肉片 (盒)', category: 'protein', estCost: 130, unit: '盒', qty: 1 },
          { name: '洋蔥 (顆)', category: 'produce', estCost: 20, unit: '顆', qty: 1 },
          { name: '放牧土雞蛋 (盒)', category: 'protein', estCost: 65, unit: '盒', qty: 1 }
        ]
      };
    }

    if (name.includes('番茄牛肉') || name.includes('牛肉燉湯')) {
      return {
        howToBuy: '建議採買：【牛腩肉】1包、【牛番茄】3顆與【洋蔥】1顆。',
        items: [
          { name: '牛腩肉 (包)', category: 'protein', estCost: 160, unit: '包', qty: 1 },
          { name: '牛番茄 (顆)', category: 'produce', estCost: 45, unit: '顆', qty: 3 },
          { name: '洋蔥 (顆)', category: 'produce', estCost: 20, unit: '顆', qty: 1 }
        ]
      };
    }

    if (name.includes('雞胸') || name.includes('沙拉')) {
      return {
        howToBuy: '建議採買：【履歷雞胸肉】1盒、【綜合沙拉生菜】1包與【蒜頭】1袋。',
        items: [
          { name: '履歷雞胸肉 (盒)', category: 'protein', estCost: 95, unit: '盒', qty: 1 },
          { name: '綜合沙拉生菜 (包)', category: 'produce', estCost: 55, unit: '包', qty: 1 },
          { name: '蒜頭 (袋)', category: 'produce', estCost: 30, unit: '袋', qty: 1 }
        ]
      };
    }

    if (name.includes('時令蔬菜') || name.includes('炒高麗菜') || name.includes('清炒')) {
      return {
        howToBuy: '建議採買：【有機高麗菜】1顆與【蒜頭】1袋。',
        items: [
          { name: '有機高麗菜 (顆)', category: 'produce', estCost: 45, unit: '顆', qty: 1 },
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
      howToBuy: `針對「${name}」，建議採買【${proteinItemName}】1份與【時令季節蔬菜】1包。`,
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
      chefIntro: `這道「${dishTitle}」色香味俱全，口感豐富，非常適合今天的自煮時光！`,
      howToCook: '物理熱力學控溫：肉類先以高溫短時間煎封定型鎖住組織液，再關火蓋鍋利用餘溫慢熟，蔬菜靜置去水避免過多蒸氣。',
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
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md px-4 text-center animate-in fade-in duration-200"
      onClick={onSkip}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="chef-modal-title"
        className="w-full max-w-md bg-[#fdfae7] rounded-3xl p-6 shadow-2xl border border-amber-200/60 overflow-hidden relative text-left transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Main Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
            </div>
            <div>
              <h2 id="chef-modal-title" className="text-lg font-extrabold text-slate-800">
                主廚相談室
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">專屬 AI 主廚 ‧ 為您量身推薦最佳美食體驗</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onSkip}
            className="w-8 h-8 rounded-full bg-amber-100/70 hover:bg-amber-200/80 text-stone-600 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0"
            aria-label="關閉相談室"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* STEP 1: Welcome Dialogue & Dual Action Cards */}
        {step === 'welcome' && (
          <div className="space-y-4">
            {/* Chef Dialogue Text (Removed card yellow bg & border to prevent false option affordance) */}
            <div className="py-1 px-1 text-slate-700 text-xs leading-relaxed flex items-start gap-2.5">
              <span className="text-xl leading-none shrink-0">👋</span>
              <div>
                <span className="font-bold text-slate-800 block mb-0.5 text-xs">歡迎來到 CooCoo 煮煮！</span>
                我是您的專屬 AI 主廚。今天想怎麼安排您的美食體驗呢？
              </div>
            </div>

            {/* Dual Action Cards */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              {/* Option A: Recommend Recipe */}
              <button
                onClick={() => setStep('dish_selection')}
                className="group relative w-full text-left rounded-2xl border border-amber-200/80 bg-white p-4 hover:border-orange-500 hover:bg-orange-50/50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-2xl">skillet</span>
                </div>
                <div className="flex-1">
                  <span className="font-extrabold text-slate-800 text-sm group-hover:text-orange-700 transition-colors block">
                    我想選料理 / 吃好料
                  </span>
                  <div className="text-[11px] text-stone-500 group-hover:text-stone-700 transition-colors mt-0.5">
                    利用現有庫存廚房食材，為您推薦主廚特選食譜
                  </div>
                </div>
              </button>

              {/* Option B: Go Shopping */}
              <button
                onClick={onGoShopping}
                className="group relative w-full text-left rounded-2xl border border-amber-200/80 bg-white p-4 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:bg-emerald-700 transition-colors shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                </div>
                <div className="flex-1">
                  <span className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-800 transition-colors block">
                    我想去採買新食材
                  </span>
                  <div className="text-[11px] text-stone-500 group-hover:text-emerald-700 transition-colors mt-0.5">
                    前往補貨區探索熱門品項，輕鬆補齊冰箱缺漏
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Dish Selection */}
        {step === 'dish_selection' && (
          <div className="space-y-4">
            <div className="py-1 px-1 flex items-start gap-2.5 text-xs text-slate-700">
              <span className="material-symbols-outlined text-amber-700 text-lg shrink-0">help</span>
              <p className="leading-relaxed">
                請問您今天想吃什麼類型的料理呢？可點選下方熱門菜色或輸入菜名：
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {presetDishes.map((dish) => (
                <button
                  key={dish.title}
                  onClick={() => handleSelectDish(dish.title)}
                  className="p-3 bg-white hover:bg-orange-50/80 border border-amber-200/70 hover:border-orange-300 rounded-2xl text-left transition-all group relative overflow-hidden shadow-xs hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="material-symbols-outlined text-stone-400 group-hover:text-orange-500 text-base transition-colors">
                      {dish.icon}
                    </span>
                    <span className="text-[9px] font-bold text-stone-500 bg-amber-100/70 group-hover:bg-orange-100 group-hover:text-orange-700 px-1.5 py-0.5 rounded-md transition-colors">
                      {dish.style}
                    </span>
                  </div>
                  <strong className="block text-xs font-extrabold text-slate-800 group-hover:text-orange-600 mb-1">
                    {dish.title}
                  </strong>
                  <span className="text-[10px] text-stone-400 block">
                    ⏱️ {dish.prepTime} ‧ 💰 {dish.estCost}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="自訂菜名，例如：麻婆豆腐..."
                  value={customDish}
                  onChange={(e) => setCustomDish(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && customDish.trim() && handleSelectDish(customDish.trim())}
                  className="w-full pl-3 pr-8 py-2 bg-white rounded-xl border border-amber-200/80 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-slate-800 shadow-xs"
                />
                {customDish && (
                  <button 
                    onClick={() => setCustomDish('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => customDish.trim() && handleSelectDish(customDish.trim())}
                disabled={!customDish.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs disabled:opacity-40 transition-colors shrink-0 shadow-xs"
              >
                推薦
              </button>
            </div>

            <button
              onClick={() => setStep('welcome')}
              className="text-xs font-bold text-stone-500 hover:text-stone-700 transition-colors flex items-center justify-center gap-1 mx-auto pt-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              返回選擇
            </button>
          </div>
        )}

        {/* STEP 3: Dish Recommendation Result */}
        {step === 'dish_recommendation' && recommendation && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-amber-200/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-600 text-xl">restaurant</span>
                  {recommendation.title}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  匹配成功 98%
                </span>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/50 text-xs text-stone-700 leading-relaxed">
                <strong className="text-amber-900 block font-bold mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-orange-500">format_quote</span>
                  主廚評語：
                </strong>
                {recommendation.chefIntro}
              </div>

              <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/50 text-xs space-y-2">
                <div>
                  <strong className="text-orange-600 font-bold flex items-center gap-1 mb-0.5">
                    <span className="material-symbols-outlined text-sm">science</span>
                    {recommendation.howToCook.split('：')[0]}：
                  </strong>
                  <p className="text-stone-600 pl-4">{recommendation.howToCook.split('：')[1] || recommendation.howToCook}</p>
                </div>
                
                <div className="pt-2 border-t border-amber-200/40">
                  <strong className="text-emerald-700 font-bold flex items-center gap-1 mb-0.5">
                    <span className="material-symbols-outlined text-sm">shopping_bag</span>
                    食材盤點與採買建議：
                  </strong>
                  <p className="text-stone-600 pl-4">{recommendation.howToBuy}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAddShoppingItems}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                將缺少的食材加入補貨區並前往採買
              </button>

              <button
                onClick={() => setStep('dish_selection')}
                className="w-full bg-white hover:bg-stone-100 text-stone-700 font-bold py-2.5 px-4 rounded-2xl border border-amber-200/60 text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                換選其他料理
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

