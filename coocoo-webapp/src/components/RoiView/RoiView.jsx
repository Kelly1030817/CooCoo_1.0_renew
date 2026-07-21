import React, { useState } from 'react';
import DreamCarousel from './DreamCarousel';
import DreamTree from './DreamTree';
import AssetsSummary from './AssetsSummary';
import ActionReminders from './ActionReminders';

const RoiView = ({ dreams, savingsGoal }) => {
  const [activeDreamId, setActiveDreamId] = useState(dreams[0]?.id);

  const activeDream = dreams.find(d => d.id === activeDreamId);

  const handleNewDream = () => {
    alert('【新增夢想分支】\n未來可在此設定新的圓夢目標與金額。');
  };

  const handleEditDream = () => {
    alert('【編輯夢想】\n未來可在此修改夢想名稱或金額。');
  };

  return (
    <div className="space-y-lg pb-32 max-w-5xl mx-auto">
      {/* Header Section */}
      <section className="flex flex-col gap-xs mb-md">
        <h2 className="font-headline-lg text-3xl font-extrabold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-4xl">park</span>
          夢想樹
        </h2>
        <p className="text-on-surface-variant text-sm">每一次健康的自煮選擇，都在灌溉你的夢想分支。</p>
      </section>

      {/* Dream Carousel */}
      <DreamCarousel 
        dreams={dreams} 
        activeDreamId={activeDreamId}
        onSwitchDream={setActiveDreamId}
        onNewDream={handleNewDream}
      />

      {/* Active Dream Tree Card */}
      <DreamTree 
        activeDream={activeDream} 
        onEditDream={handleEditDream}
      />

      {/* Assets Summary (Wealth & Health) */}
      <AssetsSummary 
        goal={savingsGoal} 
        activeDreamName={activeDream?.name} 
      />

      {/* Delivery Blocker & Friday Plan B */}
      <ActionReminders 
        activeDreamName={activeDream?.name} 
      />
    </div>
  );
};

export default RoiView;
