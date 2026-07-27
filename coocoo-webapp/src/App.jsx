import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FridgeView from './components/FridgeView/FridgeView';
import ShoppingView from './components/ShoppingView/ShoppingView';
import KitchenView from './components/KitchenView/KitchenView';
import RoiView from './components/RoiView/RoiView';
import AiAssistantOnboarding from './components/AiAssistantOnboarding';
import SettlementModal from './components/SettlementModal';
import AddFridgeForm from './components/FridgeView/AddFridgeForm';
import ToastContainer from './components/Common/ToastContainer';
import DevToolsFab from './components/Common/DevToolsFab';
import { ToastProvider } from './context/ToastContext';
import { defaultInventory, defaultFridgeProfile, defaultShoppingList, defaultDreams, defaultSavingsGoal } from './data/mockData';

function AppContent() {
  const [activeTab, setActiveTab] = useState('shopping');
  
  // Persistence for Inventory
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('coocoo_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved inventory", e);
      }
    }
    return defaultInventory;
  });

  const [fridgeProfile, setFridgeProfile] = useState(defaultFridgeProfile);
  const [shoppingList, setShoppingList] = useState(defaultShoppingList);
  
  // Default showOnboarding to true on every reload as requested
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeQuest, setActiveQuest] = useState(null);
  const [preselectedItemIds, setPreselectedItemIds] = useState([]);
  const [settlementData, setSettlementData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('coocoo_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const handleAcceptQuest = (quest) => {
    setActiveQuest(quest);
    if (quest.targetIngredientIds) {
      setPreselectedItemIds(quest.targetIngredientIds);
    }
    setActiveTab('kitchen');
    setShowOnboarding(false);
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleFinishCooking = ({ recipe, selectedItemIds = [] }) => {
    const consumedItems = inventory.filter(item => selectedItemIds.includes(item.id));
    const consumedNames = consumedItems.map(item => item.name);

    if (selectedItemIds.length > 0) {
      setInventory(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
    }

    if (window.SingleGoalApp?.promptMealCompletion) {
      window.SingleGoalApp.promptMealCompletion({
        mealName: recipe?.title || (consumedNames.length ? `${consumedNames.join('炒')}創意外食` : '小廚房自煮美味'),
        homeCookCost: 45
      });
    }

    setSettlementData({
      questTitle: activeQuest ? activeQuest.title : null,
      exp: activeQuest ? activeQuest.exp : 30,
      savings: 120,
      consumedNames,
    });

    setActiveQuest(null);
    setPreselectedItemIds([]);
  };

  // Placeholder components for the 4 tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'fridge':
        return (
          <FridgeView
            inventory={inventory}
            setInventory={setInventory}
            fridgeProfile={fridgeProfile}
            onOpenAddModal={() => setShowAddModal(true)}
            onAcceptQuest={handleAcceptQuest}
          />
        );
      case 'shopping':
        return (
          <ShoppingView 
            shoppingList={shoppingList}
            setShoppingList={setShoppingList}
            inventory={inventory}
            setInventory={setInventory}
          />
        );
      case 'kitchen':
        return (
          <KitchenView
            inventory={inventory}
            preselectedIds={preselectedItemIds}
            activeQuest={activeQuest}
            onFinishCooking={handleFinishCooking}
          />
        );
      case 'roi':
        return <RoiView dreams={defaultDreams} savingsGoal={defaultSavingsGoal} />;
      default:
        return (
          <FridgeView
            inventory={inventory}
            setInventory={setInventory}
            fridgeProfile={fridgeProfile}
            onOpenAddModal={() => setShowAddModal(true)}
            onAcceptQuest={handleAcceptQuest}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-on-surface">
      <ToastContainer />
      <DevToolsFab 
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenSettlement={(data) => setSettlementData(data)}
      />
      {/* Onboarding Modal */}
      {showOnboarding && (
        <AiAssistantOnboarding
          inventory={inventory}
          onAcceptQuest={handleAcceptQuest}
          onAddShoppingItems={(items) => {
            const formatted = items.map((item, idx) => ({
              id: `s_chef_${Date.now()}_${idx}`,
              name: item.name,
              category: item.category || 'produce',
              qty: item.qty || 1,
              unit: item.unit || '包',
              checked: false,
              status: '主廚推薦補貨',
              estCost: item.estCost || 80
            }));
            setShoppingList(prev => [...formatted, ...prev]);
          }}
          onGoShopping={() => {
            setActiveTab('shopping');
            setShowOnboarding(false);
          }}
          onSkip={handleSkipOnboarding}
        />
      )}

      {/* Settlement Rewards Modal */}
      {settlementData && (
        <SettlementModal
          data={settlementData}
          onClose={() => setSettlementData(null)}
        />
      )}

      {/* Global Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <AddFridgeForm
              onAdd={(newItem) => {
                setInventory(prev => [newItem, ...prev]);
                setShowAddModal(false);
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenChefConsultation={() => setShowOnboarding(true)}
      />
      
      <main className="flex-1 p-lg overflow-y-auto">
        {/* Active Quest HUD Banner */}
        {activeQuest && (
          <div className="mb-md flex items-center justify-between bg-amber-50 border-2 border-primary/30 rounded-2xl p-md shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">stars</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-blue text-sm">🎯 進行中任務：{activeQuest.title}</span>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">EXP +{activeQuest.exp}</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">{activeQuest.description}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveQuest(null)}
              className="text-xs font-bold text-outline hover:text-terracotta transition-colors px-2 py-1"
            >
              放棄任務
            </button>
          </div>
        )}


        
        {/* Main Content Area */}
        <div className="h-[calc(100%-80px)]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
