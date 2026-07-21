import React from 'react';

const ShoppingChecklist = ({
  shoppingList,
  inventory,
  onToggleCheck,
  onToggleAll,
  onDeleteShoppingItem,
  onEditShoppingItem,
  onConfirmRestock
}) => {
  const fridgeProduce = inventory.filter(item => {
    return item.name && !item.name.includes('肉') && !item.name.includes('蛋') && !item.name.includes('魚') && !item.name.includes('蝦') && !item.name.includes('奶') && !item.name.includes('豆腐');
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  const fridgeProtein = inventory.filter(item => {
    return item.name && (item.name.includes('肉') || item.name.includes('蛋') || item.name.includes('魚') || item.name.includes('蝦') || item.name.includes('奶') || item.name.includes('豆腐'));
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  const shopProduce = shoppingList.filter(item => item.category === 'produce');
  const shopProtein = shoppingList.filter(item => item.category === 'protein');

  const allChecked = shoppingList.length > 0 && shoppingList.every(item => item.checked);

  const renderShoppingRow = (item) => (
    <tr key={item.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors group">
      <td className="p-3 text-center">
        <label className="flex items-center justify-center cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
            checked={item.checked}
            onChange={() => onToggleCheck(item.id)}
          />
        </label>
      </td>
      <td className="p-3">
        <span className={`font-bold text-sm ${item.checked ? 'text-on-surface-variant line-through opacity-70' : 'text-slate-blue'}`}>
          {item.name}
        </span>
      </td>
      <td className="p-3">
        <span className={`text-xs font-bold ${item.checked ? 'text-outline line-through opacity-70' : 'text-on-surface-variant'}`}>
          {item.qty} {item.unit}
        </span>
      </td>
      <td className="p-3">
        <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold">
          {item.category === 'produce' ? '新鮮蔬果' : '蛋白質與乳製品'}
        </span>
      </td>
      <td className="p-3 text-right">
        <span className={`font-bold text-sm ${item.checked ? 'text-outline line-through opacity-70' : 'text-terracotta'}`}>
          ${item.estCost}
        </span>
      </td>
      <td className="p-3 text-center">
        <button
          onClick={() => onEditShoppingItem && onEditShoppingItem(item)}
          className="text-outline hover:text-secondary p-1 rounded-md transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
      </td>
      <td className="p-3 text-center">
        <button
          onClick={() => onDeleteShoppingItem(item.id)}
          className="text-outline hover:text-error p-1 rounded-md transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </td>
    </tr>
  );

  const renderFridgeRow = (item) => (
    <tr key={item.id} className="border-b border-outline-variant/10 bg-surface-container-low/30 hover:bg-surface-container-low/70 transition-colors">
      <td className="p-3 text-center">
        <span className="material-symbols-outlined text-outline-variant text-[16px]" title="冰箱已有庫存">kitchen</span>
      </td>
      <td className="p-3">
        <span className="font-bold text-sm text-outline-variant opacity-80">{item.name}</span>
        <span className="ml-2 text-[10px] bg-slate-blue/10 text-slate-blue px-1.5 py-0.5 rounded-full font-bold">庫存</span>
      </td>
      <td className="p-3">
        <span className="text-xs font-bold text-outline-variant opacity-80">{item.qty} {item.unit}</span>
      </td>
      <td className="p-3">
        <span className="bg-surface-container text-outline-variant px-2 py-0.5 rounded text-[10px] font-bold opacity-80">
          {item.chamber === 'cold' ? '冷藏室' : '冷凍庫'}
        </span>
      </td>
      <td className="p-3 text-right">
        <span className={`text-[11px] font-bold ${item.daysLeft <= 1 ? 'text-rust-orange' : 'text-sage-green'}`}>
          剩 {item.daysLeft} 天
        </span>
      </td>
      <td className="p-3 text-center"></td>
      <td className="p-3 text-center"></td>
    </tr>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col justify-between">
      <div>
        <div className="p-lg border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
          <h3 className="text-lg font-extrabold text-slate-blue flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary fill">format_list_bulleted</span> 採買清單
          </h3>
          {shoppingList.length > 0 && (
            <button
              onClick={onToggleAll}
              className="text-xs bg-slate-blue hover:brightness-110 text-white font-extrabold px-4 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">
                {allChecked ? 'check_box' : 'check_box_outline_blank'}
              </span>
              {allChecked ? '取消全選' : '全選'}
            </button>
          )}
        </div>

        {shoppingList.length === 0 && fridgeProduce.length === 0 && fridgeProtein.length === 0 ? (
          <div className="matrix-grid p-lg min-h-[200px] flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-outline-variant text-[64px] mb-2">playlist_add_check</span>
            <p className="text-sm font-semibold text-on-surface-variant">採買清單空空的...</p>
            <p className="text-xs text-outline mt-1">系統將根據冰箱庫存消耗自動生成，或可手動新增。</p>
          </div>
        ) : (
          <div className="matrix-grid min-h-[300px] p-md space-y-md">
            {/* Produce Section */}
            <div>
              <div className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-[#81b29a]/10 border border-[#81b29a]/35 text-[11px] font-extrabold text-[#386753] mb-sm select-none">
                <span className="material-symbols-outlined text-[13px] font-bold">eco</span> 新鮮蔬果
              </div>
              {shopProduce.length === 0 && fridgeProduce.length === 0 ? (
                <div className="text-[11px] text-outline p-sm bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center select-none">
                  此類別無採買或冰箱品項
                </div>
              ) : (
                <div className="overflow-x-auto border border-outline-variant/20 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-xs font-extrabold text-slate-blue bg-surface-container-low/50 select-none">
                        <th className="p-3 w-[8%] text-center">勾選</th>
                        <th className="p-3 w-[28%]">食材名稱</th>
                        <th className="p-3 w-[16%]">數量單位</th>
                        <th className="p-3 w-[20%]">分類</th>
                        <th className="p-3 w-[14%] text-right">預估金額 / 狀態</th>
                        <th className="p-3 w-[7%] text-center">編輯</th>
                        <th className="p-3 w-[7%] text-center">刪除</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {shopProduce.map(renderShoppingRow)}
                      {fridgeProduce.map(renderFridgeRow)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Protein Section */}
            <div>
              <div className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-[#e07a5f]/10 border border-[#e07a5f]/35 text-[11px] font-extrabold text-[#be5f48] mb-sm select-none">
                <span className="material-symbols-outlined text-[13px] font-bold">egg</span> 蛋白質與乳製品
              </div>
              {shopProtein.length === 0 && fridgeProtein.length === 0 ? (
                <div className="text-[11px] text-outline p-sm bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center select-none">
                  此類別無採買或冰箱品項
                </div>
              ) : (
                <div className="overflow-x-auto border border-outline-variant/20 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-xs font-extrabold text-slate-blue bg-surface-container-low/50 select-none">
                        <th className="p-3 w-[8%] text-center">勾選</th>
                        <th className="p-3 w-[28%]">食材名稱</th>
                        <th className="p-3 w-[16%]">數量單位</th>
                        <th className="p-3 w-[20%]">分類</th>
                        <th className="p-3 w-[14%] text-right">預估金額 / 狀態</th>
                        <th className="p-3 w-[7%] text-center">編輯</th>
                        <th className="p-3 w-[7%] text-center">刪除</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {shopProtein.map(renderShoppingRow)}
                      {fridgeProtein.map(renderFridgeRow)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Calculator */}
      {shoppingList.length > 0 && (
        <div className="p-lg bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-md">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-on-surface-variant">
              已勾選 {shoppingList.filter(item => item.checked).length} 項，預估總額：
            </span>
            <span className="text-slate-blue font-extrabold text-2xl">
              ${shoppingList.filter(item => item.checked).reduce((sum, item) => sum + item.estCost, 0)}
            </span>
            <span className="text-[10px] font-bold text-outline">TWD</span>
          </div>
          <button
            onClick={onConfirmRestock}
            className="bg-[#be5f48] hover:brightness-110 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span> 確認補貨並更新冰箱
          </button>
        </div>
      )}
    </div>
  );
};

export default ShoppingChecklist;
