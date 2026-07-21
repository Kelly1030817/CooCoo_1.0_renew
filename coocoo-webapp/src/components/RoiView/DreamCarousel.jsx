import React from 'react';

const valueText = (dream) => {
  return `NT$ ${(Number(dream.savedAmount) || 0).toLocaleString()}`;
};

const DreamCarousel = ({ dreams, activeDreamId, onSwitchDream, onNewDream }) => {
  return (
    <div className="flex gap-sm overflow-x-auto mb-md pb-2 custom-scrollbar">
      {dreams.map(d => {
        const isActive = d.id === activeDreamId;
        return (
          <div
            key={d.id}
            onClick={() => onSwitchDream(d.id)}
            className={`flex-shrink-0 w-32 p-3 rounded-2xl cursor-pointer transition-all border ${
              isActive
                ? 'bg-white border-primary shadow-md scale-105'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center gap-sm">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-primary/10 text-primary' : 'bg-white text-outline-variant'}`}>
                <span className="material-symbols-outlined text-sm">{d.icon}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-blue truncate">{d.name}</h4>
                <div className="text-[10px] text-on-surface-variant font-medium mt-0.5 truncate">
                  {valueText(d)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Add New Dream Button */}
      <div
        onClick={onNewDream}
        className="flex-shrink-0 flex items-center justify-center gap-sm border-2 border-dashed border-outline-variant/50 rounded-2xl cursor-pointer hover:bg-surface-container-low transition-colors"
        style={{ minWidth: '120px' }}
      >
        <span className="material-symbols-outlined text-outline-variant text-xl">add</span>
        <span className="text-xs font-bold text-outline-variant">新夢想分支</span>
      </div>
    </div>
  );
};

export default DreamCarousel;
