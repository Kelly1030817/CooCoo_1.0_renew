import React from 'react';

const cookingStyles = ['無特定風格 (AI 自由發揮)', '台式家常', '日式和風', '西式排餐', '低卡健康'];

const StyleSelector = ({ currentStyle, setStyle }) => {
  return (
    <section>
      <h3 className="text-sm font-extrabold text-slate-blue mb-sm">1. 選擇料理風格</h3>
      <div className="flex gap-sm overflow-x-auto pb-2 custom-scrollbar">
        {cookingStyles.map(style => {
          const isSelected = currentStyle === style;
          return (
            <button
              key={style}
              onClick={() => setStyle(style)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                isSelected
                  ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
              }`}
            >
              {style}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default StyleSelector;
