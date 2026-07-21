import React from 'react';

const AssetsSummary = ({ goal, activeDreamName }) => {
  const saltTeaspoons = (Math.max(0, goal.sodiumReduced) / 2300).toFixed(1);
  const oilTablespoons = (Math.max(0, goal.fatReduced) / 14).toFixed(1);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-lg">
      {/* Savings Asset */}
      <div className="bg-white rounded-2xl p-lg shadow-sm border-l-4 border-ochre-gold flex flex-col justify-between">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-ochre-gold">savings</span>
          <h4 className="font-extrabold text-slate-blue">圓夢資產</h4>
        </div>
        <div className="grid grid-cols-2 gap-sm flex-1">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant">本月省下</p>
            <p className="text-xl font-extrabold text-primary">NT$ {goal.monthlySaved.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant">目前主夢想</p>
            <p className="text-sm font-extrabold text-slate-blue line-clamp-2">{activeDreamName}</p>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant mt-md">完成料理或救援食材後，節省金額會自動分配到目前主夢想。</p>
      </div>

      {/* Health Asset */}
      <div className="bg-white rounded-2xl p-lg shadow-sm border-l-4 border-sage-green">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-sage-green">health_and_safety</span>
          <h4 className="font-extrabold text-slate-blue">健康資產 <span className="text-[10px] text-outline font-normal">估算</span></h4>
        </div>
        <div className="grid grid-cols-2 gap-sm text-center">
          <div>
            <p className="text-xl font-extrabold text-secondary">{goal.mealsCompleted}</p>
            <p className="text-[10px] font-bold text-on-surface-variant">完成料理</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-secondary">{goal.rescuedItems}</p>
            <p className="text-[10px] font-bold text-on-surface-variant">救援食材</p>
          </div>
          
          {/* Salt icon equivalent */}
          <div className="bg-surface-container-low rounded-xl p-sm">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-1 text-secondary">
              <path d="M9 12.5C9 9.2 11.7 6.5 15 6.5s6 2.7 6 6H9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M8.5 12.5h13l-1 11h-11l-1-11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M10 17h10M10.5 20.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".65"/>
              <circle cx="12" cy="10" r=".9" fill="currentColor"/>
              <circle cx="15" cy="8.5" r=".9" fill="currentColor"/>
              <circle cx="18" cy="10" r=".9" fill="currentColor"/>
            </svg>
            <p className="text-sm font-extrabold text-slate-blue">約 {saltTeaspoons} 茶匙鹽</p>
            <p className="text-[10px] text-on-surface-variant">少攝取的鈉（{goal.sodiumReduced.toLocaleString()} mg）</p>
          </div>

          {/* Oil icon equivalent */}
          <div className="bg-surface-container-low rounded-xl p-sm">
            <span className="material-symbols-outlined text-ochre-gold text-xl block mb-1">oil_barrel</span>
            <p className="text-sm font-extrabold text-slate-blue">約 {oilTablespoons} 大匙油</p>
            <p className="text-[10px] text-on-surface-variant">少攝取的脂肪（{goal.fatReduced.toLocaleString()} g）</p>
          </div>
        </div>
        <p className="text-[10px] leading-relaxed text-on-surface-variant mt-sm text-center">
          1 茶匙鹽約含 2,300 mg 鈉、1 大匙油約含 14 g 脂肪。
        </p>
      </div>
    </section>
  );
};

export default AssetsSummary;
