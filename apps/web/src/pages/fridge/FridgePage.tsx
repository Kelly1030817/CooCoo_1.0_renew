import * as React from "react";
import { useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRescuePlan } from "@coocoo/core";
import type { InventoryItem } from "@coocoo/contracts";
import { UiContext } from "@/app/ui-context";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api, json } from "@/shared/api/client";
import {
  AddInventoryModal,
  FridgeSetupModal,
} from "@/features/inventory/InventoryModals";
import { Modal, ModalHeader } from "@/shared/ui/Modal";

export function FridgePage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const query = useQueryClient();
  if (!data) return null;
  const sorted = [...data.inventory].sort((a, b) => a.daysLeft - b.daysLeft);
  const urgent = sorted.filter((i) => i.daysLeft <= 1);
  const rescue = sorted.filter((i) => i.chamber === "cold" && i.daysLeft <= 3);
  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });
  const remove = async (id: string) => {
    await api(`/inventory/${id}`, { method: "DELETE" });
    await refresh();
    ui.toast("食材已從冰箱移除");
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
          ui.toast(action === "preserve" ? "已完成轉化保存" : "冰箱庫存已同步");
        }}
      />,
    );
  return (
    <div className="space-y-lg">
      <section
        onClick={() => ui.open(<FridgeSetupModal onClose={ui.close} />)}
        className="mb-lg flex cursor-pointer flex-col items-center justify-between gap-md rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-md transition-colors hover:bg-surface-container sm:flex-row"
      >
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-full bg-white text-outline shadow-sm">
              kitchen
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-slate-blue">
                {data.fridgeProfile.isConfigured
                  ? `${data.fridgeProfile.brand} ${data.fridgeProfile.model}`
                  : "尚未設定冰箱容量"}
              </h4>
              <p className="mt-0.5 text-[10px] text-on-surface-variant">
                {data.fridgeProfile.isConfigured
                  ? `${data.fridgeProfile.capacityLiters}L · AI 容量把關已開啟`
                  : "設定後 AI 將為您把關庫存避免爆倉"}
              </p>
            </div>
          </div>
          <button
            className="whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm"
          >
            {data.fridgeProfile.isConfigured ? "調整" : "開始設定"}
          </button>
      </section>
      <section className="flex flex-col items-start justify-between gap-md sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-primary">冰箱沙漏</h2>
          <p className="text-on-surface-variant">
            隨時掌控保鮮期限，消滅食物浪費支出。
          </p>
        </div>
        <button
          onClick={() => ui.open(<AddInventoryModal onClose={ui.close} />)}
          className="flex items-center gap-1 rounded-full bg-primary px-lg py-sm text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
        >
          <span className="material-symbols-outlined mr-1 align-middle">
            add
          </span>
          新增食材
        </button>
      </section>
      {urgent.length > 0 && (
        <section className="flex items-center justify-between rounded-2xl bg-rust-orange p-md text-white shadow-md">
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined hidden animate-bounce rounded-full bg-white/20 p-2 sm:block">hourglass_empty</span>
            <div><h2 className="text-base font-extrabold leading-tight">食材警報：{urgent.length} 件即將到期</h2>
            <p className="text-xs font-medium opacity-90">這些食材預計將在 24 小時內浪費，建議今天優先料理！</p></div>
          </div>
          <a href="#rescue" className="whitespace-nowrap rounded-xl bg-white px-md py-sm text-xs font-bold text-rust-orange shadow-sm">開始救援</a>
        </section>
      )}
      <section className="grid grid-cols-1 gap-lg lg:grid-cols-2">
      {(["cold", "frozen"] as const).map((chamber) => (
        <div
          key={chamber}
          className="flex min-h-[400px] flex-col rounded-3xl border-4 border-slate-blue bg-white p-md shadow-xl"
        >
          <div className="mb-md flex items-center justify-between border-b border-surface-container-high pb-2">
            <h3 className="text-lg font-extrabold text-slate-blue">
              <span
                className="material-symbols-outlined mr-2 align-middle font-bold text-slate-blue"
              >
                {chamber === "frozen" ? "severe_cold" : "ac_unit"}
              </span>
              {chamber === "frozen" ? "冷凍庫" : "冷藏室"}
            </h3>
            <span className="rounded-full bg-slate-blue/10 px-3 py-1 text-xs font-bold text-slate-blue">
              {chamber === "frozen" ? "-18°C 穩定" : "4°C 穩定"}
            </span>
          </div>
          <div
            className="grid grid-cols-2 gap-md sm:grid-cols-3"
          >
            {sorted
              .filter((i) => i.chamber === chamber)
              .map((item) => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  onCook={() => act(item, "eat")}
                  onDelete={() => remove(item.id)}
                />
              ))}
          </div>
        </div>
      ))}
      </section>
      <section
        id="rescue"
        className="rounded-3xl border border-primary/10 bg-white p-lg shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-blue">
              <span className="material-symbols-outlined mr-2 align-middle text-rust-orange">
                emergency
              </span>
              救援決策中心
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              今天吃掉，或現在處理、以後再吃。每一步都會同步庫存。
            </p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-outline">
              本輪可避免浪費
            </span>
            <strong className="text-primary">
              NT$ {rescue.reduce((sum, i) => sum + i.roi.savings, 0)}
            </strong>
          </div>
        </div>
        <div className="mt-md space-y-md">
          {rescue.map((item) => {
            const plan = getRescuePlan(item);
            return (
              <article
                key={item.id}
                className="rounded-2xl bg-surface-container-low p-md"
              >
                <div className="flex items-center gap-sm">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-blue">
                      {item.name} {item.qty}
                      {item.unit}
                    </h4>
                    <span className="text-[10px] text-outline">
                      {item.daysLeft === 0
                        ? "今天到期"
                        : `剩 ${item.daysLeft} 天`}{" "}
                      · 預估可救回 NT$ {item.roi.savings}
                    </span>
                  </div>
                  <button
                    onClick={() => act(item, "discard")}
                    className="ml-auto text-[10px] font-bold text-error"
                  >
                    確認不安全／丟棄
                  </button>
                </div>
                <div className="mt-sm grid grid-cols-1 gap-sm sm:grid-cols-2">
                  <button
                    onClick={() => act(item, "eat")}
                    className="rounded-xl border border-secondary/25 bg-white p-sm text-left"
                  >
                    <span className="text-[10px] font-extrabold text-secondary">
                      A｜今天直接吃掉
                    </span>
                    <strong className="block text-xs text-slate-blue">
                      {plan.eatNow.title}
                    </strong>
                    <p className="text-[10px] text-outline">
                      {plan.eatNow.minutes} 分鐘 · 完成後扣除{" "}
                      {plan.eatNow.quantity} {item.unit}
                    </p>
                  </button>
                  <button
                    onClick={() => act(item, "preserve")}
                    className="rounded-xl border border-slate-blue/20 bg-white p-sm text-left"
                  >
                    <span className="text-[10px] font-extrabold text-slate-blue">
                      B｜轉化保存
                    </span>
                    <strong className="block text-xs text-slate-blue">
                      {plan.preserve.title}
                    </strong>
                    <p className="text-[10px] text-outline">
                      產生 {plan.preserve.packages} 包 · 冷凍{" "}
                      {plan.preserve.days} 天
                    </p>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function InventoryCard({
  item,
  onCook,
  onDelete,
}: {
  item: InventoryItem;
  onCook: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={`relative flex cursor-pointer flex-col items-center justify-between rounded-2xl border-2 p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg ${item.daysLeft <= 1 ? "border-rust-orange bg-rust-orange/5" : item.daysLeft <= 3 ? "border-ochre-gold bg-ochre-gold/10" : "border-secondary/30 bg-secondary/5"}`}>
      <span className="absolute right-2 top-2 rounded-full border border-slate-blue/10 bg-slate-blue/10 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-blue">
        盒:{item.boxSize}
      </span>
      <div className="mb-2 h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-outline-variant/20 bg-white shadow-inner"><img src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>
      <h4 className="w-full truncate text-sm font-extrabold text-slate-blue">
        {item.name} ({item.qty}
        {item.unit})
      </h4>
      <p
        className={`mt-0.5 text-[11px] font-extrabold ${item.daysLeft <= 1 ? "text-rust-orange" : item.daysLeft <= 3 ? "text-tertiary" : "text-secondary"}`}
      >
        {item.daysLeft === 0
          ? "今天到期"
          : item.daysLeft > 30
            ? `剩餘 ${Math.round(item.daysLeft / 30)} 個月`
            : `剩餘 ${item.daysLeft} 天`}
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-on-surface-variant">購入: {item.addedDate}</p>
      <div className="mt-3 flex w-full gap-2 border-t border-outline-variant/20 pt-2">
        <button
          onClick={onCook}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-secondary py-1.5 text-[10px] font-bold text-white"
        >
          <span className="material-symbols-outlined align-middle text-sm">
            restaurant
          </span>{" "}
          完成料理
        </button>
        <button
          onClick={onDelete}
          aria-label={`刪除${item.name}`}
          className="flex items-center justify-center rounded-lg bg-surface-container-high px-2.5 text-on-surface"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </article>
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
  const [safe, setSafe] = React.useState(action !== "discard");
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
        title={action === "discard" ? "確認丟棄" : "食品安全閘門"}
        kicker={item.name}
        onClose={onClose}
      />
      <div className="rounded-2xl bg-rust-orange/10 p-md text-xs leading-5 text-on-surface-variant">
        若食材有異味、黏液、發霉或不確定保存溫度，請不要勉強食用。
      </div>
      {action !== "discard" && (
        <label className="mt-md flex items-start gap-sm text-xs font-bold text-slate-blue">
          <input
            type="checkbox"
            checked={safe}
            onChange={(e) => setSafe(e.target.checked)}
            className="mt-1"
          />
          我已確認外觀、氣味與保存狀況皆正常
        </label>
      )}
      <div className="mt-lg flex gap-sm">
        <button onClick={onClose} className="secondary-btn flex-1">
          取消
        </button>
        <button
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
