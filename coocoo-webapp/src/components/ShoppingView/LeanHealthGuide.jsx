import React from 'react';

const LeanHealthGuide = ({ vegCount, protCount }) => {
  const vegShortage = Math.max(0, 5 - vegCount);
  const protShortage = Math.max(0, 3 - protCount);

  return (
    <div className="px-lg pb-md mt-md">
      <div className="w-full bg-[#81b29a]/10 border border-[#81b29a]/35 rounded-2xl p-md text-xs text-[#386753] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md shadow-sm">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined text-xl text-[#386753] fill animate-pulse">restaurant</span>
          <div className="space-y-xs">
            <strong className="font-extrabold text-sm text-[#386753]">精益健康指南</strong>
            <p className="font-bold leading-relaxed text-on-surface-variant/80">
              每週建議備齊 <span className="text-xl font-black text-[#be5f48] mx-0.5">5</span> 種蔬菜 ＋ <span className="text-xl font-black text-[#be5f48] mx-0.5">3</span> 種優質蛋白與乳品。<br />交給 AI 大廚魔術搭配，營養全照顧！
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex flex-col gap-1.5 bg-[#81b29a]/20 p-sm rounded-xl border border-[#81b29a]/30 min-w-[190px] text-[13px] font-black tracking-wide">
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-xs">
              <span className="tracking-wide">蔬菜:</span>
              <span className="text-slate-blue tracking-wide">{vegCount}</span>
            </div>
            {vegShortage > 0 ? (
              <span className="text-[#be5f48] font-black">(還差 {vegShortage} 種)</span>
            ) : (
              <span className="text-[#386753]">(已達標!)</span>
            )}
          </div>
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-xs">
              <span className="tracking-wide">蛋白質:</span>
              <span className="text-slate-blue tracking-wide">{protCount}</span>
            </div>
            {protShortage > 0 ? (
              <span className="text-[#be5f48] font-black">(還差 {protShortage} 種)</span>
            ) : (
              <span className="text-[#386753]">(已達標!)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeanHealthGuide;
