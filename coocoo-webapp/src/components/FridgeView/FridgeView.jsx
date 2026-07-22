import React, { useState } from 'react';
import CapacityCard from './CapacityCard';
import UrgentBanner from './UrgentBanner';
import FridgeItem from './FridgeItem';
import EditFridgeItemModal from './EditFridgeItemModal';
import RescueDecisionCenter from './RescueDecisionCenter';

const FridgeView = ({ inventory, setInventory, fridgeProfile }) => {
  const [editingItem, setEditingItem] = useState(null);

  // Computed state
  const urgentItems = inventory.filter(item => item.daysLeft <= 1 && item.chamber === 'cold');
  const coldItems = inventory.filter(item => item.chamber === 'cold').sort((a, b) => a.daysLeft - b.daysLeft);
  const frozenItems = inventory.filter(item => item.chamber === 'frozen').sort((a, b) => a.daysLeft - b.daysLeft);
  const rescueCandidates = inventory.filter(item => item.daysLeft <= 3 && item.chamber === 'cold');

  // Handlers
  const handleSaveItem = (updatedItem) => {
    setInventory(inventory.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
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
              <p className="text-xs text-outline mt-1">前往補貨區採買，確認後自動移入冷藏庫存！</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
              {coldItems.map(item => (
                <FridgeItem key={item.id} item={item} onEdit={(selected) => setEditingItem(selected)} />
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
                <FridgeItem key={item.id} item={item} onEdit={(selected) => setEditingItem(selected)} />
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

      {/* Edit Fridge Item Modal */}
      {editingItem && (
        <EditFridgeItemModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default FridgeView;
