import React from 'react';

const cookingStyles = [
  { name: '無特定風格 (AI 自由發揮)', icon: 'auto_awesome' },
  { name: '台式家常', icon: 'rice_bowl' },
  { name: '日式和風', icon: 'bento' },
  { name: '西式排餐', icon: 'flatware' },
  { name: '低卡健康', icon: 'eco' }
];

const StyleSelector = ({ currentStyle, setStyle }) => {
  return (
    <section className="bg-white/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-md shadow-sm">
      <div className="flex items-center gap-2 mb-sm">
        <span className="w-6 h-6 rounded-full bg-secondary text-white font-black text-xs flex items-center justify-center shadow-sm">
          1
        </span>
        <h3 className="text-base font-extrabold text-slate-blue">選擇料理風格</h3>
      </div>
      <div className="flex gap-sm overflow-x-auto pb-1 custom-scrollbar">
        {cookingStyles.map(styleObj => {
          const isSelected = currentStyle === styleObj.name;
          return (
            <button
              key={styleObj.name}
              onClick={() => setStyle(styleObj.name)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 border active:scale-95 ${
                isSelected
                  ? 'bg-secondary text-white border-secondary shadow-md scale-[1.02] ring-2 ring-secondary/20'
                  : 'bg-white text-on-surface-variant border-outline-variant/30 hover:border-secondary/50 hover:bg-secondary/5'
              }`}
            >
              <span className={`material-symbols-outlined text-base ${isSelected ? 'text-white' : 'text-secondary'}`}>
                {styleObj.icon}
              </span>
              {styleObj.name}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default StyleSelector;
