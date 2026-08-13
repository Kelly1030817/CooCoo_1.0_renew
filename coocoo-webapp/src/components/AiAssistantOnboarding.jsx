import React, { useState, useEffect } from 'react';

export default function AiAssistantOnboarding({ 
  onSkip,
  onCompleteSetup
}) {
  // Step: 'welcome' | 'ticket_pass'
  const [step, setStep] = useState('welcome');
  const [wishTitle, setWishTitle] = useState('');
  const [wishAmount, setWishAmount] = useState(30000);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isStamped, setIsStamped] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  const placeholders = [
    '例如：去京都看櫻花 🍁',
    '例如：買台極致油煙氣炸鍋 🍳',
    '例如：存下第一筆自煮緊急備用金 💰',
    '例如：東京五天四夜自由行 ✈️'
  ];

  // Rotate placeholders every 3.5s
  useEffect(() => {
    if (step !== 'ticket_pass') return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [step]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onSkip?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  const handleSealAndFly = () => {
    setIsStamped(true);
    const title = wishTitle.trim() || '首個自煮圓夢願望';
    const amount = Math.max(1000, Number(wishAmount) || 30000);

    // After stamp animation (450ms), trigger flying animation
    setTimeout(() => {
      setIsFlying(true);
    }, 450);

    // After flight finishes (1200ms total), complete setup & switch tab to RoiView!
    setTimeout(() => {
      if (onCompleteSetup) {
        onCompleteSetup({ title, targetAmount: amount });
      }
    }, 1250);
  };

  const safeAmount = Math.max(1000, Number(wishAmount) || 0);
  const weeks = Math.max(1, Math.ceil(safeAmount / (4 * 120)));
  const takeoutCount = Math.ceil(safeAmount / 200);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/65 backdrop-blur-md px-4 text-center animate-in fade-in duration-200 overflow-y-auto"
      onClick={onSkip}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="chef-modal-title"
        className={`w-full max-w-md bg-[#fdfae7] rounded-3xl p-5 shadow-2xl border border-amber-200/80 overflow-hidden relative text-left my-auto transition-all ${
          isFlying ? 'animate-ticket-fly' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-100/70 hover:bg-amber-200/80 text-stone-600 flex items-center justify-center transition-colors shrink-0 z-20"
          aria-label="關閉首進引導"
        >
          <span class="material-symbols-outlined text-base">close</span>
        </button>

        {/* STEP 1: WELCOME DIALOGUE */}
        {step === 'welcome' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-amber-200/60 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e07a5f]/15 text-[#e07a5f] flex items-center justify-center shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-3xl">restaurant_menu</span>
              </div>
              <div>
                <h2 id="chef-modal-title" className="text-lg font-extrabold text-slate-800">
                  歡迎來到 CooCoo 煮煮 👋
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">專為單身租屋族設計的「智慧自煮與圓夢儲蓄系統」</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
              <div className="bg-white p-4 rounded-2xl border border-amber-200/60 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#9a442d]">
                  <span className="material-symbols-outlined text-lg">bolt</span>
                  15 分鐘極速自適應烹飪
                </div>
                <p className="text-stone-500 text-[11px]">對齊套房單口爐與小廚具，低油煙極速出餐，洗滌件數極限控制在 1-2 件。</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200/60 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#386753]">
                  <span className="material-symbols-outlined text-lg">savings</span>
                  外送差額圓夢儲蓄
                </div>
                <p className="text-stone-500 text-[11px]">每自煮一餐，系統自動將省下的「外送差額」轉入實體願望清單，累積圓夢動能！</p>
              </div>
            </div>

            <button 
              onClick={() => setStep('ticket_pass')} 
              className="w-full bg-[#e07a5f] hover:bg-[#d95d39] text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>開始印製我的第一個圓夢通行證 🎟️</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        )}

        {/* STEP 2: OPTION A DREAM TICKET PASS GENERATOR */}
        {step === 'ticket_pass' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-xl">confirmation_number</span>
                <h3 className="text-sm font-extrabold text-slate-800">CooCoo 圓夢通行證立印器</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Step 2 / 2</span>
            </div>

            {/* Ticket Form Card */}
            <div className="bg-white rounded-2xl p-4 border-2 border-dashed border-amber-300 space-y-3.5 relative overflow-hidden shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100 text-xs font-extrabold text-slate-800">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#e07a5f]">confirmation_number</span> 
                  CooCoo 圓夢通行證
                </span>
                <span className="text-[10px] text-stone-400 font-mono">№ {Date.now().toString().slice(-6)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-800 mb-1">1. 輸入你的圓夢願望</label>
                <input 
                  type="text" 
                  value={wishTitle}
                  onChange={(e) => setWishTitle(e.target.value)}
                  placeholder={placeholders[placeholderIndex]} 
                  className="w-full h-9.5 rounded-xl border border-amber-200 px-3 text-xs font-bold bg-amber-50/30 focus:bg-white focus:border-[#e07a5f] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-800 mb-1">2. 預估需要多少金額 (TWD)</label>
                <input 
                  type="number" 
                  value={wishAmount}
                  min="1000"
                  step="1000"
                  onChange={(e) => setWishAmount(e.target.value)}
                  className="w-full h-9.5 rounded-xl border border-amber-200 px-3 text-xs font-extrabold text-[#9a442d] bg-amber-50/30 focus:bg-white focus:border-[#e07a5f] focus:outline-none transition-all"
                />
              </div>

              {/* Dynamic Timeline Calculation */}
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/70 text-left space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#386753]">
                  <span className="material-symbols-outlined text-sm">savings</span>
                  <span>圓夢替代週數試算</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
                  💡 每週自煮 4 餐 ➔ 相當於少叫 <strong className="text-[#9a442d] font-black">{takeoutCount}</strong> 次外送，約 <strong className="text-[#386753] font-black">{weeks} 週</strong> ({Math.ceil(weeks/4.3)} 個月) 即可解鎖這項願望！
                </p>
                <div className="text-[10px] text-amber-800 font-bold bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  <span>設定完成後，隨時可以在【圓夢看板】頁面查看與編輯目標資訊喔！</span>
                </div>
              </div>

              {/* Stamp Mark */}
              {isStamped && (
                <div className="absolute right-3 bottom-3 border-4 border-red-600 text-red-600 font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-widest pointer-events-none animate-stamp-in bg-white/95 shadow-md">
                  圓夢契約已立<br/><span className="text-[8px] tracking-normal block text-center">DREAM SEALED</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleSealAndFly}
              disabled={isStamped}
              className="w-full bg-[#386753] hover:bg-[#2c5242] text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">edit_document</span>
              <span>🖋️ 蓋章立約 ➔ 啟動圓夢計畫</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
