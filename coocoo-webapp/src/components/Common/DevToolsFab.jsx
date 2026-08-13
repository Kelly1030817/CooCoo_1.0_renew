import React, { useState } from 'react';

export default function DevToolsFab({ onOpenOnboarding, onOpenSettlement }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartOnboarding = () => {
    setIsOpen(false);
    if (onOpenOnboarding) {
      onOpenOnboarding();
    } else if (window.SingleGoalApp?.startOnboarding) {
      window.SingleGoalApp.startOnboarding();
    }
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    if (window.SingleGoalApp?.openSettings) {
      window.SingleGoalApp.openSettings();
    } else {
      alert('請先載入或初始化單一圓夢目標設定！');
    }
  };

  const handlePromptMealCompletion = () => {
    setIsOpen(false);
    if (window.SingleGoalApp?.promptMealCompletion) {
      window.SingleGoalApp.promptMealCompletion({
        mealName: '開發者測試：高麗菜牛肉煲',
        homeCookCost: 45
      });
    }
    if (onOpenSettlement) {
      onOpenSettlement({
        questTitle: '開發者測試：高麗菜牛肉煲',
        exp: 50,
        savings: 120,
        consumedNames: ['即期高麗菜', '牛肉片']
      });
    }
  };

  const handleOpenCompletionPrompt = () => {
    setIsOpen(false);
    if (window.SingleGoalApp?.openCompletionPrompt) {
      window.SingleGoalApp.openCompletionPrompt();
    } else {
      alert('🎉 觸發 100% 圓夢達成慶祝彈窗！');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-72 bg-slate-900 text-white rounded-2xl shadow-2xl border border-amber-500/40 p-4 space-y-3 backdrop-blur-md bg-opacity-95 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="font-extrabold text-amber-400 flex items-center gap-1.5 text-sm">
              <span className="material-symbols-outlined text-base">developer_mode</span>
              開發者彈窗測試選單
            </span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">1. 盤點與設定調整</p>
            <div class="grid grid-cols-1 gap-1.5">
              <button 
                onClick={handleStartOnboarding}
                title="重新觸發首進打招呼與圓夢許願罐設定"
                className="w-full bg-[#e07a5f] hover:bg-[#d95d39] text-white px-3 py-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-between shadow-sm transition-all text-left"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">handshake</span>
                  👋 重新觸發首進打招呼與圓夢設定
                </span>
                <span class="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono">Step 1-3</span>
              </button>
              <button 
                onClick={handleOpenSettings}
                title="開啟當前計畫設定調整彈窗"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white px-2.5 py-2 rounded-xl text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition-all text-left"
              >
                <span className="material-symbols-outlined text-sm text-amber-400">tune</span>
                計畫調整與圓夢問答
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">2. 小廚房結算劃撥</p>
            <button 
              onClick={handlePromptMealCompletion}
              className="w-full bg-slate-800 hover:bg-emerald-600 text-slate-100 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold border border-slate-700 flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-400">skillet</span>
                料理完成劃撥彈窗
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">測試</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">3. 慶祝與解鎖</p>
            <button 
              onClick={handleOpenCompletionPrompt}
              className="w-full bg-slate-800 hover:bg-amber-600 text-slate-100 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold border border-slate-700 flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-amber-400">celebration</span>
                圓夢達成慶祝彈窗
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">100%</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="開發者測試選單 (Dev Tools)"
        aria-label="開發者測試選單"
        className="bg-slate-900 hover:bg-slate-800 text-amber-400 border-2 border-amber-500/50 p-3.5 rounded-full shadow-2xl transition-all duration-200 active:scale-95 flex items-center justify-center relative group focus:outline-none focus:ring-4 focus:ring-amber-400/30"
      >
        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">bug_report</span>
        <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-slate-900 shadow">DEV</span>
      </button>
    </div>
  );
}
