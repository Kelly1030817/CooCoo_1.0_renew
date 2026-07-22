import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const AddShoppingForm = ({ onAdd, onCancel }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('produce');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('包');
  const [cost, setCost] = useState(50);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      showToast("請輸入食材名稱！", "warning");
      return;
    }
    const generateIngredientImage = (itemName) => {
      const clean = (itemName || '').trim();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e2f0d9"/><stop offset="100%" stop-color="#ffffff"/></linearGradient></defs><rect width="150" height="150" fill="url(#g)" rx="20"/><circle cx="75" cy="65" r="42" fill="#386753" fill-opacity="0.12"/><text x="75" y="78" font-size="44" text-anchor="middle" dominant-baseline="central">🥗</text><rect x="15" y="112" width="120" height="24" rx="12" fill="#386753"/><text x="75" y="128" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${clean.slice(0, 8)}</text></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const newItem = {
      id: `shop-new-${Date.now()}`,
      name,
      category,
      qty: Number(qty),
      unit,
      estCost: Number(cost),
      image: generateIngredientImage(name),
      checked: false
    };
    onAdd(newItem);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-md shadow-sm space-y-sm mb-lg">
      <h3 className="text-base font-extrabold text-slate-blue">新增待採買食材</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-sm">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">食材名稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：空心菜"
            className="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">分類</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white"
          >
            <option value="produce">新鮮蔬果</option>
            <option value="protein">蛋白質與乳製品</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">數量</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="1"
            className="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">單位</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">預估金額 (TWD)</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            min="0"
            className="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white"
          />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-sm">
        <button
          type="button"
          onClick={onCancel}
          className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high px-md py-1.5 rounded-full text-xs font-bold transition-all"
        >
          取消
        </button>
        <button
          type="submit"
          className="bg-[#386753] text-white hover:brightness-110 px-md py-1.5 rounded-full text-xs font-bold transition-all"
        >
          確認加入
        </button>
      </div>
    </form>
  );
};

export default AddShoppingForm;
