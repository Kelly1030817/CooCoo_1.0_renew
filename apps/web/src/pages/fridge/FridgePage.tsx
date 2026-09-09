import { useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InventoryItem } from "@coocoo/contracts";
import { UiContext } from "@/app/ui-context";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api, json } from "@/shared/api/client";
import {
  AddInventoryModal,
  FridgeSetupModal,
} from "@/features/inventory/InventoryModals";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { IngredientIcon } from "@/shared/ui/IngredientIcon";
import { usePrepTray } from "@/features/kitchen/prep-tray";
import "./FridgePage.css";

export function FridgePage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const query = useQueryClient();
  const { isInTray, toggleInTray, addMultipleToTray } = usePrepTray();

  if (!data) return null;

  const sorted = [...data.inventory].sort((a, b) => a.daysLeft - b.daysLeft);
  const coldItems = sorted.filter((i) => i.chamber === "cold");
  const frozenItems = sorted.filter((i) => i.chamber === "frozen");
  const urgent = coldItems.filter((i) => i.daysLeft <= 3);

  // Dynamic capacity calculation based on boxSize heuristics (S=1L, M=2.5L, L=5L)
  const totalCapacityLiters = data.fridgeProfile.isConfigured
    ? data.fridgeProfile.capacityLiters
    : 130;
  const usedLiters = data.inventory.reduce((sum, item) => {
    const sizeMap: Record<string, number> = { S: 1.0, M: 2.5, L: 5.0 };
    return sum + (sizeMap[item.boxSize] || 2.0);
  }, 0);
  const capacityPercent = Math.min(100, Math.round((usedLiters / totalCapacityLiters) * 100));

  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });

  const remove = async (id: string) => {
    await api(`/inventory/${id}`, { method: "DELETE" });
    await refresh();
    ui.toast("食材已自冰箱庫存資料庫移除");
  };

  const act = (item: InventoryItem, action: "eat" | "preserve" | "discard") =>
    ui.open(
      <SafetyModal
        item={item}
        action={action}
        onClose={ui.close}
        onDone={async () => {
          ui.close();
          await refresh();
          ui.toast(action === "preserve" ? "已完成分裝冷凍延展保鮮" : "冰箱庫存已同步");
        }}
      />,
    );

  const handleSendAllUrgent = () => {
    if (urgent.length === 0) return;
    addMultipleToTray(urgent.map((i) => i.id));
    ui.toast(`已將 ${urgent.length} 件即期食材加入小廚房備料盤！`);
  };

  return (
    <div className="fridge-page space-y-4 px-3 py-2 sm:px-4 sm:py-3">
      {/* 頂部冰箱設定與容積計算卡 */}
      <section className="capacity-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0f2f1] text-[#2a9d8f]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-black text-stone-900">
                {data.fridgeProfile.isConfigured
                  ? `${data.fridgeProfile.brand} ${data.fridgeProfile.model} (${totalCapacityLiters}L)`
                  : `雙門小冰箱 (${totalCapacityLiters}L)`}
              </h3>
              <p className="text-[10px] text-stone-500">
                目前庫存佔比 {capacityPercent}% ({usedLiters.toFixed(1)}L / {totalCapacityLiters}L) · 運作正常
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#bce3df] bg-[#e0f2f1] px-2.5 py-0.5 text-[10px] font-extrabold text-[#2a9d8f]">
              {capacityPercent}% 佔比
            </span>
            <button
              type="button"
              onClick={() => ui.open(<FridgeSetupModal onClose={ui.close} />)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100"
            >
              調整
            </button>
          </div>
        </div>
        {/* 容量進度條 */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, capacityPercent)}%`, backgroundColor: "var(--cold-tag-text)" }}
          />
        </div>
      </section>

      {/* 標題與新增食材按鈕 */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black tracking-tight text-stone-900">冰箱沙漏</h2>
          <p className="text-[11px] text-stone-500">掌握低溫保存期限，徹底消滅食物浪費</p>
        </div>
        <button
          type="button"
          onClick={() => ui.open(<AddInventoryModal onClose={ui.close} />)}
          className="flex items-center gap-1 rounded-xl bg-[#2a9d8f] px-3.5 py-1.5 text-xs font-black text-white shadow-xs hover:brightness-105 active:scale-95 transition-all"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>新增食材</span>
        </button>
      </div>

      {/* 即期食材緊急警報區 (鮮活警戒橘 #ea580c) */}
      {urgent.length > 0 && (
        <section className="urgent-section space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              <h3 className="text-xs font-black" style={{ color: "var(--urgent-title)" }}>
                保鮮沙漏警報：{urgent.length} 件即將到期
              </h3>
            </div>
            <span className="text-[10px] font-bold" style={{ color: "var(--urgent-title)" }}>
              預估挽回 NT$ {urgent.reduce((sum, i) => sum + (i.roi?.savings || 50), 0)}
            </span>
          </div>
          <p className="text-[10px] text-stone-700 leading-relaxed">
            {urgent.map((i) => `${i.name}(剩${i.daysLeft}天)`).join("、")} 即將過期，建議優先帶入小廚房備料盤！
          </p>
          <button
            type="button"
            onClick={handleSendAllUrgent}
            className="urgent-btn flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs shadow-xs"
          >
            <span>一鍵將即期品帶入小廚房備料盤</span>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </section>
      )}

      {/* 溫層 1：冷藏室庫存 (4°C) - 方案 D 湖水綠系列 */}
      <section className="cold-chamber space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" style={{ color: "var(--cold-chamber-title)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20" />
              <path d="m4.93 4.93 14.14 14.14" />
              <path d="M2 12h20" />
              <path d="m19.07 4.93-14.14 14.14" />
            </svg>
            <h3 className="text-xs font-black" style={{ color: "var(--cold-chamber-title)" }}>
              冷藏室 (4°C)
            </h3>
          </div>
          <span className="text-[10px] font-bold" style={{ color: "var(--cold-chamber-title)" }}>
            {coldItems.length} 項在庫
          </span>
        </div>

        {coldItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#bce3df] bg-white/70 p-4 text-center text-xs text-stone-500">
            冷藏室目前無庫存食材，點擊右上角新增
          </div>
        ) : (
          <div className="space-y-2">
            {coldItems.map((item) => {
              const inTray = isInTray(item.id);
              return (
                <article key={item.id} className="ingredient-item-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs">
                      <IngredientIcon name={item.name} size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-stone-900">
                        {item.name} <span className="font-normal text-stone-500">{item.qty} {item.unit}</span>
                      </h4>
                      <p className="text-[10px] text-amber-800 font-bold">
                        {item.daysLeft <= 1 ? "今天到期" : `剩餘 ${item.daysLeft} 天`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleInTray(item.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-all ${
                        inTray ? "btn-in-tray" : "btn-add-tray"
                      }`}
                    >
                      {inTray ? "✓ 已在備料盤" : "帶入廚房 →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`刪除 ${item.name}`}
                      className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 溫層 2：冷凍庫庫存 (-18°C) - 天青冷藍系列 */}
      <section className="frozen-chamber space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" style={{ color: "var(--frozen-chamber-title)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <h3 className="text-xs font-black" style={{ color: "var(--frozen-chamber-title)" }}>
              冷凍庫 (-18°C)
            </h3>
          </div>
          <span className="text-[10px] font-bold" style={{ color: "var(--frozen-chamber-title)" }}>
            {frozenItems.length} 項在庫
          </span>
        </div>

        {frozenItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d7e3fc] bg-white/70 p-4 text-center text-xs text-stone-500">
            冷凍庫目前無庫存食材
          </div>
        ) : (
          <div className="space-y-2">
            {frozenItems.map((item) => {
              const inTray = isInTray(item.id);
              return (
                <article key={item.id} className="ingredient-item-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs">
                      <IngredientIcon name={item.name} size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-stone-900">
                        {item.name} <span className="font-normal text-stone-500">{item.qty} {item.unit}</span>
                      </h4>
                      <p className="text-[10px] text-blue-700 font-bold">
                        冷凍保存中 · 剩 {item.daysLeft} 天
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleInTray(item.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-all ${
                        inTray ? "btn-in-tray" : "btn-add-tray"
                      }`}
                    >
                      {inTray ? "✓ 已在備料盤" : "帶入廚房 →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`刪除 ${item.name}`}
                      className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 食安與延展保存中心 */}
      {urgent.length > 0 && (
        <section className="rescue-center space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h3 className="text-xs font-black text-stone-900">食安與延展保存中心</h3>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">
              POST /inventory/:id/rescue
            </span>
          </div>
          <p className="text-[10px] text-stone-600 leading-relaxed">
            今天吃不完？點選即期食材執行「分裝冷凍」延長 14 天保存期，或檢核氣味進行過期處置。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {urgent.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-bold text-stone-800">{item.name}</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => act(item, "preserve")}
                    className="px-2 py-1 rounded-lg bg-[#e0f2f1] text-[#2a9d8f] text-[10px] font-black hover:bg-[#2a9d8f] hover:text-white transition-all"
                  >
                    分裝冷凍 (+14天)
                  </button>
                  <button
                    type="button"
                    onClick={() => act(item, "discard")}
                    className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold hover:bg-rose-100 transition-all"
                  >
                    丟棄
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SafetyModal({
  item,
  action,
  onClose,
  onDone,
}: {
  item: InventoryItem;
  action: "eat" | "preserve" | "discard";
  onClose: () => void;
  onDone: () => void;
}) {
  const [safe, setSafe] = useState(action !== "discard");

  const submit = async () => {
    await api(
      `/inventory/${item.id}/rescue`,
      json("POST", { action, foodSafe: safe }),
    );
    onDone();
  };

  return (
    <Modal label="食品安全確認" onClose={onClose}>
      <ModalHeader
        title={action === "discard" ? "確認丟棄過期品" : "食安檢核閘門"}
        kicker={`${item.name} (${item.qty} ${item.unit})`}
        onClose={onClose}
      />
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs leading-5 text-amber-900">
        依照食安指引：若食材已產生酸腐味、黏液滑膩感、發霉或保存溫度異常，請勿食用，應立即丟棄以策安全。
      </div>
      {action !== "discard" && (
        <label className="mt-3 flex items-start gap-2 text-xs font-bold text-stone-800 cursor-pointer">
          <input
            type="checkbox"
            checked={safe}
            onChange={(e) => setSafe(e.target.checked)}
            className="mt-0.5 rounded border-stone-300 text-[#2a9d8f] focus:ring-[#2a9d8f]"
          />
          <span>本人已親自檢查：外觀色澤正常、無異味黏液，符合低溫延展冷凍標準</span>
        </label>
      )}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="secondary-btn flex-1">
          取消
        </button>
        <button
          type="button"
          disabled={action !== "discard" && !safe}
          onClick={submit}
          className="primary-btn flex-1 disabled:opacity-40"
        >
          確認執行
        </button>
      </div>
    </Modal>
  );
}
