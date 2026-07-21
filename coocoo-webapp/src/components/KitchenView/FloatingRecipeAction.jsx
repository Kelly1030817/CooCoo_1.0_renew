import React from 'react';

const FloatingRecipeAction = ({ selectedCount, currentStyle, onGenerate }) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] bg-slate-blue text-white p-md rounded-2xl shadow-2xl z-40 flex justify-between items-center gap-md border border-ochre-gold/30">
      <div className="flex items-center gap-sm">
        <span className="material-symbols-outlined text-ochre-gold">auto_awesome</span>
        <div className="text-left">
          <h4 className="text-sm font-extrabold text-ochre-gold">AI 備菜中</h4>
          <p className="text-xs text-[#f4ecd8]/80">
            已選 <span className="text-white font-extrabold text-sm underline">{selectedCount}</span> 項 ‧ {currentStyle}
          </p>
        </div>
      </div>
      <button
        onClick={onGenerate}
        disabled={selectedCount === 0}
        className="bg-[#E07A5F] hover:bg-primary text-white font-extrabold px-lg py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-base">bolt</span> 生成食譜
      </button>
    </div>
  );
};

export default FloatingRecipeAction;
