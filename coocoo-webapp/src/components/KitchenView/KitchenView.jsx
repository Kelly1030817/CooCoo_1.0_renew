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
    vegetable_fruit: { title: "🥬 蔬菜與水果", icon: "eco", items: [] },
    meat_seafood: { title: "🥩 肉類與海鮮", icon: "set_meal", items: [] },
    dairy_egg_soy: { title: "🥚 蛋奶與豆類", icon: "egg", items: [] },
    cooked_others: { title: "📦 熟食與其他", icon: "inventory_2", items: [] }
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

  return (
    <div className="space-y-lg pb-32 max-w-5xl mx-auto">


      {/* Style Selector */}
      <StyleSelector currentStyle={currentStyle} setStyle={setCurrentStyle} />

      {/* Ingredients Pool */}
      <section className="space-y-md">
        <div className="flex items-center justify-between mb-sm">
          <h3 className="text-sm font-extrabold text-slate-blue flex items-center gap-1">
            <span className="material-symbols-outlined text-secondary font-bold">view_module</span> 2. 挑選冰箱食材 (已分類)
          </h3>
          <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
            已選取 {selectedItemIds.length} 項
          </span>
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
              <div key={cat.key} className="bg-white border border-outline-variant/30 rounded-2xl p-md shadow-sm">
                <div className="flex items-center justify-between mb-sm pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary font-bold text-lg">{cat.icon}</span>
                    <h4 className="text-sm font-extrabold text-slate-blue">{cat.title}</h4>
                  </div>
                  <span className="text-xs font-extrabold bg-slate-blue/10 text-slate-blue px-2.5 py-0.5 rounded-full">
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
