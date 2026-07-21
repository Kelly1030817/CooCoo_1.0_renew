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

      {/* Shopping Image Card */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-56 group cursor-pointer border border-primary/5">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFdT7khBw1YySuMG6E-BiRBWW4kKbq9Gz-QBazxn2Ilby4IN-LKEP6eiWDx4QWzxlh2FDFLaCM-PFOQF6Wh1ydvyc9bbtj1t83cay8giDmykEUvU6mADMS-5x99ZcX2J_2KYepRHQ0ZtMqISHMZTV-T2Kliao_hhgLCVkbiMugMzuVGdwVnKONXnPWeez1drVdxZlBCF_kF21lVR0C9MG1Fh3eGV49AyZu9MW43pjYm_KG8ijgyxr5A8Unnq6DpcqbxHbAwxNdnaw"
          alt="鄰近有機市集"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-md">
          <span className="text-white font-extrabold text-base">鄰近有機市集</span>
          <p className="text-white/80 text-[11px] font-semibold mt-1">每週日上午 08:00 - 17:00 開市</p>
        </div>
      </div>

      {/* Traditional Market Card */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-56 group cursor-pointer border border-primary/5">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070&auto=format&fit=crop"
          alt="全台傳統菜市場"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-md">
          <span className="text-white font-extrabold text-base">全台傳統菜市場</span>
          <p className="text-white/80 text-[11px] font-semibold mt-1">包含熱鬧早市與溫馨黃昏市場</p>
        </div>
      </div>
    </div>
  );
};

export default SideCards;
