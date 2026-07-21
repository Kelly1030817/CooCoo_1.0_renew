import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FridgeView from './components/FridgeView/FridgeView';
import ShoppingView from './components/ShoppingView/ShoppingView';
import KitchenView from './components/KitchenView/KitchenView';
import RoiView from './components/RoiView/RoiView';
import { defaultInventory, defaultFridgeProfile, defaultShoppingList, defaultDreams, defaultSavingsGoal } from './data/mockData';

function App() {
  const [activeTab, setActiveTab] = useState('fridge');
  const [inventory, setInventory] = useState(defaultInventory);
  const [fridgeProfile, setFridgeProfile] = useState(defaultFridgeProfile);
  const [shoppingList, setShoppingList] = useState(defaultShoppingList);

  // Placeholder components for the 4 tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'fridge':
        return (
          <FridgeView
            inventory={inventory}
            setInventory={setInventory}
            fridgeProfile={fridgeProfile}
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
        return <KitchenView inventory={inventory} />;
      case 'roi':
        return <RoiView dreams={defaultDreams} savingsGoal={defaultSavingsGoal} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-on-surface">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-lg overflow-y-auto">
        <header className="mb-lg flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-blue">
              {activeTab === 'fridge' && '冰箱庫存'}
              {activeTab === 'shopping' && '每週採買'}
              {activeTab === 'kitchen' && '開始下廚'}
              {activeTab === 'roi' && '圓夢進度'}
            </h2>
            <p className="text-on-surface-variant text-sm mt-xs">
              Welcome back to your modern hearth.
            </p>
          </div>
          <button className="bg-white border-2 border-outline-variant px-md py-sm rounded-xl font-bold text-terracotta hover:border-terracotta transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg align-bottom mr-xs">add</span>
            新增食材
          </button>
        </header>
        
        {/* Main Content Area */}
        <div className="h-[calc(100%-80px)]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
