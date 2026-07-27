import React, { useRef, useEffect } from 'react';

const UserProfilePopover = ({ isOpen, onClose }) => {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={popoverRef}
      className="absolute bottom-16 left-3 w-80 bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-amber-500/20 z-50 animate-fade-in text-slate-blue"
      style={{
        boxShadow: '0 20px 40px -10px rgba(53, 56, 83, 0.25), 0 0 15px rgba(224, 109, 83, 0.15)'
      }}
    >
      {/* 氣泡三角箭頭指示器 */}
      <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r border-b border-amber-500/20 rotate-45"></div>

      {/* Header / 玩家稱號與 EXP 資訊 */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-slate-blue text-white font-extrabold text-lg flex items-center justify-center border-2 border-amber-400 shadow-sm">
              K
            </div>
            <span className="absolute -bottom-1 -right-1 bg-terracotta text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm">
              Lv.3
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-slate-blue text-base">Kelly</h3>
              <span className="text-xs">👨‍🍳</span>
            </div>
            <p className="text-xs font-bold text-amber-700">Lv. 3 平底鍋戰士 🍳</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          title="關閉"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* 經驗值進度條 & 升級提示 */}
      <div className="my-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/50">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-extrabold text-amber-900">升級進度 (EXP)</span>
          <span className="font-bold text-amber-700">450 / 600 (75%)</span>
        </div>
        <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-terracotta h-full rounded-full w-[75%] transition-all duration-500"></div>
        </div>
        <p className="text-[11px] text-amber-800/90 mt-2 leading-relaxed">
          💡 <span className="font-bold">下階預告：</span>再救援 <span className="font-bold text-terracotta">2 份</span> 食材或自煮 1 餐，即可晉升「Lv. 4 雙響鍋主廚」！
        </p>
      </div>

      {/* 廚力戰績統計 Grid */}
      <div className="my-3">
        <h4 className="text-xs font-black text-slate-400 mb-2 tracking-wider uppercase">📊 廚事累積戰績</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-container/60 p-2.5 rounded-xl text-center border border-slate-100">
            <span className="block text-lg font-black text-terracotta">38<span className="text-xs font-normal"> 件</span></span>
            <span className="text-[10px] text-slate-500 font-medium">救援食材</span>
          </div>
          <div className="bg-surface-container/60 p-2.5 rounded-xl text-center border border-slate-100">
            <span className="block text-lg font-black text-amber-600">${1850}</span>
            <span className="text-[10px] text-slate-500 font-medium">圓夢金幣</span>
          </div>
          <div className="bg-surface-container/60 p-2.5 rounded-xl text-center border border-slate-100">
            <span className="block text-lg font-black text-emerald-600">${3600}</span>
            <span className="text-[10px] text-slate-500 font-medium">省下外食</span>
          </div>
        </div>
      </div>

      {/* 成就徽章牆 */}
      <div className="my-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black text-slate-400 tracking-wider uppercase">🏅 廚藝徽章牆</h4>
          <span className="text-[10px] font-bold text-slate-400">已解鎖 3 / 4</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200/60 shadow-2xs">
            <span className="text-xl">🍳</span>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-amber-950 truncate">極限救援王</span>
              <span className="block text-[9px] text-amber-800/80 truncate">拯救30+食材</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200/60 shadow-2xs">
            <span className="text-xl">🌱</span>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-emerald-950 truncate">廚餘轉化達人</span>
              <span className="block text-[9px] text-emerald-800/80 truncate">連7天零過期</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200/60 shadow-2xs">
            <span className="text-xl">💰</span>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-amber-950 truncate">圓夢小資族</span>
              <span className="block text-[9px] text-amber-800/80 truncate">省外食達$1,000</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200/60 opacity-60">
            <span className="text-xl grayscale">🥗</span>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-600 truncate">蔬菜大師</span>
              <span className="block text-[9px] text-slate-400 truncate">未解鎖</span>
            </div>
          </div>
        </div>
      </div>

      {/* 個人飲食偏好與帳號快捷 */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">🌱 少油低鈉</span>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">⏱️ 15分快手</span>
        </div>
        <button className="text-slate-400 hover:text-terracotta text-xs font-bold transition-colors">
          ⚙️ 設定
        </button>
      </div>
    </div>
  );
};

export default UserProfilePopover;
