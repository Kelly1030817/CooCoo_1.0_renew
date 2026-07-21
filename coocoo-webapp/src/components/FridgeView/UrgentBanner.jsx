import React from 'react';

const UrgentBanner = ({ urgentItems }) => {
  if (!urgentItems || urgentItems.length === 0) return null;

  return (
    <section className="bg-rust-orange rounded-2xl p-md flex items-center justify-between shadow-md text-white mb-lg">
      <div className="flex items-center gap-md">
        <div className="bg-white/20 p-2 rounded-full hidden sm:block">
          <span className="material-symbols-outlined animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>
            hourglass_empty
          </span>
        </div>
        <div>
          <h2 className="font-extrabold text-base leading-tight">食材警報：{urgentItems.length} 件即將到期</h2>
          <p className="text-xs font-medium opacity-90">這些食材預計將在 24 小時內浪費，建議今天優先料理！</p>
        </div>
      </div>
      <button
        onClick={() => {
          const el = document.getElementById('rescue-decision-center');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        className="bg-white text-rust-orange px-md py-sm rounded-xl text-xs font-bold shadow-sm hover:bg-surface-bright transition-all active:scale-95 whitespace-nowrap"
      >
        開始救援
      </button>
    </section>
  );
};

export default UrgentBanner;
