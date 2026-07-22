import React, { useState } from 'react';

export default function DevToolsPanel({
  onTriggerOnboarding,
  onAddTestItem,
  onAddExpiringItem,
  onClearInventory,
  onResetAll,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Expanded Control Box */}
      {isOpen && (
        <div className="mb-2 w-64 bg-slate-blue text-white rounded-3xl p-4 shadow-2xl border-2 border-ochre-gold/40 animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-black text-ochre-gold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">terminal</span> 開發者 / 除錯測試工具箱
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <button
              onClick={onTriggerOnboarding}
              className="w-full bg-primary hover:brightness-110 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">restaurant_menu</span>
              呼叫「主廚相談室」
            </button>

            <button
              onClick={onAddExpiringItem}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              造出「快過期食材」(觸發救援)
            </button>

            <button
              onClick={onAddTestItem}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              快速注入 1 項隨機食材
            </button>

            <button
              onClick={onClearInventory}
              className="w-full bg-red-800/80 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              清空所有食材庫存
            </button>

            <button
              onClick={onResetAll}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              重置所有資料為預設值
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-blue hover:bg-slate-blue/90 text-ochre-gold font-black px-3 py-2 rounded-full shadow-2xl border-2 border-ochre-gold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-base">bug_report</span>
        {isOpen ? '關閉測試面板' : '除錯測試面板'}
      </button>
    </div>
  );
}
