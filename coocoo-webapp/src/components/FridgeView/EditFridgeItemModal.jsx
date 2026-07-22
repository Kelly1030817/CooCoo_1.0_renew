import React, { useState } from 'react';
import { getAISuggestedStorage } from '../../utils/aiStorage';

const EditFridgeItemModal = ({ item, onSave, onClose }) => {
  const [chamber, setChamber] = useState(item.chamber || 'cold');
  const [qty, setQty] = useState(item.qty || 1);
  const [unit, setUnit] = useState(item.unit || '顆');
  const [daysLeft, setDaysLeft] = useState(item.daysLeft !== undefined ? item.daysLeft : 5);
  const [isAutoAdjusted, setIsAutoAdjusted] = useState(false);

  const aiRecCold = getAISuggestedStorage(item.name, 'cold');
  const aiRecFrozen = getAISuggestedStorage(item.name, 'frozen');

  const handleChamberChange = (newChamber) => {
    setChamber(newChamber);
    const aiRec = getAISuggestedStorage(item.name, newChamber);
    setDaysLeft(aiRec.daysLeft);
    setIsAutoAdjusted(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...item,
      chamber,
      qty: Math.max(1, parseInt(qty, 10) || 1),
      unit: unit.trim() || '顆',
      daysLeft: Math.max(0, parseInt(daysLeft, 10) || 0),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-primary/10 flex flex-col space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
          <h3 className="text-base font-extrabold text-slate-blue flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary">edit</span>
            編輯食材資訊
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Item Info Summary */}
        <div className="flex items-center gap-3 bg-surface-container/40 p-3 rounded-2xl border border-outline-variant/20">
          <div className="w-12 h-12 rounded-full bg-white shadow-inner overflow-hidden border border-outline-variant/30 flex-shrink-0">
            <img
              className="w-full h-full object-cover"
              src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop'}
              alt={item.name}
            />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-blue text-sm">{item.name}</h4>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              購入日期：{item.addedDate || '未知'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chamber Selection */}
          <div className="bg-surface-container/60 border border-outline-variant/30 p-3 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-extrabold text-slate-blue flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">swap_horiz</span>
                存放區域 (切換後自動計算保鮮天數)
              </label>
              <span className="text-[10px] font-extrabold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI連動
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChamberChange('cold')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                  chamber === 'cold'
                    ? 'bg-slate-blue text-white border-slate-blue shadow-md ring-2 ring-slate-blue/20'
                    : 'bg-white text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">ac_unit</span>
                冷藏室 ({aiRecCold.daysLeft}天)
              </button>
              <button
                type="button"
                onClick={() => handleChamberChange('frozen')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                  chamber === 'frozen'
                    ? 'bg-[#4c7396] text-white border-[#4c7396] shadow-md ring-2 ring-[#4c7396]/20'
                    : 'bg-white text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">severe_cold</span>
                冷凍庫 ({aiRecFrozen.daysLeft}天)
              </button>
            </div>
          </div>

          {/* Qty & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-blue mb-1">
                數量
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm px-3 py-2 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-blue mb-1">
                單位
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm px-3 py-2 font-bold"
              />
            </div>
          </div>



          {/* Actions */}
          <div className="pt-3 border-t border-outline-variant/30 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-95"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              儲存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFridgeItemModal;
