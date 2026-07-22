import React, { useState } from 'react';
import DreamCarousel from './DreamCarousel';
import DreamTree from './DreamTree';
import AssetsSummary from './AssetsSummary';
import ActionReminders from './ActionReminders';
import { useToast } from '../../context/ToastContext';

const RoiView = ({ dreams, savingsGoal }) => {
  const { showToast } = useToast();
  const [dreamList, setDreamList] = useState(dreams);
  const [activeDreamId, setActiveDreamId] = useState(dreams[0]?.id);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  const [dreamNameInput, setDreamNameInput] = useState('');
  const [dreamTargetInput, setDreamTargetInput] = useState('15000');

  const activeDream = dreamList.find(d => d.id === activeDreamId) || dreamList[0];

  const handleOpenAddDream = () => {
    setModalMode('add');
    setDreamNameInput('');
    setDreamTargetInput('15000');
    setShowDreamModal(true);
  };

  const handleOpenEditDream = () => {
    setModalMode('edit');
    setDreamNameInput(activeDream?.name || '');
    setDreamTargetInput(activeDream?.targetAmount || '15000');
    setShowDreamModal(true);
  };

  const handleSaveDream = (e) => {
    e.preventDefault();
    if (!dreamNameInput.trim()) {
      showToast('請輸入夢想名稱！', 'warning');
      return;
    }

    if (modalMode === 'add') {
      const newDream = {
        id: `dream-${Date.now()}`,
        name: dreamNameInput.trim(),
        icon: 'flight_takeoff',
        targetAmount: Number(dreamTargetInput),
        currentAmount: 0,
        unlocked: false
      };
      setDreamList(prev => [...prev, newDream]);
      setActiveDreamId(newDream.id);
      showToast(`🌳 成功新增夢想分支「${newDream.name}」！`, 'success');
    } else {
      setDreamList(prev => prev.map(d => d.id === activeDreamId ? {
        ...d,
        name: dreamNameInput.trim(),
        targetAmount: Number(dreamTargetInput)
      } : d));
      showToast(`✨ 已成功更新夢想「${dreamNameInput.trim()}」設定！`, 'success');
    }

    setShowDreamModal(false);
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
        dreams={dreamList} 
        activeDreamId={activeDreamId}
        onSwitchDream={setActiveDreamId}
        onNewDream={handleOpenAddDream}
      />

      {/* Active Dream Tree Card */}
      <DreamTree 
        activeDream={activeDream} 
        onEditDream={handleOpenEditDream}
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

      {/* Dream Modal */}
      {showDreamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdfae7] border border-[#be5f48]/30 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="text-lg font-extrabold text-[#2c221e]">
                {modalMode === 'add' ? '新增夢想分支 🌳' : '編輯夢想設定 ✏️'}
              </h3>
              <button onClick={() => setShowDreamModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveDream} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">夢想名稱</label>
                <input
                  type="text"
                  placeholder="例如：日本雙人自由行 / 高級廚具組"
                  value={dreamNameInput}
                  onChange={(e) => setDreamNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white font-medium focus:outline-none focus:border-[#be5f48]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">目標積攢金額 (NTD)</label>
                <input
                  type="number"
                  placeholder="15000"
                  value={dreamTargetInput}
                  onChange={(e) => setDreamTargetInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white font-medium focus:outline-none focus:border-[#be5f48]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#be5f48] hover:bg-[#9a442d] text-white font-extrabold py-3 rounded-full shadow-md transition-all active:scale-95 text-sm"
              >
                {modalMode === 'add' ? '建立夢想樹' : '儲存變更'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoiView;
