import React, { useState } from 'react';

const getRescuePlanForItem = (item) => {
  return {
    eatTitle: '清冰箱炒青菜',
    eatMethod: '切碎後與蒜頭快炒，起鍋前滴香油。',
    eatTime: 10,
    preserveTitle: '切塊冷凍',
    preserveMethod: '洗淨擦乾後切塊，平鋪於保鮮袋冷凍。',
    outputQty: item.qty,
    outputUnit: item.unit,
    preserveDays: 30,
  };
};

const RescueDecisionCenter = ({ candidates, onDiscard, onRescue }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [checks, setChecks] = useState([false, false, false]);

  const potentialSavings = candidates.reduce((sum, item) => sum + (Number(item.roi?.savings) || 50), 0);

  const openGate = (item, action) => {
    setSelectedItem(item);
    setSelectedAction(action);
    setChecks([false, false, false]);
  };

  const closeGate = () => {
    setSelectedItem(null);
    setSelectedAction(null);
    setChecks([false, false, false]);
  };

  const isGatePassed = checks.every((c) => c);

  return (
    <section id="rescue-decision-center" className="mt-xl bg-[#fffdf5] border-2 border-ochre-gold/70 rounded-3xl p-md sm:p-lg shadow-sm scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
        <div>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-2xl">emergency</span>
            <h3 className="text-xl font-extrabold text-slate-blue">救援決策中心</h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">今天吃掉，或現在處理、以後再吃。每一步都會同步庫存。</p>
        </div>
        <div className="bg-ochre-gold/25 border border-ochre-gold rounded-xl px-md py-sm text-center">
          <span className="block text-[10px] font-bold text-tertiary">本輪可避免浪費</span>
          <strong className="text-lg text-primary">NT$ {potentialSavings}</strong>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="bg-white rounded-2xl p-xl text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-secondary text-4xl">verified</span>
          <h4 className="font-extrabold text-slate-blue mt-sm">目前沒有需要緊急救援的冷藏食材</h4>
          <p className="text-xs text-on-surface-variant mt-1">剩餘 3 天內的食材會自動出現在這裡。</p>
        </div>
      ) : (
        <div className="space-y-md">
          {candidates.map((item) => {
            const plan = getRescuePlanForItem(item);
            const urgency = item.daysLeft <= 0 ? '今天到期' : `剩 ${item.daysLeft} 天`;
            return (
              <article key={item.id} className="bg-white rounded-2xl p-md border border-outline-variant/30 shadow-sm">
                <div className="flex items-start justify-between gap-sm mb-md">
                  <div className="flex items-center gap-sm min-w-0">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-surface-container" />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-blue truncate">{item.name} {item.qty}{item.unit}</h4>
                      <span className="text-[10px] font-extrabold text-rust-orange">{urgency} · 預估可救回 NT$ {Number(item.roi?.savings) || 50}</span>
                    </div>
                  </div>
                  <button onClick={() => onDiscard(item.id)} className="text-[10px] text-outline hover:text-error underline">確認不安全／丟棄</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                  <button onClick={() => openGate(item, 'eat')} className="text-left p-md rounded-xl border-2 border-secondary/30 bg-secondary/5 hover:border-secondary transition-colors">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-secondary">
                      <span className="material-symbols-outlined text-base">restaurant</span> A｜今天直接吃掉
                    </span>
                    <strong className="block text-sm text-slate-blue mt-1">{plan.eatTitle}</strong>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">{plan.eatMethod}</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-secondary">{plan.eatTime} 分鐘 · 完成後扣除 1 {item.unit}</span>
                  </button>
                  <button onClick={() => openGate(item, 'preserve')} className="text-left p-md rounded-xl border-2 border-primary/25 bg-primary/5 hover:border-primary transition-colors">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-primary">
                      <span className="material-symbols-outlined text-base">ac_unit</span> B｜轉化保存
                    </span>
                    <strong className="block text-sm text-slate-blue mt-1">{plan.preserveTitle}</strong>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">{plan.preserveMethod}</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-primary">產生 {plan.outputQty} {plan.outputUnit} · 冷凍 {plan.preserveDays} 天</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Safety Gate Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-md backdrop-blur-sm">
          <section className="bg-white rounded-3xl p-lg max-w-[460px] w-full shadow-2xl border border-outline-variant/30">
            <div className="flex justify-between gap-sm mb-md">
              <div>
                <span className="text-[10px] font-extrabold text-rust-orange">食安閘門</span>
                <h3 className="font-extrabold text-slate-blue">先確認 {selectedItem.name} 仍安全</h3>
              </div>
              <button onClick={closeGate} aria-label="關閉食安檢查"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="bg-error-container/35 border border-error/20 rounded-xl p-sm mb-md text-xs text-on-error-container">
              加熱或冷凍不能讓已腐壞的食物重新變安全。有疑慮時請直接丟棄。
            </div>
            <div className="space-y-sm">
              {[
                "沒有酸敗、腐臭或其他異常氣味",
                "沒有黏液、發霉或異常變色",
                "冷藏保存正常，沒有長時間放在室溫"
              ].map((text, i) => (
                <label key={i} className="flex items-start gap-sm p-sm bg-surface-container-low rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[#386753]"
                    checked={checks[i]}
                    onChange={(e) => {
                      const newChecks = [...checks];
                      newChecks[i] = e.target.checked;
                      setChecks(newChecks);
                    }}
                  />
                  <span className="text-xs font-bold">{text}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-sm mt-md">
              <button
                onClick={() => { closeGate(); onDiscard(selectedItem.id); }}
                className="bg-surface-container text-error rounded-xl py-2.5 text-xs font-extrabold"
              >
                不安全，丟棄
              </button>
              <button
                onClick={() => { onRescue(selectedItem.id, selectedAction); closeGate(); }}
                disabled={!isGatePassed}
                className="bg-secondary text-white rounded-xl py-2.5 text-xs font-extrabold disabled:opacity-35 disabled:cursor-not-allowed"
              >
                確認安全，執行
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default RescueDecisionCenter;
