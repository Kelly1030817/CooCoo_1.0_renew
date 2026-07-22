import React, { useState } from 'react';
import AddShoppingForm from './AddShoppingForm';
import LeanHealthGuide from './LeanHealthGuide';
import ShoppingChecklist from './ShoppingChecklist';
import SideCards from './SideCards';
import AiShoppingAssistantModal from './AiShoppingAssistantModal';
import InvoiceScannerModal from './InvoiceScannerModal';
import VoiceInputModal from './VoiceInputModal';
import { useToast } from '../../context/ToastContext';

const ShoppingView = ({ shoppingList, setShoppingList, inventory, setInventory }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const { showToast } = useToast();

  // Handlers
  const handleAddItem = (newItem) => {
    setShoppingList(prev => [...prev, newItem]);
    setShowAddForm(false);
    showToast(`成功新增食材「${newItem.name}」！`, 'success');
  };

  const handleToggleCheck = (id) => {
    setShoppingList(shoppingList.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleToggleAll = () => {
    const allChecked = shoppingList.every(item => item.checked);
    setShoppingList(shoppingList.map(item => ({ ...item, checked: !allChecked })));
  };

  const handleDeleteItem = (id) => {
    setShoppingList(shoppingList.filter(item => item.id !== id));
    showToast('已從採購單移除食材', 'info');
  };

  const handleConfirmRestock = () => {
    const checkedItems = shoppingList.filter(item => item.checked);
    if (checkedItems.length === 0) {
      showToast('請先勾選已購買的食材！', 'warning');
      return;
    }

    // Convert checked shopping items to inventory items
    const newInventoryItems = checkedItems.map(item => ({
      id: `fridge-new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: item.name,
      chamber: item.category === 'produce' ? 'cold' : 'frozen', // simple heuristic
      qty: item.qty || 1,
      unit: item.unit || '份',
      daysLeft: item.category === 'produce' ? 5 : 14,
      boxSize: 'M',
      addedDate: new Date().toISOString().split('T')[0],
      roi: { savings: item.estCost || 50, sodium: 0, fat: 0 }
    }));

    setInventory([...inventory, ...newInventoryItems]);
    setShoppingList(shoppingList.filter(item => !item.checked));
    showToast(`🎉 成功補貨 ${checkedItems.length} 項食材至冰箱！`, 'success', 4000);
  };

  // Add items from modals
  const handleAddMultipleItems = (items) => {
    const formatted = items.map(i => ({
      id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: i.name,
      category: i.category || 'produce',
      qty: i.qty || 1,
      unit: i.unit || '份',
      estCost: i.estCost || 40,
      checked: true
    }));
    setShoppingList(prev => [...prev, ...formatted]);
    showToast(`已匯入 ${items.length} 項食材至採購單！`, 'success');
  };

  // Calculate unique names for Lean Health Guide
  const fridgeProduceNames = inventory.filter(i => i.name && !i.name.includes('肉') && !i.name.includes('蛋') && !i.name.includes('魚') && !i.name.includes('蝦') && !i.name.includes('奶') && !i.name.includes('豆腐')).map(i => i.name);
  const fridgeProteinNames = inventory.filter(i => i.name && (i.name.includes('肉') || i.name.includes('蛋') || i.name.includes('魚') || i.name.includes('蝦') || i.name.includes('奶') || i.name.includes('豆腐'))).map(i => i.name);
  
  const shopProduceNames = shoppingList.filter(i => i.category === 'produce').map(i => {
    let name = i.name;
    const match = i.name.match(/(.*?)\s*[\(（]/);
    if (match) name = match[1].trim();
    return name;
  });
  const shopProteinNames = shoppingList.filter(i => i.category === 'protein').map(i => {
    let name = i.name;
    const match = i.name.match(/(.*?)\s*[\(（]/);
    if (match) name = match[1].trim();
    return name;
  });

  const uniqueVegCount = new Set([...fridgeProduceNames, ...shopProduceNames]).size;
  const uniqueProtCount = new Set([...fridgeProteinNames, ...shopProteinNames]).size;

  return (
    <div className="space-y-lg max-w-5xl mx-auto pb-24">
      {/* Header Section */}
      <section className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-md">
        <div className="flex items-center gap-2">
          {/* AI Assistant Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="bg-secondary text-white hover:brightness-110 border border-secondary font-extrabold px-3 py-2 rounded-full text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1"
            title="AI 逛市場助手"
          >
            <span className="material-symbols-outlined text-[18px]">forum</span> AI 陪我逛
          </button>
          {/* Scan & Voice Buttons */}
          <button
            onClick={() => setShowScanModal(true)}
            className="w-9 h-9 bg-[#be5f48]/10 hover:bg-[#be5f48]/20 border border-[#be5f48]/30 text-[#be5f48] rounded-full shadow-sm transition-all active:scale-95 flex items-center justify-center"
            title="掃描發票/收據"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">qr_code_scanner</span>
          </button>
          <button
            onClick={() => setShowVoiceModal(true)}
            className="w-9 h-9 bg-[#be5f48]/10 hover:bg-[#be5f48]/20 border border-[#be5f48]/30 text-[#be5f48] rounded-full shadow-sm transition-all active:scale-95 flex items-center justify-center"
            title="AI語音輸入"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">mic</span>
          </button>
          {/* Manual Add Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#be5f48]/10 hover:bg-[#be5f48]/20 border border-[#be5f48]/30 text-[#be5f48] font-bold px-lg py-sm rounded-full text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-lg">{showAddForm ? 'close' : 'add'}</span> 
            {showAddForm ? '取消新增' : '手動新增'}
          </button>
        </div>
      </section>

      {/* Add Form */}
      {showAddForm && (
        <AddShoppingForm onAdd={handleAddItem} onCancel={() => setShowAddForm(false)} />
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-lg">
          <ShoppingChecklist
            shoppingList={shoppingList}
            inventory={inventory}
            onToggleCheck={handleToggleCheck}
            onToggleAll={handleToggleAll}
            onDeleteShoppingItem={handleDeleteItem}
            onConfirmRestock={handleConfirmRestock}
          />
          <LeanHealthGuide
            vegCount={uniqueVegCount}
            protCount={uniqueProtCount}
          />
        </div>

        {/* Right Column */}
        <SideCards />
      </div>

      {/* Modals */}
      <AiShoppingAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onAddShoppingItem={(item) => handleAddMultipleItems([item])}
      />
      <InvoiceScannerModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onScanComplete={handleAddMultipleItems}
      />
      <VoiceInputModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onVoiceResult={handleAddMultipleItems}
      />
    </div>
  );
};

export default ShoppingView;
