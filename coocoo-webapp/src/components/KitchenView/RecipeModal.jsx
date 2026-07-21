import React from 'react';

const RecipeModal = ({ isLoading, recipe, onClose, currentStyle }) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-xl shadow-2xl max-w-[420px] w-full mx-gutter text-center space-y-md border border-primary/5 animate-pulse">
          <span className="material-symbols-outlined text-5xl text-ochre-gold animate-spin">auto_awesome</span>
          <h3 className="text-lg font-extrabold text-slate-blue">AI 大廚正在精算中...</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
            正在為您融合「{currentStyle}」風格與食材，規劃食譜...
          </p>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-lg shadow-2xl max-w-[500px] w-full mx-gutter border border-primary/5 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-md border-b border-outline-variant/30 flex-shrink-0">
          <div className="flex items-center gap-xs text-ochre-gold">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            <h3 className="text-lg font-extrabold text-slate-blue">AI 專屬食譜</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-md space-y-md custom-scrollbar pr-2">
          {/* Title and Meta */}
          <div>
            <span className="inline-block px-2 py-0.5 bg-secondary/10 text-[10px] font-extrabold text-secondary rounded-full mb-2 border border-secondary/20">
              {recipe.style}
            </span>
            <h4 className="text-xl font-extrabold text-slate-blue leading-tight mb-sm">{recipe.title}</h4>
            <div className="flex gap-md">
              <div className="flex items-center gap-1 text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="text-xs font-bold">{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-sm">payments</span>
                <span className="text-xs font-bold">{recipe.estCost}</span>
              </div>
            </div>
          </div>

          {/* Scientific Principle */}
          <div className="bg-secondary/5 border-l-4 border-secondary p-md rounded-r-xl">
            <h5 className="text-xs font-extrabold text-secondary flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-sm">science</span> 科學自煮原理
            </h5>
            <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
              {recipe.scientificPrinciple}
            </p>
          </div>

          {/* Steps */}
          <div>
            <h5 className="text-sm font-extrabold text-slate-blue mb-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-base">format_list_numbered</span> 料理步驟
            </h5>
            <div className="space-y-sm">
              {recipe.steps.map((step, index) => (
                <div key={index} className="flex gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 hover:border-secondary/30 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-slate-blue text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-md border-t border-outline-variant/30 flex gap-sm flex-shrink-0">
          <button onClick={() => alert('【換一道】\n將重新向 AI 請求新的食譜組合！')} className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
            不喜歡，換一道
          </button>
          <button onClick={() => { alert('【開始料理】\n已記錄為今日目標！'); onClose(); }} className="flex-1 bg-[#F2CC8F] hover:bg-[#F2CC8F]/80 text-[#765a28] font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm fill">skillet</span> 開始料理
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
