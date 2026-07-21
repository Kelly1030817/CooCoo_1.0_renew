import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'fridge', icon: 'hourglass_empty', label: '冰箱沙漏' },
    { id: 'shopping', icon: 'shopping_cart', label: '補貨區' },
    { id: 'kitchen', icon: 'blender', label: '小廚房' },
    { id: 'roi', icon: 'savings', label: '圓夢看板' }
  ];

  return (
    <nav className="w-64 bg-surface-container-highest border-r border-outline-variant/40 h-screen flex flex-col p-md shrink-0">
      <div className="flex items-center gap-sm mb-xl">
        <span className="material-symbols-outlined text-terracotta text-3xl">kitchen</span>
        <h1 className="text-xl font-extrabold text-slate-blue tracking-wide">CooCoo 煮煮</h1>
      </div>

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

      <div className="mt-auto pt-md border-t border-outline-variant/40 flex items-center gap-sm cursor-pointer hover:bg-surface-container p-sm rounded-xl transition-colors">
        <div className="w-10 h-10 rounded-full bg-slate-blue flex items-center justify-center text-white font-bold">
          K
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-blue">Kelly</span>
          <span className="text-xs text-on-surface-variant">Lv. 3 平底鍋戰士</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
