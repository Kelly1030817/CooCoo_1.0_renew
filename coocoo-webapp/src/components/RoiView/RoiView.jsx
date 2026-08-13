import React, { useEffect, useState } from 'react';
import ThreePiggyBank from './ThreePiggyBank';

const RoiView = () => {
  const [goalState, setGoalState] = useState({
    title: '去日本看櫻花 🍁',
    purpose: 'travel',
    targetAmount: 30000,
    currentAmount: 1200,
    eatingOutMeals: 7,
    eatingOutTotal: 1400,
    homeCookBudget: 80,
    weeklyCookingMeals: 4,
    targetDate: '',
    history: [
      { reason: '自煮特製牛肉煲外送差額', amount: 120, timestamp: new Date().toISOString() }
    ]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formState, setFormState] = useState({ ...goalState });

  useEffect(() => {
    loadSingleGoalState();
  }, []);

  const loadSingleGoalState = () => {
    try {
      const raw = localStorage.getItem('coocoo.single-goal.v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.activeGoal) {
          const loaded = {
            title: parsed.activeGoal.name || '去日本看櫻花 🍁',
            purpose: parsed.activeGoal.purpose || 'travel',
            targetAmount: parsed.activeGoal.targetAmount || 30000,
            currentAmount: parsed.activeGoal.currentSavedAmount || 1200,
            eatingOutMeals: parsed.cookingPlan?.eatingOutMeals || 7,
            eatingOutTotal: parsed.cookingPlan?.eatingOutTotal || 1400,
            homeCookBudget: parsed.cookingPlan?.homeCookBudget || 80,
            weeklyCookingMeals: parsed.cookingPlan?.weeklyCookingMeals || 4,
            targetDate: parsed.activeGoal.targetDate || '',
            history: parsed.amountEvents || [
              { reason: '自煮特製牛肉煲外送差額', amount: 120, timestamp: new Date().toISOString() }
            ]
          };
          setGoalState(loaded);
          setFormState(loaded);
        }
      }
    } catch (e) {
      console.warn("Unable to load single goal state:", e);
    }
  };

  const handleOpenEditModal = () => {
    setFormState({ ...goalState });
    setActiveStep(1);
    setIsEditing(true);
  };

  const handleSaveFullGoal = () => {
    const title = formState.title.trim() || '我的圓夢願望';
    const targetAmount = Math.max(1000, Number(formState.targetAmount) || 30000);
    const currentAmount = Math.max(0, Number(formState.currentAmount) || 0);

    const updated = {
      ...formState,
      title,
      targetAmount,
      currentAmount
    };

    if (window.SingleGoalApp?.updateActiveGoal) {
      window.SingleGoalApp.updateActiveGoal({
        title,
        targetAmount,
        purpose: formState.purpose,
        currentSavedAmount: currentAmount,
        homeCookBudget: formState.homeCookBudget,
        weeklyCookingMeals: formState.weeklyCookingMeals
      });
    }

    setGoalState(updated);
    setIsEditing(false);
  };

  const handleDepositComplete = () => {
    // Add $120 home cook receipt deposit
    const addedAmount = 120;
    const newCurrent = goalState.currentAmount + addedAmount;
    const newEvent = {
      reason: '自煮外送差額劃撥發票',
      amount: addedAmount,
      timestamp: new Date().toISOString()
    };

    setGoalState(prev => ({
      ...prev,
      currentAmount: newCurrent,
      history: [newEvent, ...prev.history]
    }));

    if (window.SingleGoalApp?.updateActiveGoal) {
      window.SingleGoalApp.updateActiveGoal({
        title: goalState.title,
        targetAmount: goalState.targetAmount,
        currentSavedAmount: newCurrent
      });
    }
  };

  const safeTarget = Math.max(1000, Number(goalState.targetAmount) || 30000);
  const safeCurrent = Math.max(0, Number(goalState.currentAmount) || 0);
  const progressPct = Math.min(100, Math.max(0, Math.round((safeCurrent / safeTarget) * 100)));

  const remaining = Math.max(0, safeTarget - safeCurrent);
  const weeklyMealSavings = goalState.weeklyCookingMeals * Math.max(50, (goalState.eatingOutTotal / Math.max(1, goalState.eatingOutMeals)) - goalState.homeCookBudget);
  const weeksLeft = Math.max(1, Math.ceil(remaining / Math.max(100, weeklyMealSavings)));
  const takeoutCount = Math.ceil(remaining / 200);

  // Milestones: Short (25%), Medium (60%), Long (100%)
  const milestones = [
    {
      id: 'short',
      title: '短期累積 ‧ 第一筆動能',
      target: Math.round(safeTarget * 0.25),
      label: '存下第一筆外送差額',
      icon: 'flag',
      pct: 25
    },
    {
      id: 'medium',
      title: '中期里程 ‧ 穩定推進',
      target: Math.round(safeTarget * 0.60),
      label: '過半哩程 ‧ 習慣建立',
      icon: 'workspace_premium',
      pct: 60
    },
    {
      id: 'long',
      title: `最終願望 ‧ ${goalState.title}`,
      target: safeTarget,
      label: `完美解鎖 ${goalState.title}`,
      icon: 'flight_takeoff',
      pct: 100
    }
  ];

  return (
    <div className="space-y-6 pb-32 max-w-5xl mx-auto px-4 text-left">
      {/* 👑 1. 3D 莫蘭迪磨砂玻璃豬存錢筒 (Three.js Piggy Bank Hero) */}
      <section className="bg-[#fdfae7] rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-md space-y-6 animate-fade-in relative overflow-hidden">
        {/* Header Badge & Edit Button */}
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#e07a5f] text-2xl">pets</span>
            <div>
              <h2 className="text-lg font-extrabold text-[#3d405b]">莫蘭迪磨砂玻璃豬存錢筒 🐖</h2>
              <p className="text-[11px] text-stone-500">Three.js 3D 體驗 ‧ 發票投遞 ➔ 熔化金芒粒子 ➔ 金光水上升</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditModal}
              className="bg-white hover:bg-amber-100/80 border border-amber-300/80 text-[#3d405b] text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-[#e07a5f]">edit_note</span>
              <span>編輯詳細目標 (六步精算)</span>
            </button>
            <div className="bg-[#81b29a]/20 border border-[#81b29a]/40 text-[#386753] text-xs font-black px-3.5 py-1.5 rounded-full shadow-2xs">
              已累積 NT$ {safeCurrent.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 3D Piggy Bank & Savings Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Three.js 3D Piggy Component */}
          <div className="lg:col-span-5 bg-white/60 rounded-3xl p-4 border border-amber-200/60 shadow-inner flex flex-col items-center">
            <ThreePiggyBank 
              fillPct={progressPct}
              wishTitle={goalState.title}
              onDepositComplete={handleDepositComplete}
            />
          </div>

          {/* Savings Progress & Timeline Info */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div>
              <span className="text-[11px] font-extrabold text-[#e07a5f] uppercase tracking-wider">主要圓夢目標</span>
              <h3 className="text-2xl font-extrabold text-[#3d405b] mt-0.5 truncate">{goalState.title}</h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">目標總額：NT$ {safeTarget.toLocaleString()}</p>
            </div>

            {/* Custom Morandi Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-4 bg-stone-200/80 rounded-full overflow-hidden p-0.5 border border-stone-300/40">
                <div 
                  className="h-full bg-gradient-to-r from-[#e07a5f] via-[#f2cc8f] to-[#81b29a] rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-stone-600">
                <span>{progressPct}% 已達成</span>
                <span>剩餘 NT$ {remaining.toLocaleString()}</span>
              </div>
            </div>

            {/* Timeline & Swap Calculation Card */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200/80 text-xs leading-relaxed text-stone-700 font-medium shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1 font-extrabold text-[#386753]">
                <span className="material-symbols-outlined text-sm">swap_calls</span>
                <span>外送替代動能轉換</span>
              </div>
              <p className="text-[11px] text-stone-600">
                每週預計自煮 {goalState.weeklyCookingMeals} 餐 ➔ 相當於少叫 <strong className="text-[#9a442d] font-black">{takeoutCount}</strong> 次外送，約 <strong className="text-[#386753] font-black">{weeksLeft} 週</strong> 即可讓小豬肚子填滿金光水解鎖願望！
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏆 2. 分階段里程碑解鎖路徑 (Milestones Path) */}
      <section className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#81b29a] text-xl">park</span>
            <h3 className="text-base font-extrabold text-[#3d405b]">圓夢路徑與里程碑 (Milestones)</h3>
          </div>
          <span className="text-[11px] font-extrabold text-stone-400">同一個終極目標的三階段解鎖</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {milestones.map((m) => {
            const isReached = safeCurrent >= m.target;
            const currentPct = Math.min(100, Math.round((safeCurrent / m.target) * 100));

            return (
              <div 
                key={m.id}
                className={`rounded-2xl p-4 border transition-all space-y-2.5 relative overflow-hidden ${
                  isReached 
                    ? 'bg-[#81b29a]/10 border-[#81b29a]/50 shadow-xs' 
                    : 'bg-stone-50/60 border-stone-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${
                    isReached ? 'bg-[#81b29a] text-white shadow-xs' : 'bg-stone-200 text-stone-500'
                  }`}>
                    <span className="material-symbols-outlined text-lg">{m.icon}</span>
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isReached ? 'bg-[#81b29a]/20 text-[#386753]' : 'bg-stone-200/80 text-stone-600'
                  }`}>
                    {isReached ? '已達成 ✅' : `${currentPct}% 推進中`}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-[#3d405b]">{m.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">{m.label}</p>
                </div>

                <div className="pt-1 border-t border-stone-100 flex justify-between items-center text-[11px] font-bold">
                  <span className="text-stone-400">解鎖門檻</span>
                  <span className="text-[#9a442d]">NT$ {m.target.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🧾 3. 自煮劃撥的多巴胺收銀機發票紀錄 (Deposit Receipts) */}
      <section className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#e07a5f] text-xl">receipt_long</span>
            <h3 className="text-base font-extrabold text-[#3d405b]">多巴胺自煮發票明細 (Deposit Receipts)</h3>
          </div>
          <span className="text-[11px] font-extrabold text-stone-400">每一次自煮 ➔ 投進小豬豬化為金光水</span>
        </div>

        {goalState.history.length === 0 ? (
          <div className="py-8 text-center space-y-2 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            <span className="material-symbols-outlined text-3xl text-stone-300">skillet</span>
            <p className="text-xs font-bold text-stone-500">尚無自煮劃撥明細</p>
            <p className="text-[11px] text-stone-400">點擊上方「投遞自煮外送發票」按鈕，體驗發票投進小豬背部投幣孔吧！</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {goalState.history.map((ev, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between bg-stone-50 hover:bg-amber-50/40 p-3 rounded-2xl border border-stone-200/60 transition-colors text-xs animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#e07a5f]/15 text-[#e07a5f] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base">receipt</span>
                  </span>
                  <div>
                    <strong className="block font-extrabold text-[#3d405b]">{ev.reason || '自煮外送差額儲蓄'}</strong>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleDateString('zh-TW') : '近期劃撥'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <strong className="text-xs font-black text-[#386753] block">+ NT$ {ev.amount || 120}</strong>
                  <span className="text-[9px] text-[#81b29a] font-bold">已入豬豬金光水 🐖💧</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 📝 FULL 6-STEP QUESTIONNAIRE EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/65 backdrop-blur-md px-4 text-center overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#fdfae7] rounded-3xl p-6 shadow-2xl border border-amber-200 text-left my-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e07a5f] text-xl">tune</span>
                <h3 className="text-base font-extrabold text-slate-800">編輯圓夢目標 (六步詳細精算)</h3>
              </div>
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full font-mono">
                Step {activeStep} / 6
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#e07a5f] transition-all duration-300"
                style={{ width: `${(activeStep / 6) * 100}%` }}
              ></div>
            </div>

            {/* STEP 1: 目標類型與名稱 */}
            {activeStep === 1 && (
              <div className="space-y-3.5">
                <h4 className="text-xs font-extrabold text-[#9a442d]">第 1 步：目標種類與願望名稱</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'travel', name: '旅遊基金', icon: 'flight' },
                    { id: 'emergency', name: '緊急預備金', icon: 'shield' },
                    { id: 'savings', name: '一般儲蓄', icon: 'savings' },
                    { id: 'custom', name: '其他願望', icon: 'flag' }
                  ].map((p) => (
                    <button 
                      key={p.id}
                      onClick={() => setFormState({ ...formState, purpose: p.id })}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2 text-xs font-extrabold transition-all ${
                        formState.purpose === p.id 
                          ? 'bg-[#e07a5f]/15 border-[#e07a5f] text-[#9a442d]' 
                          : 'bg-white border-stone-200 text-stone-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{p.icon}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-stone-700 mb-1">願望名稱</label>
                  <input 
                    type="text" 
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    className="w-full h-9.5 rounded-xl border border-amber-200 px-3 text-xs font-extrabold bg-white focus:outline-none"
                    placeholder="例如：去京都看櫻花 🍁"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: 目標金額與目前已存 */}
            {activeStep === 2 && (
              <div className="space-y-3.5">
                <h4 className="text-xs font-extrabold text-[#9a442d]">第 2 步：目標金額與目前已存金額</h4>
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-700 mb-1">目標總金額 (TWD)</label>
                  <input 
                    type="number" 
                    value={formState.targetAmount}
                    min="1000"
                    step="1000"
                    onChange={(e) => setFormState({ ...formState, targetAmount: Number(e.target.value) })}
                    className="w-full h-9.5 rounded-xl border border-amber-200 px-3 text-xs font-black text-[#9a442d] bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-700 mb-1">目前已存入金額 (TWD)</label>
                  <input 
                    type="number" 
                    value={formState.currentAmount}
                    min="0"
                    step="500"
                    onChange={(e) => setFormState({ ...formState, currentAmount: Number(e.target.value) })}
                    className="w-full h-9.5 rounded-xl border border-amber-200 px-3 text-xs font-bold text-[#386753] bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: 外食狀況算基準 */}
            {activeStep === 3 && (
              <div className="space-y-3.5">
                <h4 className="text-xs font-extrabold text-[#9a442d]">第 3 步：最近一週外食狀況</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-stone-700 mb-1">每週外食餐數</label>
                    <input 
                      type="number" 
                      value={formState.eatingOutMeals}
                      min="1"
                      onChange={(e) => setFormState({ ...formState, eatingOutMeals: Number(e.target.value) })}
                      className="w-full h-9 rounded-xl border border-amber-200 px-3 text-xs font-bold bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-stone-700 mb-1">一週外食總消費 (TWD)</label>
                    <input 
                      type="number" 
                      value={formState.eatingOutTotal}
                      min="100"
                      onChange={(e) => setFormState({ ...formState, eatingOutTotal: Number(e.target.value) })}
                      className="w-full h-9 rounded-xl border border-amber-200 px-3 text-xs font-bold bg-white focus:outline-none text-[#9a442d]"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-stone-500 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  💡 平均每餐外食：<strong className="text-[#9a442d]">NT$ {Math.round(formState.eatingOutTotal / Math.max(1, formState.eatingOutMeals))}</strong>
                </p>
              </div>
            )}

            {/* STEP 4: 自煮預算與目標頻率 */}
            {activeStep === 4 && (
              <div className="space-y-3.5">
                <h4 className="text-xs font-extrabold text-[#9a442d]">第 4 步：設定自煮預算與每週餐數</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-stone-700 mb-1">每餐自煮預算 (TWD)</label>
                    <input 
                      type="number" 
                      value={formState.homeCookBudget}
                      min="20"
                      onChange={(e) => setFormState({ ...formState, homeCookBudget: Number(e.target.value) })}
                      className="w-full h-9 rounded-xl border border-amber-200 px-3 text-xs font-bold bg-white focus:outline-none text-[#386753]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-stone-700 mb-1">每週預計自煮餐數</label>
                    <input 
                      type="number" 
                      value={formState.weeklyCookingMeals}
                      min="1"
                      max="21"
                      onChange={(e) => setFormState({ ...formState, weeklyCookingMeals: Number(e.target.value) })}
                      className="w-full h-9 rounded-xl border border-amber-200 px-3 text-xs font-bold bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: 時間推算預覽 */}
            {activeStep === 5 && (
              <div className="space-y-3.5">
                <h4 className="text-xs font-extrabold text-[#9a442d]">第 5 步：時間與達標週數推算</h4>
                <div className="bg-white p-3.5 rounded-2xl border border-amber-200 space-y-2 text-xs text-stone-700">
                  <div className="flex justify-between">
                    <span>距離目標尚差：</span>
                    <strong className="text-[#9a442d]">NT$ {(formState.targetAmount - formState.currentAmount).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>每餐估算省下：</span>
                    <strong className="text-[#386753]">NT$ {Math.max(0, Math.round((formState.eatingOutTotal / Math.max(1, formState.eatingOutMeals)) - formState.homeCookBudget))}</strong>
                  </div>
                  <div className="flex justify-between border-t pt-2 border-stone-100 font-extrabold">
                    <span>預估達標時間：</span>
                    <strong className="text-[#386753]">約 {weeksLeft} 週 ({Math.ceil(weeksLeft/4.3)} 個月)</strong>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: 三階段里程碑與最終確認 */}
            {activeStep === 6 && (
              <div className="space-y-3.5">
                <h4 className="text-xs font-extrabold text-[#9a442d]">第 6 步：確認三階段里程碑與建立</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex justify-between">
                    <span>🚩 短期 25%：</span>
                    <strong>NT$ {Math.round(formState.targetAmount * 0.25).toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex justify-between">
                    <span>🏆 中期 60%：</span>
                    <strong>NT$ {Math.round(formState.targetAmount * 0.60).toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex justify-between">
                    <span>✈️ 長期 100%：</span>
                    <strong>NT$ {formState.targetAmount.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-amber-200/60">
              <button 
                onClick={() => activeStep > 1 ? setActiveStep(prev => prev - 1) : setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 text-xs font-extrabold hover:bg-stone-100"
              >
                {activeStep > 1 ? '上一步' : '取消'}
              </button>
              
              {activeStep < 6 ? (
                <button 
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="px-5 py-2 rounded-xl bg-[#386753] hover:bg-[#2c5242] text-white text-xs font-extrabold shadow-2xs"
                >
                  下一步 ➔
                </button>
              ) : (
                <button 
                  onClick={handleSaveFullGoal}
                  className="px-5 py-2 rounded-xl bg-[#e07a5f] hover:bg-[#d95d39] text-white text-xs font-extrabold shadow-md"
                >
                  儲存並更新圓夢計畫 💾
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoiView;
