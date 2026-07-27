import React, { useState } from 'react';
import UserProfilePopover from './UserProfilePopover';

const Sidebar = ({ activeTab, setActiveTab, onOpenChefConsultation }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { id: 'shopping', icon: 'shopping_cart', label: '補貨區' },
    { id: 'fridge', icon: 'hourglass_empty', label: '冰箱沙漏' },
    { id: 'kitchen', icon: 'blender', label: '小廚房' },
    { id: 'roi', icon: 'savings', label: '圓夢看板' }
  ];

  return (
    <nav className="w-64 bg-surface-container-highest border-r border-outline-variant/40 h-screen flex flex-col p-md shrink-0 relative">
      <div className="flex items-center gap-sm mb-lg">
        <span className="material-symbols-outlined text-terracotta text-3xl">kitchen</span>
        <h1 className="text-xl font-extrabold text-slate-blue tracking-wide">CooCoo 煮煮</h1>
      </div>

      {/* 「主廚相談室」按鈕 (放置於補貨區上方) */}
      <button
        onClick={onOpenChefConsultation}
        className="mb-md flex items-center gap-md px-md py-3 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-950 hover:bg-amber-600 hover:text-white transition-all shadow-sm group active:scale-95 text-left"
        title="點擊返回主廚相談室重新討論目標"
      >
        <span className="material-symbols-outlined text-2xl text-amber-700 group-hover:text-white transition-colors">
          restaurant_menu
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-sm leading-tight truncate">主廚相談室 👨‍🍳</span>
          <span className="text-[10px] text-amber-800/80 group-hover:text-white/90 truncate mt-0.5">討論目標與菜色</span>
        </div>
      </button>

      <div className="flex flex-col gap-sm flex-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-md px-md py-sm rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? 'bg-terracotta text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface hover:text-terracotta'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl ${isActive ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <span className="font-bold text-md">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 左下角個人英雄榜元件 + Popover 氣泡卡片 */}
      <div className="mt-auto pt-md border-t border-outline-variant/40 relative">
        <UserProfilePopover 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />

        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`w-full flex items-center gap-sm p-sm rounded-2xl transition-all text-left group active:scale-[0.98] border ${
            isProfileOpen 
              ? 'bg-amber-500/15 border-amber-500/40 shadow-sm' 
              : 'hover:bg-surface-container border-transparent hover:border-amber-500/20'
          }`}
          title="點擊查看廚藝戰績與成就"
        >
          {/* 頭像 + Level Mini Badge */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-blue text-white font-bold flex items-center justify-center border border-amber-400/60 shadow-xs group-hover:scale-105 transition-transform">
              K
            </div>
            <span className="absolute -bottom-1 -right-1 bg-terracotta text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white shadow-2xs">
              Lv.3
            </span>
          </div>

          {/* 玩家資訊與 EXP 進度條 */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-blue truncate">Kelly</span>
              <span className="text-[10px] font-bold text-amber-800">75%</span>
            </div>
            <span className="text-[11px] font-bold text-on-surface-variant/80 truncate">Lv. 3 平底鍋戰士</span>
            
            {/* 微型 EXP 進度條 */}
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-terracotta h-full rounded-full w-[75%] transition-all duration-300"></div>
            </div>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;

