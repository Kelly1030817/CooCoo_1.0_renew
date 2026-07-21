import React, { useState } from 'react';
import StyleSelector from './StyleSelector';
import FloatingRecipeAction from './FloatingRecipeAction';
import FridgeItem from '../FridgeView/FridgeItem';
import RecipeModal from './RecipeModal';

const KitchenView = ({ inventory }) => {
  const [currentStyle, setCurrentStyle] = useState('無特定風格 (AI 自由發揮)');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  
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
    
    try {
      const items = selectedItemIds.map(id => inventory.find(item => item.id === id)).filter(Boolean);
      const itemNames = items.map(i => i.name);
      
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
        data.data.style = currentStyle; // attach requested style
        setGeneratedRecipe(data.data);
      } else {
        throw new Error(data.message || "Recipe generation failed");
      }
    } catch (err) {
      console.error("AI Recipe API Error:", err);
      alert("AI 食譜生成失敗，請確認後端伺服器是否正常運作。");
    } finally {
      setIsRecipeLoading(false);
    }
  };

  return (
    <div className="space-y-lg pb-32 max-w-5xl mx-auto">
      {/* Header */}
      <section className="flex flex-col gap-sm">
        <h2 className="font-headline-lg text-3xl font-extrabold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-4xl">blender</span> 小廚房
        </h2>
        <p className="text-on-surface-variant text-sm">選擇您的料理風格與現有食材，AI 立即為您客製專屬食譜。</p>
      </section>

      {/* Style Selector */}
      <StyleSelector currentStyle={currentStyle} setStyle={setCurrentStyle} />

      {/* Ingredients Pool */}
      <section>
        <div className="flex items-center justify-between mb-sm">
          <h3 className="text-sm font-extrabold text-slate-blue">2. 挑選冰箱食材</h3>
          <span className="text-xs font-bold text-outline">已選取 {selectedItemIds.length} 項</span>
        </div>

        {inventory.length === 0 ? (
          <div className="bg-surface-container rounded-3xl p-xl flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">kitchen</span>
            <h4 className="text-lg font-bold text-on-surface-variant">冰箱空空如也</h4>
            <p className="text-xs text-outline mt-2">請先到「冰箱沙漏」新增食材</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md">
            {inventory.map(item => (
              <FridgeItem
                key={item.id}
                item={item}
                isKitchenMode={true}
                isSelected={selectedItemIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Button */}
      <FloatingRecipeAction
        selectedCount={selectedItemIds.length}
        currentStyle={currentStyle}
        onGenerate={handleGenerateRecipe}
      />

      {/* Recipe Modal */}
      {(isRecipeLoading || generatedRecipe) && (
        <RecipeModal
          isLoading={isRecipeLoading}
          recipe={generatedRecipe}
          currentStyle={currentStyle}
          onClose={() => setGeneratedRecipe(null)}
        />
      )}
    </div>
  );
};

export default KitchenView;
