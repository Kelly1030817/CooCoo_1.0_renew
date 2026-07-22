import React from 'react';

const RecipeModal = ({ isLoading, recipe, onClose, currentStyle, selectedItemIds = [], onFinishCooking }) => {
  const [completedSteps, setCompletedSteps] = React.useState({});

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

  const toggleStep = (index) => {
    setCompletedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const totalSteps = recipe.steps ? recipe.steps.length : 0;
  const doneCount = Object.values(completedSteps).filter(Boolean).length;

  const handleFinish = () => {
    if (onFinishCooking) {
      onFinishCooking({ recipe, selectedItemIds });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-lg shadow-2xl max-w-[500px] w-full mx-gutter border border-primary/5 flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center pb-md border-b border-outline-variant/30 flex-shrink-0">
          <div className="flex items-center gap-xs text-ochre-gold">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            <h3 className="text-lg font-extrabold text-slate-blue">AI 任務專屬食譜</h3>
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

          {/* Steps with Checkbox */}
          <div>
            <div className="flex justify-between items-center mb-sm">
              <h5 className="text-sm font-extrabold text-slate-blue flex items-center gap-1">
                <span className="material-symbols-outlined text-base">format_list_numbered</span> 料理步驟清單
              </h5>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                doneCount === totalSteps ? 'text-emerald-700 bg-emerald-100 font-black' : 'text-emerald-600 bg-emerald-50'
              }`}>
                完成度 {doneCount}/{totalSteps}
              </span>
            </div>
            <div className="space-y-sm">
              {recipe.steps.map((step, index) => {
                const isChecked = !!completedSteps[index];
                return (
                  <div
                    key={index}
                    onClick={() => toggleStep(index)}
                    className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                        : 'bg-surface-container-low border-outline-variant/20 hover:border-secondary/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5 transition-all ${
                      isChecked ? 'bg-emerald-500 text-white scale-110' : 'bg-slate-blue text-white'
                    }`}>
                      {isChecked ? '✓' : index + 1}
                    </div>
                    <p className={`text-sm leading-relaxed font-bold ${isChecked ? 'text-emerald-900 font-extrabold' : 'text-on-surface-variant'}`}>
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-md border-t border-outline-variant/30 flex gap-sm flex-shrink-0">
          <button onClick={onClose} className="bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all">
            取消
          </button>
          {(() => {
            const isAllDone = totalSteps > 0 && doneCount === totalSteps;
            return (
              <button
                onClick={handleFinish}
                disabled={!isAllDone}
                className={`flex-1 font-extrabold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 ${
                  isAllDone
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white shadow-md active:scale-[0.98] cursor-pointer animate-pulse'
                    : 'bg-gray-150 bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/60'
                }`}
              >
                {isAllDone ? (
                  <>
                    <span className="material-symbols-outlined text-sm fill">task_alt</span> 🎉 完成料理並領取獎勵！
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">lock</span> 請點擊勾選完所有步驟 ({doneCount}/{totalSteps})
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
