import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const ActionReminders = ({ activeDreamName }) => {
  const { showToast } = useToast();
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleFridayPlanClick = (planName) => {
    showToast(`🎯 已記錄本週五 B 計劃備案：「${planName}」！`, 'success', 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mt-lg">
      {/* Delivery Blocker */}
      <div className="bg-oatmeal-sand border-l-[6px] border-terracotta rounded-2xl p-lg flex items-center gap-lg shadow-sm">
        <div className="hidden sm:block">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center">
            <span className="material-symbols-outlined text-terracotta text-4xl fill">block</span>
          </div>
        </div>
        <div className="flex-1 space-y-md">
          <div>
            <h4 className="text-lg font-extrabold text-on-surface mb-xs">外送衝動阻斷器</h4>
            <p className="text-sm font-medium text-on-surface-variant">
              當你感到疲憊想叫外送時，想想「{activeDreamName}」，點擊下方看看有哪些現成食材！
            </p>
          </div>
          <button 
            onClick={() => setShowBlockerModal(true)}
            className="bg-terracotta text-white px-lg py-sm rounded-full text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            我快要點外送了 🚨
          </button>
        </div>
      </div>

      {/* Friday Plan B */}
      <div className="bg-slate-blue rounded-2xl p-lg flex flex-col justify-between text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-lg opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[100px]">restaurant</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-sm mb-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-ochre-gold">event_repeat</span>
              <h4 className="text-lg font-extrabold text-ochre-gold">週五 B 計劃</h4>
            </div>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="text-[#f4ecd8]/70 hover:text-white"
              title="設定提醒時間"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>
          </div>
          <p className="text-xs font-medium text-[#f4ecd8]/80 mb-md">先決定備案，不必等到又餓又累才想。</p>
          
          <div className="space-y-xs">
            {/* Plan A */}
            <button onClick={() => handleFridayPlanClick('正常料理')} className="w-full bg-white/10 hover:bg-white/15 rounded-xl p-sm text-left flex gap-sm items-start transition-colors">
              <span className="w-7 h-7 rounded-full bg-ochre-gold text-slate-blue text-xs font-extrabold flex items-center justify-center shrink-0">A</span>
              <span>
                <strong className="block text-xs text-white">正常料理</strong>
                <span className="block text-[10px] text-ochre-gold">體力可以時，優先把即期食材煮成完整一餐。</span>
              </span>
            </button>
            {/* Plan B */}
            <button onClick={() => handleFridayPlanClick('低體力')} className="w-full bg-white/10 hover:bg-white/15 rounded-xl p-sm text-left flex gap-sm items-start transition-colors">
              <span className="w-7 h-7 rounded-full bg-ochre-gold text-slate-blue text-xs font-extrabold flex items-center justify-center shrink-0">B</span>
              <span>
                <strong className="block text-xs text-white">低體力 · 15 分鐘內</strong>
                <span className="block text-[10px] text-ochre-gold">少洗鍋、快速上桌，保留週五晚上的休息時間。</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Blocker Modal */}
      {showBlockerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdfae7] border border-[#be5f48]/40 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#be5f48]/20 text-[#be5f48] border border-[#be5f48] mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">local_fire_department</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#2c221e]">省錢阻斷啟動！🛵</h3>
            <p className="text-sm text-stone-600 font-medium leading-relaxed">
              點外送一餐通常花費 <span className="font-bold text-[#be5f48]">$200 - $350</span>，而家裡冰箱沙漏正有即期食材等著你！省下這筆錢，距離「{activeDreamName}」又近了一步！
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowBlockerModal(false);
                  showToast('👍 棒極了！讓我們一起去冰箱沙漏清食材！', 'success');
                }}
                className="bg-[#386753] hover:brightness-110 text-white font-extrabold py-3 rounded-full text-sm shadow-md transition-all active:scale-95"
              >
                好的，我去煮家裡的食材！
              </button>
              <button
                onClick={() => setShowBlockerModal(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold py-2"
              >
                關閉提示
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friday Plan Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdfae7] border border-stone-300 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-[#2c221e]">週五 B 計劃通知設定</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-xs text-stone-600">設定每週五下午提醒備案的時間，避免下班疲累時做出衝動消費。</p>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">每週五推播提醒時間</label>
              <input type="time" defaultValue="17:30" className="w-full px-4 py-2 rounded-xl border border-stone-300 text-sm font-bold bg-white" />
            </div>
            <button
              onClick={() => {
                setShowSettingsModal(false);
                showToast('已更新週五 B 計劃提醒時間！', 'success');
              }}
              className="w-full bg-[#be5f48] hover:bg-[#9a442d] text-white font-extrabold py-3 rounded-full text-sm shadow-md transition-all active:scale-95"
            >
              儲存設定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionReminders;
