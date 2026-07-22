import React from 'react';

const FridgeItem = ({ item, isKitchenMode = false, isSelected = false, isTaskTarget = false, onToggleSelect, onEdit }) => {
  const isUrgent = item.daysLeft <= 1;
  const isSuperLong = item.daysLeft > 30;
  const isFresh = item.daysLeft > 7;

  let containerClass = "rounded-2xl p-3 relative flex flex-col shadow-sm hover:shadow transition-all group cursor-pointer ";
  let statusText = "";
  let statusClass = "";

  if (isTaskTarget) {
    containerClass += "border-2 border-amber-500 bg-amber-50/80 ring-4 ring-amber-400/50 scale-[0.98] shadow-md ";
    statusText = item.daysLeft <= 1 ? (item.daysLeft === 0 ? "今天到期" : "明天到期") : `剩餘 ${item.daysLeft} 天`;
    statusClass = "text-amber-700 font-extrabold";
  } else if (isKitchenMode && isSelected) {
    containerClass += "border-2 border-secondary bg-secondary/15 ring-2 ring-secondary/20 scale-[0.98]";
    statusText = item.daysLeft <= 1 ? (item.daysLeft === 0 ? "今天到期" : "明天到期") : (item.daysLeft >= 30 ? `剩餘 ${Math.ceil(item.daysLeft / 30)} 個月` : `剩餘 ${item.daysLeft} 天`);
    statusClass = "text-secondary font-bold";
  } else if (isUrgent) {
    containerClass += "bg-rust-orange/10 border-2 border-rust-orange animate-pulse-urgent";
    statusText = item.daysLeft === 0 ? "今天到期" : "明天到期";
    statusClass = "text-rust-orange";
  } else if (isSuperLong) {
    containerClass += "border-2 border-[#8ab0d0] bg-[#8ab0d0]/10";
    statusText = `剩餘 ${Math.ceil(item.daysLeft / 30)} 個月`;
    statusClass = "text-[#4c7396] font-bold";
  } else if (isFresh) {
    containerClass += "border-2 border-sage-green bg-sage-green/10";
    statusText = `剩餘 ${item.daysLeft} 天`;
    statusClass = "text-secondary";
  } else {
    containerClass += "border-2 border-ochre-gold bg-ochre-gold/10";
    statusText = `剩餘 ${item.daysLeft} 天`;
    statusClass = "text-tertiary";
  }

  const handleClick = (e) => {
    if (isKitchenMode && onToggleSelect) {
      onToggleSelect(item.id);
    } else if (!isKitchenMode && onEdit) {
      onEdit(item);
    }
  };

  return (
    <div className={containerClass} onClick={handleClick}>
      {/* Top-Left Circular Edit Icon Button */}
      {!isKitchenMode && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 hover:bg-slate-blue hover:text-white text-slate-blue border border-slate-blue/20 shadow-sm flex items-center justify-center transition-all active:scale-90 z-10"
          title="編輯食材"
        >
          <span className="material-symbols-outlined text-[13px]">edit</span>
        </button>
      )}

      {isTaskTarget && (
        <span className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-500 to-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-10 flex items-center gap-0.5">
          🎯 任務食材
        </span>
      )}
      {item.boxSize && item.boxSize !== '無' && (
        <span className="absolute top-2 right-2 bg-slate-blue/10 text-slate-blue text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-blue/10">
          盒:{item.boxSize}
        </span>
      )}
      <div className="flex flex-col items-center text-center w-full">
        <div className="w-16 h-16 rounded-full bg-white mb-2 shadow-inner overflow-hidden border-2 border-outline-variant/20 flex-shrink-0">
          <img
            className="w-full h-full object-cover"
            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop'}
            alt={item.name}
          />
        </div>
        <h4 className="font-extrabold text-sm text-slate-blue truncate w-full">
          {item.name} ({item.qty}{item.unit})
        </h4>
        <p className={`text-[11px] font-extrabold ${statusClass} mt-0.5`}>{statusText}</p>
        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">購入: {item.addedDate}</p>
      </div>

      {/* Quick Actions Panel */}
      {isKitchenMode ? (
        <div className="mt-3 pt-2 border-t border-outline-variant/20 flex justify-center items-center w-full">
          <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-secondary font-bold' : 'text-outline-variant'}`}>
            {isSelected ? 'check_box' : 'check_box_outline_blank'}
          </span>
          <span className={`text-[11px] font-bold ml-1 ${isSelected ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {isSelected ? '已選取' : '點擊選取'}
          </span>
        </div>
      ) : (
        <div className="flex gap-2 mt-3 pt-2 border-t border-outline-variant/20 w-full" onClick={(e) => e.stopPropagation()}>
          <button
            className="flex-1 bg-secondary text-white hover:brightness-110 font-bold py-1.5 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 active:scale-95"
            title="完成料理"
          >
            <span className="material-symbols-outlined text-xs fill">restaurant</span> 完成料理
          </button>
          <button
            className="bg-surface-container-high text-on-surface hover:bg-error hover:text-white font-bold px-2.5 rounded-lg text-[10px] transition-all flex items-center justify-center active:scale-95"
            title="食材腐壞/丟棄"
          >
            <span className="material-symbols-outlined text-xs">delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FridgeItem;
