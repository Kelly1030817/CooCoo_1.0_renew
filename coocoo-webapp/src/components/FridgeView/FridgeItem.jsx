import React, { useState } from 'react';

const FridgeItem = ({ item, isKitchenMode = false, isSelected = false, isTaskTarget = false, onToggleSelect, onEdit }) => {
  const [imgError, setImgError] = useState(false);
  const isUrgent = item.daysLeft <= 1;
  const isNearExpiry = item.daysLeft > 1 && item.daysLeft <= 3;
  const isSuperLong = item.daysLeft > 30;
  const isFresh = item.daysLeft > 7;

  let containerClass = "rounded-2xl p-3 relative flex flex-col shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer select-none backdrop-blur-sm ";
  let statusText = "";
  let statusClass = "";

  if (isTaskTarget) {
    containerClass += "border-2 border-amber-500 bg-amber-50/70 ring-4 ring-amber-400/50 scale-[0.98] shadow-md ";
    statusText = item.daysLeft <= 1 ? (item.daysLeft === 0 ? "今天到期" : "明天到期") : `剩餘 ${item.daysLeft} 天`;
    statusClass = "text-amber-700 font-extrabold";
  } else if (isKitchenMode && isSelected) {
    containerClass += "border-2 border-[#E07A5F] bg-[#E07A5F]/15 ring-2 ring-[#E07A5F]/30 scale-[0.98] shadow-sm";
    statusText = item.daysLeft <= 1 ? (item.daysLeft === 0 ? "今天到期" : "明天到期") : (item.daysLeft >= 30 ? `剩餘 ${Math.ceil(item.daysLeft / 30)} 個月` : `剩餘 ${item.daysLeft} 天`);
    statusClass = "text-[#E07A5F] font-bold";
  } else if (isUrgent) {
    containerClass += "bg-rust-orange/10 border-2 border-rust-orange animate-pulse-urgent";
    statusText = item.daysLeft === 0 ? "今天到期" : "明天到期";
    statusClass = "text-rust-orange font-black";
  } else if (isNearExpiry) {
    containerClass += "bg-amber-50/70 border-2 border-amber-400";
    statusText = `剩餘 ${item.daysLeft} 天 (急)`;
    statusClass = "text-amber-700 font-extrabold";
  } else if (isSuperLong) {
    containerClass += "border-2 border-[#8ab0d0]/80 bg-white/60 hover:bg-white/80";
    statusText = `剩餘 ${Math.ceil(item.daysLeft / 30)} 個月`;
    statusClass = "text-[#4c7396] font-bold";
  } else if (isFresh) {
    containerClass += "border-2 border-sage-green/70 bg-white/70 hover:bg-white/90";
    statusText = `剩餘 ${item.daysLeft} 天`;
    statusClass = "text-secondary font-bold";
  } else {
    containerClass += "border-2 border-ochre-gold/70 bg-white/70 hover:bg-white/90";
    statusText = `剩餘 ${item.daysLeft} 天`;
    statusClass = "text-tertiary font-bold";
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
      {/* Top-Left Selection Checkmark Badge for Kitchen Mode */}
      {isKitchenMode && isSelected && (
        <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#E07A5F] text-white shadow-md flex items-center justify-center z-10 animate-in zoom-in-50 duration-150">
          <span className="material-symbols-outlined text-sm font-bold">check</span>
        </span>
      )}

      {/* Top-Left Circular Edit Icon Button for Normal Mode */}
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
        <div className="w-16 h-16 rounded-full bg-white mb-2 shadow-inner overflow-hidden border-2 border-outline-variant/20 flex-shrink-0 flex items-center justify-center">
          {!imgError && item.image ? (
            <img
              className="w-full h-full object-cover"
              src={item.image}
              alt={item.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-secondary/10 text-secondary flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-2xl font-bold">restaurant</span>
            </div>
          )}
        </div>
        <h4 className="font-extrabold text-sm text-slate-blue truncate w-full">
          {item.name} ({item.qty}{item.unit})
        </h4>
        <p className={`text-[11px] ${statusClass} mt-0.5`}>{statusText}</p>
        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">購入: {item.addedDate}</p>
      </div>

      {/* Quick Actions Panel */}
      {isKitchenMode ? (
        <div className="mt-3 pt-2 border-t border-outline-variant/20 flex justify-center items-center w-full">
          <span className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full transition-all ${isSelected ? 'bg-[#E07A5F] text-white shadow-sm' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {isSelected ? '✓ 已選取' : '點擊選取'}
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
