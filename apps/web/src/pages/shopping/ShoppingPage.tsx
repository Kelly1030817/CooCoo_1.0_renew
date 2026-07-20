import { useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ShoppingItem } from "@coocoo/contracts";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { api, json } from "@/shared/api/client";
import {
  AddShoppingModal,
  InvoiceModal,
  ShoppingAssistantModal,
  VoiceInputModal,
} from "@/features/shopping/ShoppingModals";

export function ShoppingPage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const query = useQueryClient();
  if (!data) return null;
  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });
  const save = async (item: ShoppingItem, patch: Partial<ShoppingItem>) => {
    await api(
      `/shopping-items/${item.id}`,
      json("PATCH", { ...item, ...patch }),
    );
    await refresh();
  };
  const remove = async (id: string) => {
    await api(`/shopping-items/${id}`, { method: "DELETE" });
    await refresh();
  };
  const checked = data.shoppingItems.filter((i) => i.checked);
  const restock = async () => {
    if (!checked.length) return ui.toast("請先勾選要補貨的食材", "warning");
    const result = await api<{ count: number }>("/shopping/restock", {
      method: "POST",
    });
    await refresh();
    ui.toast(`成功補貨 ${result.count} 項並更新冰箱`);
  };
  const grouped = (category: "produce" | "protein") =>
    data.shoppingItems.filter((i) => i.category === category);
  return (
    <div className="space-y-lg">
      <section className="flex flex-col justify-between gap-sm sm:flex-row sm:items-center">
        <h2 className="text-3xl font-extrabold text-primary">小廚房採購單</h2>
        <div className="flex flex-wrap gap-xs">
          <button
            onClick={() =>
              ui.open(<ShoppingAssistantModal onClose={ui.close} />)
            }
            className="rounded-full bg-secondary px-3 py-2 text-xs font-extrabold text-white"
          >
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              forum
            </span>
            AI 陪我逛
          </button>
          <button
            onClick={() => ui.open(<InvoiceModal onClose={ui.close} />)}
            aria-label="掃描發票"
            className="rounded-full bg-surface-container p-2 text-primary"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </button>
          <button
            onClick={() => ui.open(<VoiceInputModal onClose={ui.close} />)}
            aria-label="語音輸入"
            className="rounded-full bg-surface-container p-2 text-primary"
          >
            <span className="material-symbols-outlined">mic</span>
          </button>
          <button
            onClick={() => ui.open(<AddShoppingModal onClose={ui.close} />)}
            className="primary-btn"
          >
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              add
            </span>
            手動新增
          </button>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low p-lg">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-blue">
            <span className="material-symbols-outlined text-secondary">
              format_list_bulleted
            </span>
            採買清單
          </h3>
          <button
            onClick={async () => {
              for (const item of data.shoppingItems)
                await save(item, {
                  checked: !data.shoppingItems.every((i) => i.checked),
                });
            }}
            className="rounded-xl bg-slate-blue px-4 py-1.5 text-xs font-extrabold text-white"
          >
            <span className="material-symbols-outlined align-middle text-sm">
              check_box_outline_blank
            </span>{" "}
            全選
          </button>
        </header>
        <div className="matrix-grid space-y-md p-md">
          {(
            [
              ["produce", "eco", "新鮮蔬果"],
              ["protein", "egg", "蛋白質與乳製品"],
            ] as const
          ).map(([category, icon, label]) => (
            <div key={category}>
              <div className="mb-sm inline-flex items-center gap-xs rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-[11px] font-extrabold text-secondary">
                <span className="material-symbols-outlined text-[13px]">
                  {icon}
                </span>
                {label}
              </div>
              <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-white">
                <table className="w-full min-w-[620px] table-fixed border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 text-xs font-extrabold text-slate-blue">
                      <th className="w-[8%] p-3 text-center">勾選</th>
                      <th className="w-[28%] p-3">食材名稱</th>
                      <th className="w-[16%] p-3">數量單位</th>
                      <th className="w-[20%] p-3">分類</th>
                      <th className="w-[14%] p-3 text-right">
                        預估金額 / 狀態
                      </th>
                      <th className="w-[7%] p-3 text-center">編輯</th>
                      <th className="w-[7%] p-3 text-center">刪除</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {grouped(category).map((item) => (
                      <ShoppingRow
                        key={item.id}
                        item={item}
                        onCheck={() => save(item, { checked: !item.checked })}
                        onDelete={() => remove(item.id)}
                        onEdit={() =>
                          ui.open(
                            <AddShoppingModal item={item} onClose={ui.close} />,
                          )
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="px-lg pb-md">
          <div className="flex flex-col justify-between gap-md rounded-2xl border border-secondary/30 bg-secondary/10 p-md text-xs text-secondary sm:flex-row sm:items-center">
            <div className="flex items-start gap-md">
              <span className="material-symbols-outlined text-xl">
                restaurant
              </span>
              <div>
                <strong className="text-sm">精益健康指南</strong>
                <p className="font-bold leading-relaxed text-on-surface-variant">
                  每週建議備齊 <b className="text-xl text-primary">5</b> 種蔬菜
                  ＋ <b className="text-xl text-primary">3</b>{" "}
                  種優質蛋白與乳品。
                  <br />
                  交給 AI 大廚魔術搭配，營養全照顧！
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-secondary/20 p-sm text-[13px] font-black">
              <div>蔬菜: {grouped("produce").length}</div>
              <div>蛋白質: {grouped("protein").length}</div>
            </div>
          </div>
        </div>
        <footer className="flex flex-col items-center justify-between gap-md border-t border-outline-variant/20 bg-surface-container-low p-lg sm:flex-row">
          <div>
            <span className="text-xs font-bold text-on-surface-variant">
              已勾選 {checked.length} 項，預估總額：
            </span>
            <strong className="ml-1 text-2xl text-slate-blue">
              ${checked.reduce((sum, i) => sum + i.estCost, 0)}
            </strong>
            <span className="text-[10px] text-outline"> TWD</span>
          </div>
          <button
            onClick={restock}
            className="rounded-xl bg-primary px-6 py-2.5 text-xs font-extrabold text-white"
          >
            <span className="material-symbols-outlined align-middle text-sm">
              check_circle
            </span>{" "}
            確認補貨並更新冰箱
          </button>
        </footer>
      </section>
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <MarketCard
          title="鄰近有機市集"
          note="每週日上午 08:00 - 17:00 開市"
          image="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80"
        />
        <MarketCard
          title="全台傳統菜市場"
          note="包含熱鬧早市與溫馨黃昏市場"
          image="/taiwan_traditional_market.jpg"
        />
      </div>
    </div>
  );
}
function ShoppingRow({
  item,
  onCheck,
  onDelete,
  onEdit,
}: {
  item: ShoppingItem;
  onCheck: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <tr className="text-xs text-on-surface-variant">
      <td className="p-3 text-center">
        <input type="checkbox" checked={item.checked} onChange={onCheck} />
      </td>
      <td className="p-3 font-extrabold text-slate-blue">{item.name}</td>
      <td className="p-3">
        {item.qty} {item.unit}
      </td>
      <td className="p-3">
        {item.category === "produce" ? "新鮮蔬果" : "蛋白質與乳製品"}
      </td>
      <td className="p-3 text-right font-bold">${item.estCost}</td>
      <td className="p-3 text-center">
        <button onClick={onEdit}>
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
      </td>
      <td className="p-3 text-center">
        <button onClick={onDelete}>
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </td>
    </tr>
  );
}
function MarketCard({
  title,
  note,
  image,
}: {
  title: string;
  note: string;
  image: string;
}) {
  return (
    <div className="group relative h-56 overflow-hidden rounded-2xl border border-primary/5 shadow-lg">
      <img
        src={image}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-md">
        <strong className="text-white">{title}</strong>
        <p className="mt-1 text-[11px] font-semibold text-white/80">{note}</p>
      </div>
    </div>
  );
}
