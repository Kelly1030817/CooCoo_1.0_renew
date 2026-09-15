import { useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InventoryItem } from "@coocoo/contracts";
import { UiContext } from "@/app/ui-context";
import { useAppRoute } from "@/app/routing/useAppRoute";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api, json } from "@/shared/api/client";
import { AddInventoryModal } from "@/features/inventory/InventoryModals";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { IngredientIcon } from "@/shared/ui/IngredientIcon";
import { usePrepTray } from "@/features/kitchen/prep-tray";
import { groupInventory, needsInventoryConfirmation, type InventoryGroup } from "./inventory-view";
import "./FridgePage.css";

function addInventoryModalNode(onClose: () => void) {
  return <AddInventoryModal onClose={onClose} />;
}

export function FridgePage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const query = useQueryClient();
  const { navigate } = useAppRoute();
  const { isInTray, addMultipleToTray } = usePrepTray();

  if (!data) return null;

  const sorted = [...data.inventory].sort((a, b) => a.daysLeft - b.daysLeft);
  const coldItems = sorted.filter((i) => i.chamber === "cold");
  const urgent = coldItems.filter((i) => i.daysLeft <= 3);
  const inventoryGroups = groupInventory(sorted);
  const coldGroups = inventoryGroups.filter((group) => group.chamber === "cold");
  const frozenGroups = inventoryGroups.filter((group) => group.chamber === "frozen");
  const pantryGroups = inventoryGroups.filter((group) => group.chamber === "pantry");
  const preparedServings = (data.mealServings ?? []).filter(
    (serving) => serving.status === "prepared_inventory",
  );
  const preparedGroups = [
    ...new Set(preparedServings.map((serving) => serving.cookingSessionId)),
  ].map((sessionId) => ({
    sessionId,
    name: data.cookingOutcomes.find((outcome) => outcome.id === sessionId)?.mealName ?? "自煮熟食",
    servings: preparedServings.filter((serving) => serving.cookingSessionId === sessionId),
  }));

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
    ui.toast(`已將 ${urgent.length} 件即期食材加入自由搭配備料盤！`);
    navigate("recipes");
    window.history.replaceState(window.history.state, "", "/recipes?tab=compose");
  };

  const confirm = async (id: string) => {
    await api(`/inventory/${id}/confirm`, { method: "POST" });
    await refresh();
    ui.toast("已更新這批食材的確認時間");
  };

  const eatPreparedServing = async (id: string) => {
    await api(`/meal-servings/${id}/eat`, json("POST", { operationId: crypto.randomUUID() }));
    await refresh();
    ui.toast("熟食已記為吃完，獲得 10 EXP");
  };

  const openInCompose = (itemIds: string[]) => {
    addMultipleToTray(itemIds);
    navigate("recipes");
    window.history.replaceState(window.history.state, "", "/recipes?tab=compose");
  };

  return (
    <div className="fridge-page space-y-4 px-3 py-2 sm:px-4 sm:py-3">
      {/* 標題與新增食材按鈕 */}
      <div className="fridge-heading flex items-center justify-between pt-1">
        <div>
          <p className="eyebrow">FRIDGE INVENTORY</p>
          <h2>食材庫存</h2>
          <p className="fridge-subtitle">管理數量、存放位置與使用期限</p>
        </div>
        <button
          type="button"
          onClick={() => ui.open(addInventoryModalNode(ui.close))}
          className="fridge-add-btn"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
              優先使用可減少浪費
            </span>
          </div>
          <p className="text-[10px] text-stone-700 leading-relaxed">
            {urgent.map((i) => `${i.name}(剩${i.daysLeft}天)`).join("、")}{" "}
            即將過期，建議優先帶入自由搭配備料盤！
          </p>
          <button
            type="button"
            onClick={handleSendAllUrgent}
            className="urgent-btn flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs shadow-xs"
          >
            <span>一鍵將即期品帶入自由搭配備料盤</span>
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </section>
      )}

      {preparedGroups.length > 0 && (
        <section className="prepared-section space-y-2.5" aria-labelledby="prepared-heading">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9a442d]">
                已煮好 · 獨立餐份
              </p>
              <h3 id="prepared-heading" className="text-xs font-black text-stone-900">
                熟食庫存
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#9a442d]">
              {preparedServings.length} 份
            </span>
          </div>
          {preparedGroups.map((group) => (
            <article key={group.sessionId} className="prepared-card">
              <div>
                <h4 className="text-xs font-black text-stone-900">{group.name}</h4>
                <p className="text-[10px] text-stone-500">
                  剩 {group.servings.length} 份 · 不列入生鮮食材批次
                </p>
              </div>
              <button
                type="button"
                className="prepared-eat-btn"
                onClick={() => void eatPreparedServing(group.servings[0].id)}
              >
                吃掉一份
              </button>
            </article>
          ))}
        </section>
      )}

      <InventoryChamberSection
        title="冷藏室"
        detail="4°C"
        tone="cold"
        groups={coldGroups}
        empty="冷藏室目前無庫存食材，點擊右上角新增"
        isInTray={isInTray}
        onCompose={openInCompose}
        onConfirm={confirm}
        onRemove={remove}
      />
      <InventoryChamberSection
        title="冷凍庫"
        detail="-18°C"
        tone="frozen"
        groups={frozenGroups}
        empty="冷凍庫目前無庫存食材"
        isInTray={isInTray}
        onCompose={openInCompose}
        onConfirm={confirm}
        onRemove={remove}
      />
      <InventoryChamberSection
        title="常溫櫃"
        detail="乾燥避光"
        tone="pantry"
        groups={pantryGroups}
        empty="常溫櫃目前無庫存食材"
        isInTray={isInTray}
        onCompose={openInCompose}
        onConfirm={confirm}
        onRemove={remove}
      />

      {/* 食安與延展保存中心 */}
      {urgent.length > 0 && (
        <section className="rescue-center space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-amber-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h3 className="text-xs font-black text-stone-900">食安與延展保存中心</h3>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">POST /inventory/:id/rescue</span>
          </div>
          <p className="text-[10px] text-stone-600 leading-relaxed">
            今天吃不完？點選即期食材執行「分裝冷凍」延長 14 天保存期，或檢核氣味進行過期處置。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {urgent.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200"
              >
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

function InventoryChamberSection({
  title,
  detail,
  tone,
  groups,
  empty,
  isInTray,
  onCompose,
  onConfirm,
  onRemove,
}: {
  title: string;
  detail: string;
  tone: "cold" | "frozen" | "pantry";
  groups: InventoryGroup[];
  empty: string;
  isInTray: (id: string) => boolean;
  onCompose: (ids: string[]) => void;
  onConfirm: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const batchCount = groups.reduce((sum, group) => sum + group.batches.length, 0);
  return (
    <section className={`${tone}-chamber inventory-chamber space-y-2.5`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="chamber-accordion-toggle"
        aria-expanded={isOpen}
        aria-label={`${title}（點擊${isOpen ? "收合" : "展開"}）`}
      >
        <div className="flex items-center gap-2">
          <ChamberIcon tone={tone} />
          <div>
            <h3 className="text-xs font-black chamber-title">{title}</h3>
            <p className="text-[9px] font-bold chamber-subtitle">{detail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold chamber-title">
            {groups.length} 種 · {batchCount} 批
          </span>
          <svg
            className={`w-3.5 h-3.5 chamber-title transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {isOpen &&
        (groups.length === 0 ? (
          <div className="inventory-empty">{empty}</div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => {
              const allInTray = group.batches.every((batch) => isInTray(batch.id));
              return (
                <details key={group.key} className="ingredient-item-card inventory-ledger">
                  <summary>
                    <div className="inventory-summary-main">
                      <div className="ingredient-icon-shell">
                        <IngredientIcon name={group.name} size={22} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-black text-stone-900">
                          {group.name}{" "}
                          <span className="font-normal text-stone-500">
                            {group.qty} {group.unit}
                          </span>
                        </h4>
                        <p className="inventory-status-line">
                          {expiryLabel(group.daysLeft)} · {group.batches.length} 批次
                        </p>
                        <div className="inventory-tags">
                          {group.staleBatchCount > 0 && (
                            <span className="inventory-tag is-stale">
                              {group.staleBatchCount} 批待確認
                            </span>
                          )}
                          {group.unpricedBatchCount > 0 && (
                            <span className="inventory-tag is-unpriced">
                              {group.unpricedBatchCount} 批未記錄成本
                            </span>
                          )}
                          {group.estimatedValue > 0 && (
                            <span className="inventory-tag">
                              已記錄 NT${Math.round(group.estimatedValue)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="ledger-toggle">批次</span>
                  </summary>
                  <div className="batch-ledger">
                    {group.batches.map((batch, index) => {
                      const stale = needsInventoryConfirmation(batch);
                      return (
                        <article key={batch.id} className="batch-row">
                          <div className="batch-sequence">
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <i />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <strong>
                                {batch.qty} {batch.unit}
                              </strong>
                              {index === 0 && <span className="fifo-tag">先用這批</span>}
                              {stale && <span className="stale-tag">待確認</span>}
                            </div>
                            <p>
                              購入 {formatDate(batch.addedDate)} · 期限{" "}
                              {batch.expiresOn ? formatDate(batch.expiresOn) : "待補"}
                            </p>
                            <p>
                              最後確認 {formatDate(batch.lastConfirmedAt)} ·{" "}
                              {batch.estimatedValue > 0
                                ? `NT$${Math.round(batch.estimatedValue)}`
                                : "未記錄成本"}
                            </p>
                          </div>
                          <div className="batch-actions">
                            {stale && (
                              <button type="button" onClick={() => void onConfirm(batch.id)}>
                                確認仍在庫
                              </button>
                            )}
                            <button
                              type="button"
                              className="danger"
                              onClick={() => void onRemove(batch.id)}
                            >
                              移除
                            </button>
                          </div>
                        </article>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => onCompose(group.batches.map((batch) => batch.id))}
                      className={`compose-group-btn ${allInTray ? "is-active" : ""}`}
                    >
                      {allInTray ? "打開自由搭配 →" : "整組帶入自由搭配 →"}
                    </button>
                  </div>
                </details>
              );
            })}
          </div>
        ))}
    </section>
  );
}

function ChamberIcon({ tone }: { tone: "cold" | "frozen" | "pantry" }) {
  if (tone === "pantry")
    return (
      <svg
        className="chamber-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 7h16v13H4z" />
        <path d="M7 4h10l3 3H4z" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    );
  return (
    <svg
      className="chamber-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M19.1 4.9 4.9 19.1" />
      {tone === "frozen" && <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}

function expiryLabel(daysLeft: number) {
  return daysLeft <= 0 ? "今天到期" : daysLeft === 1 ? "明天到期" : `最近期限剩 ${daysLeft} 天`;
}
function formatDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00+08:00` : value);
  return Number.isNaN(date.getTime())
    ? "待確認"
    : new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric" }).format(date);
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
    await api(`/inventory/${item.id}/rescue`, json("POST", { action, foodSafe: safe }));
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
