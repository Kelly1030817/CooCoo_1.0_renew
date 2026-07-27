import React, { useState, useEffect } from 'react';

const SAVING_TIPS = [
  { icon: 'eco', title: '根莖類保存法', text: '紅蘿蔔、白蘿蔔切除葉片再冷藏，可避免水分流失。' },
  { icon: 'kitchen', title: '肉類分裝法', text: '肉類買回家後，立刻依每餐份量分裝冷凍，解凍更快速且新鮮。' },
  { icon: 'shopping_cart', title: '列清單不盲買', text: '前往超市前，先確認冰箱庫存，只買清單上的物品，省錢又防爆倉。' }
];

const SideCards = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % SAVING_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextTip = () => {
    setTipIndex(prev => (prev + 1) % SAVING_TIPS.length);
  };

  const currentTip = SAVING_TIPS[tipIndex];

  return (
    <div className="lg:col-span-4 space-y-lg">
      {/* Benefit Card */}
      <div className="bg-white/50 backdrop-blur-md border border-[#F2CC8F] rounded-3xl p-md shadow-sm flex flex-col justify-center min-h-[140px] transition-all duration-300 hover:shadow-md relative overflow-hidden group select-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F2CC8F] to-secondary"></div>
        <div className="space-y-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#be5f48] fill animate-pulse text-lg">
                {currentTip.icon}
              </span>
              <h4 className="text-sm font-extrabold text-slate-blue">{currentTip.title}</h4>
            </div>
            <button
              onClick={nextTip}
              className="text-on-surface-variant hover:text-secondary p-1 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center"
              title="下一則妙招"
            >
              <span className="material-symbols-outlined text-sm font-extrabold">arrow_forward_ios</span>
            </button>
          </div>
          <p className="text-[13px] font-bold text-on-surface-variant leading-relaxed min-h-[55px]">
            {currentTip.text}
          </p>
        </div>
      </div>

      {/* Market Map Card with Live Location Pill & Hover Zoom */}
      <div className="relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/30 h-60 transition-all duration-500 hover:-translate-y-1">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
          alt="鄰近黃昏市集"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-blue/90 via-slate-blue/40 to-transparent flex flex-col justify-between p-5 text-white">
          {/* Top Live Pill */}
          <div className="flex justify-between items-center">
            <span className="bg-white/95 text-slate-blue backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              📍 離你最近：西屯黃昏市場
            </span>
            <span className="bg-[#9a442d]/85 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold">
              步行 5 mins
            </span>
          </div>

          {/* Bottom Content */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-400 text-lg">storefront</span>
              <h4 className="font-black text-base tracking-wide text-white">鄰近生鮮黃昏市集</h4>
            </div>
            <p className="text-xs text-slate-200 line-clamp-2">
              生鮮海產、在地農家蔬果直送！點擊開啟 AI 採買地圖與實時特惠資訊...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideCards;
