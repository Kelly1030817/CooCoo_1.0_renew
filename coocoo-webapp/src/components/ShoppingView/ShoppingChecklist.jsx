import React, { useState } from 'react';

const ShoppingChecklist = ({
  shoppingList,
  inventory,
  onToggleCheck,
  onToggleAll,
  onDeleteShoppingItem,
  onEditShoppingItem,
  onConfirmRestock,
  onUpdateQty
}) => {
  const [openCategories, setOpenCategories] = useState({ produce: true, protein: true });

  const toggleCategory = (cat) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const shopProduce = shoppingList.filter(item => item.category === 'produce');
  const shopProtein = shoppingList.filter(item => item.category === 'protein');

  const allChecked = shoppingList.length > 0 && shoppingList.every(item => item.checked);

  // Status Badge Component
  const renderStatusBadge = (status) => {
    if (status === '急需補貨' || status === '已耗盡') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#e07a5f]/15 text-[#9a442d] border border-[#e07a5f]/30 flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[12px]">warning</span> 急需補貨
        </span>
      );
    }
    if (status === 'AI 智慧建議' || status === 'AI 庫存精算') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f2cc8f]/30 text-[#765a28] border border-[#f2cc8f]/50 flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI 智慧建議
        </span>
      );
    }
    if (status === '主廚推薦' || status === '主廚推薦補貨') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#81b29a]/20 text-[#386753] border border-[#81b29a]/40 flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[12px]">skillet</span> 主廚推薦
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant/70 border border-outline-variant/30">
        待採買
      </span>
    );
  };

  // Render Touch Card for Mobile / Responsive List
  const renderShoppingItemCard = (item) => {
    return (
      <div
        key={item.id}
        className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-3.5 rounded-2xl border shadow-xs transition-all gap-3 ${
          item.checked
            ? 'bg-emerald-50/60 border-[#81b29a]/50'
            : 'bg-white border-outline-variant/30 hover:border-[#81b29a]/40'
        }`}
      >
        <div className="flex items-center gap-3 min-w-[200px]">
          {/* 44x44px Touch Target Checkbox */}
          <button
            onClick={() => onToggleCheck(item.id)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
              item.checked
                ? 'bg-[#386753]/20 border-[#386753]/40 text-[#386753]'
                : 'bg-surface-container border-outline-variant/30 text-outline hover:bg-secondary/10'
            }`}
            title="勾選/取消勾選"
          >
            <span className="material-symbols-outlined text-2xl font-bold">
              {item.checked ? 'check_box' : 'check_box_outline_blank'}
            </span>
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-extrabold text-sm sm:text-base ${item.checked ? 'text-slate-blue/80' : 'text-slate-blue'}`}>
                {item.name}
              </span>
              {renderStatusBadge(item.status)}
            </div>
            <span className="text-xs font-bold text-on-surface-variant/70">
              預估 ${item.estCost} TWD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          {/* Stepper */}
          <div className="flex items-center bg-surface-container-low rounded-xl border border-outline-variant/30 p-1">
            <button
              onClick={() => onUpdateQty && onUpdateQty(item.id, Math.max(1, item.qty - 1))}
              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs font-black text-slate-blue shadow-xs active:scale-90"
            >
              -
            </button>
            <span className="px-2.5 text-xs font-black text-slate-blue">
              {item.qty}
            </span>
            <button
              onClick={() => onUpdateQty && onUpdateQty(item.id, item.qty + 1)}
              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs font-black text-slate-blue shadow-xs active:scale-90"
            >
              +
            </button>
            <span className="text-xs text-outline font-bold pr-1">{item.unit || '項'}</span>
          </div>

          <span className={`font-black text-sm min-w-[50px] text-right ${item.checked ? 'text-slate-blue/80' : 'text-slate-blue'}`}>
            ${item.estCost * (item.qty || 1)}
          </span>

          <button
            onClick={() => onEditShoppingItem && onEditShoppingItem(item)}
            className="text-outline hover:text-secondary p-1.5 rounded-lg hover:bg-secondary/10 transition-colors"
            title="編輯"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={() => onDeleteShoppingItem(item.id)}
            className="text-outline hover:text-error p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="刪除"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary fill">format_list_bulleted</span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-blue">採買清單確認</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-secondary/10 text-secondary border border-secondary/20">
              {shoppingList.length} 品項
            </span>
          </div>
          {shoppingList.length > 0 && (
            <button
              onClick={onToggleAll}
              className="text-xs bg-slate-blue hover:brightness-110 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">
                {allChecked ? 'check_box' : 'check_box_outline_blank'}
              </span>
              {allChecked ? '取消全選' : '全選'}
            </button>
          )}
        </div>

        {/* Empty State */}
        {shoppingList.length === 0 ? (
          <div className="p-lg min-h-[220px] flex flex-col items-center justify-center text-center space-y-2">
            <span className="material-symbols-outlined text-outline-variant text-[56px]">playlist_add_check</span>
            <p className="text-sm font-extrabold text-on-surface-variant">採買清單空空的...</p>
            <p className="text-xs text-outline">可點擊右上角「手動新增」或使用 AI 建議加入缺口食材！</p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-6">
            {/* Category: Produce (新鮮蔬果) */}
            <div className="space-y-3">
              <button
                onClick={() => toggleCategory('produce')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 hover:bg-emerald-100/60 transition-colors text-left select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#386753]">eco</span>
                  <span className="font-extrabold text-xs sm:text-sm text-[#386753]">新鮮蔬果 (Produce)</span>
                  <span className="text-[11px] font-bold text-[#386753] bg-white px-2 py-0.5 rounded-full border border-[#81b29a]/40">
                    {shopProduce.length} 品項
                  </span>
                </div>
                <span className={`material-symbols-outlined text-[#386753] transition-transform duration-300 ${openCategories.produce ? '' : '-rotate-90'}`}>
                  expand_more
                </span>
              </button>

              {openCategories.produce && (
                <div className="space-y-2.5">
                  {shopProduce.length === 0 ? (
                    <div className="text-xs text-outline p-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center">
                      此類別無待採買品項
                    </div>
                  ) : (
                    shopProduce.map(renderShoppingItemCard)
                  )}
                </div>
              )}
            </div>

            {/* Category: Protein (蛋白質與乳製品) */}
            <div className="space-y-3">
              <button
                onClick={() => toggleCategory('protein')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-orange-50/80 border border-orange-200/60 hover:bg-orange-100/60 transition-colors text-left select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#9a442d]">egg</span>
                  <span className="font-extrabold text-xs sm:text-sm text-[#9a442d]">蛋白質與乳製品 (Protein & Dairy)</span>
                  <span className="text-[11px] font-bold text-[#9a442d] bg-white px-2 py-0.5 rounded-full border border-[#e07a5f]/40">
                    {shopProtein.length} 品項
                  </span>
                </div>
                <span className={`material-symbols-outlined text-[#9a442d] transition-transform duration-300 ${openCategories.protein ? '' : '-rotate-90'}`}>
                  expand_more
                </span>
              </button>

              {openCategories.protein && (
                <div className="space-y-2.5">
                  {shopProtein.length === 0 ? (
                    <div className="text-xs text-outline p-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center">
                      此類別無待採買品項
                    </div>
                  ) : (
                    shopProtein.map(renderShoppingItemCard)
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Footer Calculator */}
      {shoppingList.length > 0 && (
        <div className="p-4 sm:p-5 bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-on-surface-variant">
              已勾選 {shoppingList.filter(i => i.checked).length} 項，預估總額：
            </span>
            <span className="text-2xl font-black text-slate-blue">
              ${shoppingList.filter(i => i.checked).reduce((sum, i) => sum + i.estCost * (i.qty || 1), 0)}
            </span>
            <span className="text-[10px] font-bold text-outline">TWD</span>
          </div>
          <button
            onClick={onConfirmRestock}
            className="w-full sm:w-auto bg-[#9a442d] hover:bg-[#e07a5f] text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span> 確認補貨並更新冰箱
          </button>
        </div>
      )}
    </div>
  );
};

export default ShoppingChecklist;
