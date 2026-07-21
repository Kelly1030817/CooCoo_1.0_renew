import React, { useState } from 'react';
import CapacityCard from './CapacityCard';
import UrgentBanner from './UrgentBanner';
import AddFridgeForm from './AddFridgeForm';
import FridgeItem from './FridgeItem';
import RescueDecisionCenter from './RescueDecisionCenter';

const FridgeView = ({ inventory, setInventory, fridgeProfile }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Computed state
  const urgentItems = inventory.filter(item => item.daysLeft <= 1 && item.chamber === 'cold');
  const coldItems = inventory.filter(item => item.chamber === 'cold').sort((a, b) => a.daysLeft - b.daysLeft);
  const frozenItems = inventory.filter(item => item.chamber === 'frozen').sort((a, b) => a.daysLeft - b.daysLeft);
  const rescueCandidates = inventory.filter(item => item.daysLeft <= 3 && item.chamber === 'cold');

  // Handlers
  const handleAddItem = (newItem) => {
    setInventory([...inventory, newItem]);
    setShowAddForm(false);
  };

  const handleDiscardItem = (id) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  const handleRescueAction = (id, action) => {
    if (action === 'preserve') {
      setInventory(inventory.map(item => {
        if (item.id === id) {
          return { ...item, chamber: 'frozen', daysLeft: 30 };
        }
        return item;
      }));
    } else if (action === 'eat') {
      setInventory(inventory.map(item => {
        if (item.id === id) {
          return { ...item, qty: Math.max(0, item.qty - 1) };
        }
        return item;
      }).filter(item => item.qty > 0));
    }
  };

  return (
    <div className="space-y-lg max-w-5xl mx-auto pb-24">
      <CapacityCard profile={fridgeProfile} inventoryLength={inventory.length} />

      {/* Header & Action Section */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="text-3xl font-extrabold text-primary">冰箱沙漏</h2>
          <p className="text-on-surface-variant text-sm mt-1">隨時掌控保鮮期限，消滅食物浪費支出。</p>
        </div>
        <div className="flex gap-sm w-full sm:w-auto">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary hover:brightness-110 text-white font-bold px-4 py-2 rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-lg">{showAddForm ? 'close' : 'add'}</span>
            {showAddForm ? '取消新增' : '新增食材'}
          </button>
        </div>
      </section>

      {/* Add Form */}
      {showAddForm && (
        <AddFridgeForm onAdd={handleAddItem} onCancel={() => setShowAddForm(false)} />
      )}

      {/* Urgent Banner */}
      <UrgentBanner urgentItems={urgentItems} />

      {/* Refrigerator Grid: Dual Chamber Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Cold Chamber */}
        <div className="border-4 border-slate-blue rounded-3xl p-md bg-white shadow-xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-md pb-2 border-b border-surface-container-high">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-slate-blue font-bold">ac_unit</span>
              <h3 className="text-lg font-extrabold text-slate-blue">冷藏室</h3>
            </div>
            <span className="text-slate-blue text-xs font-bold bg-slate-blue/10 px-3 py-1 rounded-full">4°C 穩定</span>
          </div>
          {coldItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-xl">
              <span className="material-symbols-outlined text-outline-variant text-[64px] mb-2">kitchen</span>
              <p className="text-sm font-semibold text-on-surface-variant">冷藏室空空的...</p>
              <p className="text-xs text-outline mt-1">點擊上方按鈕手動新增，或在補貨區確認補貨！</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
              {coldItems.map(item => (
                <FridgeItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Frozen Chamber */}
        <div className="border-4 border-slate-blue rounded-3xl p-md bg-white shadow-xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-md pb-2 border-b border-surface-container-high">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-slate-blue font-bold">severe_cold</span>
              <h3 className="text-lg font-extrabold text-slate-blue">冷凍庫</h3>
            </div>
            <span className="text-slate-blue text-xs font-bold bg-slate-blue/10 px-3 py-1 rounded-full">-18°C 穩定</span>
          </div>
          {frozenItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-xl">
              <span className="material-symbols-outlined text-outline-variant text-[64px] mb-2">kitchen</span>
              <p className="text-sm font-semibold text-on-surface-variant">冷凍庫空空的...</p>
              <p className="text-xs text-outline mt-1">冷凍能拉長保存期限，特別適合壓扁分裝的肉類！</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
              {frozenItems.map(item => (
                <FridgeItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rescue Decision Center */}
      <RescueDecisionCenter
        candidates={rescueCandidates}
        onDiscard={handleDiscardItem}
        onRescue={handleRescueAction}
      />
    </div>
  );
};

export default FridgeView;
