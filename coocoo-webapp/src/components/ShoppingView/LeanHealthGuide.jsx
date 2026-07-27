import React from 'react';

const LeanHealthGuide = ({ vegCount, protCount }) => {
  const vegTarget = 5;
  const protTarget = 3;
  const vegShortage = Math.max(0, vegTarget - vegCount);
  const protShortage = Math.max(0, protTarget - protCount);
  
  const vegPercent = Math.min(100, Math.round((vegCount / vegTarget) * 100));
  const protPercent = Math.min(100, Math.round((protCount / protTarget) * 100));
  const totalPercent = Math.round(((vegPercent + protPercent) / 2));

  return (
    <div className="w-full bg-gradient-to-r from-[#81b29a]/10 via-white to-[#e07a5f]/10 rounded-3xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-[#81b29a]/20 text-[#386753] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">health_metrics</span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-blue flex items-center gap-1.5">
              精益健康指南 · 每週 5 蔬 3 蛋白缺口精算
            </h3>
            <p className="text-xs text-on-surface-variant/70 font-medium">
              比對庫存與採買清單，自動精算膳食營養覆蓋率
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border shadow-xs transition-all ${
          totalPercent >= 100
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-[#f2cc8f]/30 text-[#765a28] border-[#f2cc8f]/50'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {totalPercent >= 100 ? 'verified' : 'auto_awesome'}
          </span>
          {totalPercent >= 100 ? '🎉 本週膳食纖維與蛋白全數達標！' : `目標覆蓋率 ${totalPercent}% · 邁向均衡飲食`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#386753]">eco</span>
              <span className="text-xs font-extrabold text-slate-blue">新鮮蔬菜 (每週目標 5 種)</span>
            </div>
            <span className="text-xs font-black text-[#386753]">{vegCount} / {vegTarget} 種</span>
          </div>
          <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#81b29a] to-[#386753] rounded-full transition-all duration-500"
              style={{ width: `${vegPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-on-surface-variant font-medium">包含冰箱庫存與採買清單</span>
            {vegShortage > 0 ? (
              <span className="font-extrabold text-[#be5f48] bg-[#e07a5f]/15 px-2 py-0.5 rounded-full">
                還差 {vegShortage} 種達標
              </span>
            ) : (
              <span className="font-extrabold text-[#386753] bg-[#81b29a]/20 px-2 py-0.5 rounded-full">
                🎉 已達標！
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#be5f48]">egg</span>
              <span className="text-xs font-extrabold text-slate-blue">優質蛋白質 (每週目標 3 種)</span>
            </div>
            <span className="text-xs font-black text-[#be5f48]">{protCount} / {protTarget} 種</span>
          </div>
          <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#e07a5f] to-[#9a442d] rounded-full transition-all duration-500"
              style={{ width: `${protPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-on-surface-variant font-medium">包含冰箱庫存與採買清單</span>
            {protShortage > 0 ? (
              <span className="font-extrabold text-[#be5f48] bg-[#e07a5f]/15 px-2 py-0.5 rounded-full">
                還差 {protShortage} 種達標
              </span>
            ) : (
              <span className="font-extrabold text-[#386753] bg-[#81b29a]/20 px-2 py-0.5 rounded-full">
                🎉 已達標！
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeanHealthGuide;
