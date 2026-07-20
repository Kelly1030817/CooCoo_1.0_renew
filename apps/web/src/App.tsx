import { useState } from "react";
import { useAppState } from "@/entities/app-state/model";
import { Header } from "@/widgets/app-shell/Header";
import { BottomNav } from "@/widgets/app-shell/BottomNav";
import type { TabId } from "@/widgets/app-shell/types";
import { RoiPage } from "@/pages/roi/RoiPage";
import { FridgePage } from "@/pages/fridge/FridgePage";
import { KitchenPage } from "@/pages/kitchen/KitchenPage";
import { ShoppingPage } from "@/pages/shopping/ShoppingPage";

const pages = {
  roi: RoiPage,
  fridge: FridgePage,
  kitchen: KitchenPage,
  shopping: ShoppingPage,
};
export default function App() {
  const [active, setActive] = useState<TabId>("roi");
  const { data, isLoading, error } = useAppState();
  const Page = pages[active];
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1200px] min-w-0 flex-1 px-md py-md transition-all duration-300 md:px-lg md:py-lg">
        {isLoading ? (
          <div className="py-xl text-center text-sm font-bold text-on-surface-variant">
            載入 CooCoo 中…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl bg-error-container p-lg text-sm font-bold text-on-error-container"
          >
            資料載入失敗：{error.message}
          </div>
        ) : (
          <Page />
        )}
      </main>
      <BottomNav
        active={active}
        onChange={(tab) => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setActive(tab);
        }}
        urgent={data?.inventory.filter((i) => i.daysLeft <= 1).length || 0}
        shopping={data?.shoppingItems.filter((i) => !i.checked).length || 0}
      />
    </>
  );
}
