import React, { useState } from 'react';

const AddFridgeForm = ({ onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [chamber, setChamber] = useState('cold');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('顆');
  const [days, setDays] = useState(5);
  const [boxSize, setBoxSize] = useState('M');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert("請輸入食材名稱！");
      return;
    }
    const newItem = {
      id: `item-${Date.now()}`,
      name,
      chamber,
      qty: Number(qty),
      unit,
      daysLeft: Number(days),
      boxSize,
      addedDate: new Date().toISOString().split('T')[0],
      roi: { savings: 50, sodium: 0, fat: 0 },
    };
    onAdd(newItem);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-outline-variant/30 rounded-2xl p-lg shadow-sm space-y-md mb-lg">
      <h3 className="text-lg font-bold text-slate-blue">新增冰箱食材</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-md">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">食材名稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：番茄"
            className="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">存放區</label>
          <select
            value={chamber}
            onChange={(e) => setChamber(e.target.value)}
            className="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm"
          >
            <option value="cold">冷藏室</option>
            <option value="frozen">冷凍庫</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">數量與單位</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
              className="w-2/3 rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-1/3 rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">保鮮天數</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            min="0"
            className="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">收納規格</label>
          <select
            value={boxSize}
            onChange={(e) => setBoxSize(e.target.value)}
            className="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm"
          >
            <option value="S">方形收納盒 (S)</option>
            <option value="M">方形收納盒 (M)</option>
            <option value="L">方形收納盒 (L)</option>
            <option value="無">無收納盒</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-md">
        <button
          type="button"
          onClick={onCancel}
          className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high px-lg py-sm rounded-full text-xs font-bold transition-all"
        >
          取消
        </button>
        <button
          type="submit"
          className="bg-secondary text-white hover:brightness-110 px-lg py-sm rounded-full text-xs font-bold transition-all"
        >
          確認儲存
        </button>
      </div>
    </form>
  );
};

export default AddFridgeForm;
