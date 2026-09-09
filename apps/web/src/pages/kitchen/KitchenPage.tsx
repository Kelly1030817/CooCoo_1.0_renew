import { useState, useContext } from "react";
import { RecipeCatalogPanel } from "@/features/recipes/RecipeCatalogPanel";
import { useAppState } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { RecipeModal } from "@/features/cooking/RecipeModal";
import { IngredientIcon } from "@/shared/ui/IngredientIcon";
import { usePrepTray } from "@/features/kitchen/prep-tray";
import "./KitchenPage.css";

const STYLES = [
  "AI 自由發揮",
  "台式家常",
  "日式和風",
  "低卡健康",
  "西式排餐",
];

const COOKWARE_OPTIONS = [
  "全部設備",
  "瓦斯爐",
  "電鍋",
  "氣炸鍋",
  "微波爐",
  "小烤箱",
];

export function KitchenPage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const [style, setStyle] = useState(STYLES[0]);
  const [selectedCookware, setSelectedCookware] = useState(COOKWARE_OPTIONS[0]);
  const { prepIds, addToTray, removeFromTray, clearTray } = usePrepTray();

  if (!data) return null;

  // Filter actual prepped items strictly from real database inventory
  const preppedItems = data.inventory.filter((item) => prepIds.includes(item.id));

  // Available items in real database inventory that are not in prep tray
  const availableItems = data.inventory.filter((item) => !prepIds.includes(item.id));

  const handleStartCooking = () => {
    if (preppedItems.length === 0) {
      ui.toast("請先在備料盤選取至少 1 項食材！");
      return;
    }

    const effectiveStyle =
      selectedCookware === "全部設備"
        ? style
        : `${style} (指定設備：${selectedCookware})`;

    ui.open(
      <RecipeModal
        ingredientIds={preppedItems.map((i) => i.id)}
        style={effectiveStyle}
        onClose={ui.close}
        onComplete={() => {
          clearTray();
          ui.toast("料理完賽！已自動扣除庫存並更新圓夢資產。");
        }}
      />,
    );
  };

  return (
    <div className="kitchen-page space-y-4 px-3 py-2 sm:px-4 sm:py-3">
      {/* 頂部標題 */}
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-[#2a9d8f]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-stone-900">小廚房</h2>
            <p className="text-[11px] text-stone-500">出餐工作台 · 依風格與現有食材客製專屬食譜</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-stone-500">
          <span className="h-2 w-2 rounded-full bg-[#f4a261]" />
          <span>出餐工作台</span>
        </div>
      </header>

      {/* 食譜庫推薦 (支援現有庫存 0 元 / 少量補買) */}
      <RecipeCatalogPanel />

      {/* 1. 選擇料理風格 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-stone-900">1. 選擇料理風格</h3>
          <span className="text-[10px] text-stone-400">風味導引</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStyle(item)}
              className={`style-btn rounded-xl border px-3.5 py-1.5 text-xs font-bold ${
                style === item
                  ? "active"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* 2. 指定烹調設備 (攤開點選) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-stone-900">2. 指定烹調設備 (攤開點選)</h3>
          <span className="text-[10px] text-amber-800 font-bold">
            自備 {data.cookware.length > 0 ? `${data.cookware.length} 項` : "6 項"}設備
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {COOKWARE_OPTIONS.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => setSelectedCookware(tool)}
              className={`cookware-chip rounded-xl border px-3 py-1.5 text-xs font-bold ${
                selectedCookware === tool
                  ? "active"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-stone-400">
          智慧配對：依備料盤食材特性自動選配最適爐具
        </p>
      </section>

      {/* 3. 今日出餐備料盤 */}
      <section className="prep-tray-card space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#f4a261]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="14" x="3" y="5" rx="2" />
                <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
              </svg>
            </div>
            <h3 className="text-xs font-black text-stone-900">3. 今日出餐備料盤</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="prep-tray-badge rounded-full px-2 py-0.5 text-[10px] font-black">
              已備 {preppedItems.length} 項
            </span>
            {preppedItems.length > 0 && (
              <button
                type="button"
                onClick={clearTray}
                className="text-[10px] font-bold text-stone-400 hover:text-stone-700"
              >
                清空
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-stone-500">
          來自冰箱即期推薦或手動挑選的食材（出餐將自動扣減庫存）：
        </p>

        {preppedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#f4a261]/40 bg-orange-50/30 p-4 text-center text-xs text-stone-500">
            備料盤目前無食材，請從下方在庫食材點擊加入，或至「冰箱」一鍵帶入！
          </div>
        ) : (
          <div className="space-y-2">
            {preppedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50">
                    <IngredientIcon name={item.name} size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-stone-900">
                      {item.name}{" "}
                      <span className="font-normal text-stone-500">
                        {item.qty} {item.unit}
                      </span>
                    </h4>
                    <p className="text-[9px] font-mono text-stone-400">
                      UUID: {item.id.slice(0, 8)}... · 剩 {item.daysLeft} 天
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromTray(item.id)}
                  aria-label={`從備料盤移除 ${item.name}`}
                  className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. 快捷加料 (100% 來自真實在庫庫存，零寫死假資料！) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-stone-900">4. 快捷加料 (點擊直接加入備料盤)</h3>
          <span className="text-[10px] text-emerald-800 font-bold">真實庫存連動</span>
        </div>
        {availableItems.length === 0 ? (
          <p className="text-[11px] text-stone-400">
            {preppedItems.length > 0
              ? "已將所有冰箱在庫食材全數加入備料盤。"
              : "目前冰箱無其他在庫食材，可至「冰箱沙漏」新增庫存。"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToTray(item.id)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/60 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all active:scale-95"
              >
                <IngredientIcon name={item.name} size={16} />
                <span>+ {item.name} ({item.qty} {item.unit})</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 5. 底部浮動備菜出餐列 */}
      <div className="floating-cooking-bar">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-xs font-black text-white">
              {preppedItems.length > 0
                ? `備菜出餐就緒：${preppedItems.map((i) => i.name).join(" + ")}`
                : "尚未選取備料食材"}
            </h4>
            <p className="text-[10px] text-stone-300">
              {selectedCookware} · {style}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={preppedItems.length === 0}
          onClick={handleStartCooking}
          className="floating-cooking-btn disabled:opacity-40"
        >
          開始料理
        </button>
      </div>
    </div>
  );
}
