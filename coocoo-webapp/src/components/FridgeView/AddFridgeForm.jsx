import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const FOOD_KNOWLEDGE_BASE = [
  { name: '高麗菜', chamber: 'cold', days: 7, unit: '顆', boxSize: 'L', tip: '建議用保鮮膜或紙巾包覆，放冷藏室蔬菜區' },
  { name: '番茄', chamber: 'cold', days: 5, unit: '顆', boxSize: 'M', tip: '熟透後放冷藏室，蒂頭朝下放置' },
  { name: '酪梨', chamber: 'cold', days: 3, unit: '顆', boxSize: 'S', tip: '熟成後放入冷藏，切開後表面可塗檸檬汁防變色' },
  { name: '胡蘿蔔', chamber: 'cold', days: 14, unit: '根', boxSize: 'M', tip: '直立存放，保持乾燥可延長保鮮期' },
  { name: '牛肉片', chamber: 'cold', days: 3, unit: '盒', boxSize: 'M', tip: '冷藏保存 3 天，若未及時食用建議壓扁密封冷凍' },
  { name: '梅花豬肉片', chamber: 'frozen', days: 21, unit: '盒', boxSize: 'S', tip: '分裝抽氣冷凍可保存 3 個月' },
  { name: '雞胸肉', chamber: 'cold', days: 2, unit: '盒', boxSize: 'M', tip: '水分多易滋生細菌，建議 2 天內烹調完畢' },
  { name: '鮭魚菲力', chamber: 'frozen', days: 14, unit: '片', boxSize: 'S', tip: '冷凍保存可鎖住 Omega-3 油脂' },
  { name: '鮮牛奶', chamber: 'cold', days: 7, unit: '瓶', boxSize: 'M', tip: '放冷藏中層，避免置於門邊搖晃受熱' },
  { name: '雞蛋', chamber: 'cold', days: 21, unit: '顆', boxSize: 'M', tip: '鈍端朝上冷藏保存，請勿洗滌外殼' },
  { name: '有機豆腐', chamber: 'cold', days: 4, unit: '盒', boxSize: 'S', tip: '浸泡於乾淨冷水中，每天換水可保鮮' },
  { name: '草莓', chamber: 'cold', days: 2, unit: '盒', boxSize: 'S', tip: '非常脆弱，要吃前才清洗避免潮濕發黴' },
];

const AddFridgeForm = ({ onAdd, onCancel }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [chamber, setChamber] = useState('cold');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('顆');
  const [days, setDays] = useState(5);
  const [boxSize, setBoxSize] = useState('M');
  const [aiTip, setAiTip] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Auto-match knowledge base when typing name
  const handleNameChange = (inputName) => {
    setName(inputName);
    const match = FOOD_KNOWLEDGE_BASE.find(item => 
      inputName.includes(item.name) || item.name.includes(inputName)
    );

    if (match && inputName.trim() !== '') {
      setChamber(match.chamber);
      setDays(match.days);
      setUnit(match.unit);
      setBoxSize(match.boxSize);
      setAiTip(match.tip);
      setIsAutoFilled(true);
    } else {
      setAiTip('');
      setIsAutoFilled(false);
    }
  };

  const handleSelectQuickChip = (item) => {
    setName(item.name);
    setChamber(item.chamber);
    setDays(item.days);
    setUnit(item.unit);
    setBoxSize(item.boxSize);
    setAiTip(item.tip);
    setIsAutoFilled(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("請輸入食材名稱！", "warning");
      return;
    }
    const generateIngredientImage = (itemName) => {
      const clean = (itemName || '').trim();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e2f0d9"/><stop offset="100%" stop-color="#ffffff"/></linearGradient></defs><rect width="150" height="150" fill="url(#g)" rx="20"/><circle cx="75" cy="65" r="42" fill="#386753" fill-opacity="0.12"/><text x="75" y="78" font-size="44" text-anchor="middle" dominant-baseline="central">🥗</text><rect x="15" y="112" width="120" height="24" rx="12" fill="#386753"/><text x="75" y="128" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${clean.slice(0, 8)}</text></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const newItem = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      chamber,
      qty: Number(qty),
      unit,
      daysLeft: Number(days),
      boxSize,
      image: generateIngredientImage(name.trim()),
      addedDate: new Date().toISOString().split('T')[0],
      roi: { savings: 50, sodium: 0, fat: 0 },
    };
    onAdd(newItem);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-outline-variant/30 rounded-3xl p-lg shadow-sm space-y-md">
      <div className="flex justify-between items-center border-b border-gray-100 pb-sm">
        <div>
          <h3 className="text-lg font-extrabold text-slate-blue">新增冰箱食材</h3>
          <p className="text-xs text-gray-500">輸入名稱，CooCoo 科學庫將自動預測最佳保存方式！</p>
        </div>
        {isAutoFilled && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">science</span> CooCoo 科學配對成功
          </span>
        )}
      </div>

      {/* Quick Select Chips */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">⚡ 常用食材快捷點選：</label>
        <div className="flex flex-wrap gap-1.5">
          {FOOD_KNOWLEDGE_BASE.slice(0, 8).map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => handleSelectQuickChip(item)}
              className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all border ${
                name === item.name
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-primary/10 hover:border-primary/40'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md pt-xs">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">食材名稱 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="例如：高麗菜、牛肉片"
            className="w-full rounded-xl border-outline-variant focus:border-primary focus:ring-primary text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">
            存放區 <span className="text-[10px] text-emerald-600 font-normal">(CooCoo 建議)</span>
          </label>
          <select
            value={chamber}
            onChange={(e) => setChamber(e.target.value)}
            className="w-full rounded-xl border-outline-variant focus:border-primary focus:ring-primary text-sm font-bold bg-emerald-50/30"
          >
            <option value="cold">❄️ 冷藏室 (4°C)</option>
            <option value="frozen">🧊 冷凍庫 (-18°C)</option>
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
              className="w-1/2 rounded-xl border-outline-variant focus:border-primary focus:ring-primary text-sm font-bold"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-1/2 rounded-xl border-outline-variant focus:border-primary focus:ring-primary text-sm font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1">
            最佳保鮮天數 <span className="text-[10px] text-emerald-600 font-normal">(CooCoo 建議)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="0"
              className="w-full rounded-xl border-outline-variant focus:border-primary focus:ring-primary text-sm font-bold bg-emerald-50/30 pr-8"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-bold">天</span>
          </div>
        </div>
      </div>

      {/* Science Tip Banner */}
      {aiTip && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-xl text-xs text-emerald-900 flex items-start gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">tips_and_updates</span>
          <div>
            <span className="font-extrabold">CooCoo 科學保存妙招：</span>
            <span>{aiTip}</span>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-sm pt-sm border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high px-lg py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          取消
        </button>
        <button
          type="submit"
          className="bg-primary hover:brightness-110 text-white px-xl py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">save</span> 確認存入冰箱
        </button>
      </div>
    </form>
  );
};

export default AddFridgeForm;
