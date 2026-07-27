import React, { useState, useEffect } from 'react';
import StyleSelector from './StyleSelector';
import FloatingRecipeAction from './FloatingRecipeAction';
import FridgeItem from '../FridgeView/FridgeItem';
import RecipeModal from './RecipeModal';
import { getAISuggestedStorage } from '../../utils/aiStorage';

const KitchenView = ({ inventory, preselectedItemIds = [], onFinishCooking }) => {
  const [currentStyle, setCurrentStyle] = useState('無特定風格 (AI 自由發揮)');
  const [selectedItemIds, setSelectedItemIds] = useState(preselectedItemIds);
  
  useEffect(() => {
    if (preselectedItemIds.length > 0) {
      setSelectedItemIds(preselectedItemIds);
    }
  }, [preselectedItemIds]);
  
  // Recipe Modal State
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  const handleToggleSelect = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleGenerateRecipe = async () => {
    if (selectedItemIds.length === 0) return;
    
    setIsRecipeLoading(true);
    setGeneratedRecipe(null);
    
    const items = selectedItemIds.map(id => inventory.find(item => item.id === id)).filter(Boolean);
    const itemNames = items.map(i => i.name);

    let recipeData = null;
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ingredients: itemNames,
          style: currentStyle
        })
      });
      
      const data = await res.json();
      if (data.success && data.data) {
        recipeData = data.data;
        recipeData.style = currentStyle;
      }
    } catch (err) {
      console.warn("Backend API offline, using smart mock recipe generator fallback.");
    }

    // Fallback Mock Recipe Generator if backend API is not available
    if (!recipeData) {
      const mainName = itemNames.join('與') || '精選食材';
      recipeData = {
        title: `${mainName}特製創意料理`,
        prepTime: '12 分鐘',
        estCost: '約 NT$ 45',
        style: currentStyle,
        scientificPrinciple: `運用「${mainName}」的天然風味與熱傳導特性，中火快速拌炒可完美鎖住維生素與原汁精華。`,
        steps: [
          `將 ${mainName} 清洗乾淨，切成方便入味的適口大小。`,
          `熱鍋加入少許優質食用油，倒入食材以中火拌炒 3~5 分鐘至香味四溢。`,
          `依個人喜好撒上少許鹽與黑胡椒均勻調味，熄火盛盤即可享用美味！`
        ]
      };
    }

    // Add a slight delay for realistic loading feel
    setTimeout(() => {
      setGeneratedRecipe(recipeData);
      setIsRecipeLoading(false);
    }, 600);
  };

  // Categorize inventory items
  const categoryMap = {
    vegetable_fruit: { title: "蔬菜與水果", icon: "eco", badgeBg: "bg-emerald-100 text-emerald-800", items: [] },
    meat_seafood: { title: "肉類與海鮮", icon: "set_meal", badgeBg: "bg-rose-100 text-rose-800", items: [] },
    dairy_egg_soy: { title: "蛋奶與豆類", icon: "egg", badgeBg: "bg-amber-100 text-amber-800", items: [] },
    cooked_others: { title: "熟食與其他", icon: "inventory_2", badgeBg: "bg-slate-100 text-slate-800", items: [] }
  };

  inventory.forEach(item => {
    const aiRec = getAISuggestedStorage(item.name);
    const cat = item.category || aiRec.category || "cooked_others";
    if (categoryMap[cat]) {
      categoryMap[cat].items.push(item);
    } else {
      categoryMap.cooked_others.items.push(item);
    }
  });

  const activeCategories = Object.entries(categoryMap)
    .filter(([_, cat]) => cat.items.length > 0)
    .map(([key, cat]) => ({ key, ...cat }));

  const handleSelectUrgent = () => {
    const urgentIds = inventory.filter(item => item.daysLeft <= 3).map(item => item.id);
    setSelectedItemIds(prev => Array.from(new Set([...prev, ...urgentIds])));
  };

  const handleClearAll = () => {
    setSelectedItemIds([]);
  };

  return (
    <div className="space-y-lg pb-40 max-w-5xl mx-auto">

      {/* Style Selector */}
      <StyleSelector currentStyle={currentStyle} setStyle={setCurrentStyle} />

      {/* Ingredients Pool */}
      <section className="space-y-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm mb-sm bg-white/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-md shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-secondary text-white font-black text-xs flex items-center justify-center shadow-sm">
              2
            </span>
            <h3 className="text-base font-extrabold text-slate-blue">挑選冰箱食材</h3>
          </div>
          
          <div className="flex items-center gap-sm flex-wrap">
            {inventory.length > 0 && (
              <>
                <button
                  onClick={handleSelectUrgent}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                  title="優先打包 3 天內即期食材"
                >
                  <span className="material-symbols-outlined text-xs text-rust-orange font-bold">bolt</span> ⚡ 一鍵救援即期
                </button>
                {selectedItemIds.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="bg-surface-container-high hover:bg-outline-variant/30 text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95"
                  >
                    🧹 清空
                  </button>
                )}
              </>
            )}
            <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
              已選取 {selectedItemIds.length} 項
            </span>
          </div>
        </div>

        {inventory.length === 0 ? (
          <div className="bg-surface-container rounded-3xl p-xl flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">kitchen</span>
            <h4 className="text-lg font-bold text-on-surface-variant">冰箱空空如也</h4>
            <p className="text-xs text-outline mt-2">請先到「冰箱沙漏」新增食材</p>
          </div>
        ) : (
          <div className="space-y-md">
            {activeCategories.map(cat => (
              <div key={cat.key} className="bg-white/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-md shadow-sm">
                <div className="flex items-center justify-between mb-sm pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined font-bold text-lg">{cat.icon}</span>
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-blue">{cat.title}</h4>
                  </div>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${cat.badgeBg}`}>
                    {cat.items.length} 項
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md">
                  {cat.items.map(item => (
                    <FridgeItem
                      key={item.id}
                      item={item}
                      isKitchenMode={true}
                      isSelected={selectedItemIds.includes(item.id)}
                      isTaskTarget={preselectedItemIds.includes(item.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Button */}
      <FloatingRecipeAction
        selectedCount={selectedItemIds.length}
        currentStyle={currentStyle}
        onGenerate={handleGenerateRecipe}
        isTaskActive={preselectedItemIds.length > 0}
      />

      {/* Recipe Modal */}
      {(isRecipeLoading || generatedRecipe) && (
        <RecipeModal
          isLoading={isRecipeLoading}
          recipe={generatedRecipe}
          currentStyle={currentStyle}
          selectedItemIds={selectedItemIds}
          onClose={() => setGeneratedRecipe(null)}
          onFinishCooking={onFinishCooking}
        />
      )}
    </div>
  );
};

export default KitchenView;
