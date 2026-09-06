import { RecipeCatalogPanel } from "@/features/recipes/RecipeCatalogPanel";
import { useContext, useState } from "react";
import type { InventoryItem, Recipe } from "@coocoo/contracts";
import { useAppState } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { RecipeModal } from "@/features/cooking/RecipeModal";

const styles = [
  "無特定風格 (AI 自由發揮)",
  "台式家常",
  "日式和風",
  "西式排餐",
  "低卡健康",
];
export function KitchenPage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const [style, setStyle] = useState(styles[0]);
  const [selected, setSelected] = useState<string[]>([]);
  if (!data) return null;
  const toggle = (id: string) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id],
    );
  const open = () =>
    ui.open(
      <RecipeModal
        ingredientIds={selected}
        style={style}
        onClose={ui.close}
        onComplete={() => setSelected([])}
      />,
    );
  return (
    <div className="space-y-lg pb-32">
      <RecipeCatalogPanel/>
      <section>
        <h2 className="flex items-center gap-2 text-3xl font-extrabold text-primary">
          <span className="material-symbols-outlined text-4xl">blender</span>
          小廚房
        </h2>
        <p className="mt-xs text-on-surface-variant">
          選擇您的料理風格與現有食材，AI 立即為您客製專屬食譜。
        </p>
      </section>
      <section>
        <h3 className="mb-sm text-sm font-extrabold text-slate-blue">
          1. 選擇料理風格
        </h3>
        <div className="custom-scrollbar flex gap-sm overflow-x-auto pb-2">
          {styles.map((item) => (
            <button
              key={item}
              onClick={() => setStyle(item)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all ${style === item ? "scale-105 border-secondary bg-secondary text-white shadow-md" : "border-outline-variant/30 bg-surface-container text-on-surface-variant"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-sm flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-blue">
            2. 挑選冰箱食材
          </h3>
          <span className="text-xs font-bold text-outline">
            已選取 {selected.length} 項
          </span>
        </div>
        {data.inventory.length === 0 ? (
          <div className="rounded-3xl bg-surface-container p-xl text-center">
            <span className="material-symbols-outlined text-[64px] text-outline-variant">
              kitchen
            </span>
            <h4 className="text-lg font-bold text-on-surface-variant">
              冰箱空空如也
            </h4>
            <p className="mt-2 text-xs text-outline">
              請先到「冰箱沙漏」新增食材
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-md sm:grid-cols-3 md:grid-cols-4">
            {data.inventory.map((item) => (
              <IngredientCard
                key={item.id}
                item={item}
                selected={selected.includes(item.id)}
                onClick={() => toggle(item.id)}
              />
            ))}
          </div>
        )}
      </section>
      <div className="glass-effect fixed bottom-20 left-4 right-4 z-40 flex items-center justify-between gap-md rounded-2xl border border-ochre-gold/30 bg-slate-blue p-md text-white shadow-2xl md:left-1/2 md:right-auto md:w-[600px] md:-translate-x-1/2">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-ochre-gold">
            auto_awesome
          </span>
          <div>
            <h4 className="text-sm font-extrabold text-ochre-gold">
              AI 備菜中
            </h4>
            <p className="text-xs text-oatmeal-sand/80">
              已選{" "}
              <span className="text-sm font-extrabold text-white underline">
                {selected.length}
              </span>{" "}
              項 ‧ {style}
            </p>
          </div>
        </div>
        <button
          disabled={!selected.length}
          onClick={open}
          className="rounded-xl bg-terracotta px-lg py-2.5 text-xs font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined align-middle text-base">
            bolt
          </span>{" "}
          生成食譜
        </button>
      </div>
    </div>
  );
}
function IngredientCard({
  item,
  selected,
  onClick,
}: {
  item: InventoryItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-2xl border-2 p-3 text-center shadow-sm transition-all ${selected ? "border-secondary bg-secondary/10 ring-4 ring-secondary/10" : item.daysLeft <= 1 ? "border-rust-orange bg-rust-orange/5" : item.daysLeft <= 3 ? "border-ochre-gold bg-ochre-gold/10" : "border-secondary/30 bg-secondary/5"}`}
    >
      <span className="absolute right-2 top-2 rounded-full bg-surface-container px-2 py-0.5 text-[9px] font-bold">
        盒:{item.boxSize}
      </span>
      <div className="mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-outline-variant/20 bg-white shadow-inner"><img src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>
      <h4 className="w-full truncate text-sm font-extrabold text-slate-blue">
        {item.name} ({item.qty}
        {item.unit})
      </h4>
      <p
        className={`mt-0.5 text-[11px] font-extrabold ${item.daysLeft <= 1 ? "text-rust-orange" : item.daysLeft <= 3 ? "text-tertiary" : "text-secondary"}`}
      >
        {item.daysLeft === 0 ? "今天到期" : `剩餘 ${item.daysLeft} 天`}
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-on-surface-variant">購入: {item.addedDate}</p>
      <span
        className={`mt-3 block w-full border-t border-outline-variant/20 pt-2 text-[11px] font-bold ${selected ? "text-secondary" : "text-on-surface-variant"}`}
      >
        <span className="material-symbols-outlined align-middle text-sm">
          {selected ? "check_box" : "check_box_outline_blank"}
        </span>{" "}
        {selected ? "已選取" : "點擊選取"}
      </span>
    </button>
  );
}
export type RecipeModalProps = {
  ingredientIds: string[];
  style: string;
  onClose: () => void;
  initialRecipe?: Recipe;
};
