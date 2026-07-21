import React from 'react';

const CapacityCard = ({ profile, inventoryLength }) => {
  if (!profile.isConfigured) {
    return (
      <div className="bg-surface-container-low rounded-2xl p-md border border-dashed border-outline-variant mb-lg flex flex-col sm:flex-row items-center justify-between gap-md cursor-pointer hover:bg-surface-container transition-colors">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-outline">
            <span className="material-symbols-outlined text-[28px]">kitchen</span>
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-blue">尚未設定冰箱容量</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">設定後 AI 將為您把關庫存避免爆倉</p>
          </div>
        </div>
        <button className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
          開始設定
        </button>
      </div>
    );
  }

  const estimatedUsage = inventoryLength * 5 || 0;
  const fillPercent = Math.min(100, Math.round((estimatedUsage / profile.capacityLiters) * 100));
  const isOverfull = fillPercent > 80;

  return (
    <div className="fridge-profile-card p-md mb-lg">
      <div className="flex justify-between items-center mb-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">kitchen</span>
          <h4 className="text-sm font-extrabold text-slate-blue">我的冰箱容量 ({profile.capacityLiters}L)</h4>
        </div>
        <button className="text-[10px] font-bold text-outline hover:text-slate-blue underline">
          修改設定
        </button>
      </div>
      <div className="fridge-capacity-bar mb-2">
        <div className={`fridge-capacity-fill ${isOverfull ? 'overfull' : ''}`} style={{ width: `${fillPercent}%` }}></div>
      </div>
      <div className="flex justify-between items-center text-[10px]">
        <span className="font-bold text-on-surface-variant">目前約佔 {fillPercent}%</span>
        {isOverfull ? (
          <span className="font-bold text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">warning</span> 快爆倉了，建議先吃！
          </span>
        ) : (
          <span className="font-bold text-sage-green flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">check_circle</span> 還有充足空間
          </span>
        )}
      </div>
    </div>
  );
};

export default CapacityCard;
