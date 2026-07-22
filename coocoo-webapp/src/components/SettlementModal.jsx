import React from 'react';

export default function SettlementModal({ data, onClose }) {
  if (!data) return null;

  const { questTitle, exp = 50, savings = 120, consumedNames = [] } = data;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-md px-4 text-center">
      <div className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-6 shadow-2xl animate-fade-in border-2 border-amber-300">
        
        {/* Animated Trophy Header */}
        <div className="relative">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
            <span className="material-symbols-outlined text-5xl animate-bounce">trophy</span>
          </div>
          <span className="absolute top-0 right-1/4 text-2xl animate-ping">✨</span>
          <span className="absolute bottom-0 left-1/4 text-xl">🎉</span>
        </div>

        <div>
          <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            MISSION COMPLETED
          </span>
          <h2 className="text-2xl font-black text-slate-blue mt-2">
            恭喜破關！
          </h2>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {questTitle ? `達成任務：「${questTitle}」` : '完成美味自煮體驗！'}
          </p>
        </div>

        {/* Rewards Cards */}
        <div className="space-y-2 text-left">
          {/* EXP Reward */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl">hotel_class</span>
              <span className="text-xs font-extrabold text-emerald-900">獲得自煮經驗值</span>
            </div>
            <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-3 py-0.5 rounded-full">
              + {exp} EXP
            </span>
          </div>

          {/* Money Savings Reward */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-xl">savings</span>
              <span className="text-xs font-extrabold text-amber-900">已累積圓夢金</span>
            </div>
            <span className="text-sm font-black text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full">
              + NT$ {savings}
            </span>
          </div>

          {/* Inventory Deduction */}
          {consumedNames.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-gray-500 text-sm">kitchen</span>
                <span className="text-xs font-bold text-gray-700">自動從冰箱扣除食材 ({consumedNames.length}項)</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium pl-6">
                {consumedNames.join('、')}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-500 to-primary text-white font-black py-3 rounded-2xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          太棒了，收下獎勵！
        </button>

      </div>
    </div>
  );
}
