import React from 'react';

const ActionReminders = ({ activeDreamName }) => {
  const onBlockerClick = () => {
    alert('【外送衝動阻斷器】\n系統未來將會引導您回到「冰箱沙漏」與「小廚房」，優先選擇家裡的食材！');
  };

  const onFridayPlanClick = (planName) => {
    alert(`【週五 B 計劃】\n您選擇了：「${planName}」\n已記錄為本週五的備案！`);
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
            onClick={onBlockerClick}
            className="bg-terracotta text-white px-lg py-sm rounded-full text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            我快要點外送了
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
              onClick={() => alert('【設定】\n未來可在此設定每週五的通知時間。')}
              className="text-[#f4ecd8]/70 hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>
          </div>
          <p className="text-xs font-medium text-[#f4ecd8]/80 mb-md">先決定備案，不必等到又餓又累才想。</p>
          
          <div className="space-y-xs">
            {/* Plan A */}
            <button onClick={() => onFridayPlanClick('正常料理')} className="w-full bg-white/10 hover:bg-white/15 rounded-xl p-sm text-left flex gap-sm items-start transition-colors">
              <span className="w-7 h-7 rounded-full bg-ochre-gold text-slate-blue text-xs font-extrabold flex items-center justify-center shrink-0">A</span>
              <span>
                <strong className="block text-xs text-white">正常料理</strong>
                <span className="block text-[10px] text-ochre-gold">體力可以時，優先把即期食材煮成完整一餐。</span>
              </span>
            </button>
            {/* Plan B */}
            <button onClick={() => onFridayPlanClick('低體力')} className="w-full bg-white/10 hover:bg-white/15 rounded-xl p-sm text-left flex gap-sm items-start transition-colors">
              <span className="w-7 h-7 rounded-full bg-ochre-gold text-slate-blue text-xs font-extrabold flex items-center justify-center shrink-0">B</span>
              <span>
                <strong className="block text-xs text-white">低體力 · 15 分鐘內</strong>
                <span className="block text-[10px] text-ochre-gold">少洗鍋、快速上桌，保留週五晚上的休息時間。</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionReminders;
