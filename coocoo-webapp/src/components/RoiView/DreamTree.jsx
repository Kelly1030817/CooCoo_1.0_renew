import React from 'react';

const DreamTree = ({ activeDream, onEditDream }) => {
  if (!activeDream) return null;

  // Calculate Progress
  const progressPercent = activeDream.targetAmount > 0 
    ? Math.min(100, Math.round((activeDream.savedAmount / activeDream.targetAmount) * 100)) 
    : 0;

  const remainingAmount = Math.max(0, activeDream.targetAmount - activeDream.savedAmount);
  const nextMilestone = Math.min(activeDream.targetAmount, Math.max(5000, Math.ceil((activeDream.savedAmount + 1) / 5000) * 5000));
  const milestoneRemaining = Math.max(0, nextMilestone - activeDream.savedAmount);
  const mealsToMilestone = Math.ceil(milestoneRemaining / 80);

  // Estimate
  const monthlyRate = 2350; // Mock rate based on goal.monthlySaved
  const estimatedMonths = Math.ceil(remainingAmount / monthlyRate);
  const estimatedDate = new Date();
  estimatedDate.setMonth(estimatedDate.getMonth() + estimatedMonths);

  const formatCurrency = (val) => `NT$ ${val.toLocaleString()}`;

  return (
    <section className="bg-white rounded-3xl p-lg shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-xl border border-primary/5 transition-all">
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={onEditDream} className="text-outline-variant hover:text-slate-blue transition-colors p-1 bg-surface-container rounded-full">
          <span className="material-symbols-outlined text-lg block">edit</span>
        </button>
      </div>

      {/* Radial Progress */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
        {/* CSS generated radial progress (conic-gradient is inline) */}
        <div 
          className="w-full h-full rounded-full transition-all duration-1000 ease-out" 
          style={{
            background: `radial-gradient(closest-side, white 82%, transparent 80% 100%), conic-gradient(#386753 ${progressPercent}%, #f4ecd8 0)`
          }}
        ></div>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold text-slate-blue">{progressPercent}%</span>
          <span className="text-xs font-bold text-on-surface-variant mt-1">達成率</span>
        </div>
      </div>

      {/* Dream Info */}
      <div className="flex-1 space-y-md text-center md:text-left w-full">
        <div>
          <span className="inline-block px-2 py-0.5 bg-surface-container-high text-[10px] font-extrabold text-on-surface-variant rounded-full mb-2 uppercase tracking-wide">
            {activeDream.type === 'travel' ? '旅遊夢想' : '財務目標'}
          </span>
          <h3 className="text-xl font-extrabold text-slate-blue mb-sm">{activeDream.name}</h3>
          <p className="text-on-surface-variant text-sm font-medium">{activeDream.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-md">
          <div className="bg-surface-container-low p-md rounded-xl">
            <span className="block text-[10px] font-bold text-on-surface-variant uppercase mb-xs">目前累積</span>
            <span className="text-2xl font-extrabold text-primary">
              {formatCurrency(activeDream.savedAmount)}
            </span>
          </div>
          <div className="bg-surface-container-low p-md rounded-xl">
            <span className="block text-[10px] font-bold text-on-surface-variant uppercase mb-xs">目標</span>
            <span className="text-2xl font-extrabold text-slate-blue">
              {formatCurrency(activeDream.targetAmount)}
            </span>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-md text-left">
          <div className="flex justify-between gap-sm">
            <span className="text-xs font-extrabold text-slate-blue">下一個小里程碑</span>
            <span className="text-xs font-extrabold text-primary">{formatCurrency(nextMilestone)}</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-xs">
            再累積 {formatCurrency(milestoneRemaining)}，約等於 {mealsToMilestone} 次自煮；依目前本月速度，預估 {estimatedDate.getFullYear()} 年 {estimatedDate.getMonth() + 1} 月達成最終目標。
          </p>
        </div>
      </div>
    </section>
  );
};

export default DreamTree;
