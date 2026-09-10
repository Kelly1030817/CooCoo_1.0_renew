import { useState, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RecipePackage, TodayDecision, RecipeRecommendations } from "@coocoo/contracts";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { RecipeModal, RecipePackageModal } from "@/features/cooking/RecipeModal";
import { IngredientIcon } from "@/shared/ui/IngredientIcon";
import { usePrepTray } from "@/features/kitchen/prep-tray";
import { api, json } from "@/shared/api/client";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { CatalogAdminModal } from "@/features/recipes/CatalogAdminModal";
import "./KitchenPage.css";

const STYLES = [
  "AI 自由發揮",
  "台式家常",
  "日式和風",
  "低卡健康",
  "一鍋到底免洗",
];

const DEFAULT_COOKWARE_LIST = [
  "不沾平底鍋",
  "電鍋",
  "微波爐",
  "氣炸鍋",
  "單柄小湯鍋",
  "小烤箱",
  "電磁爐",
  "快煮壺",
];

const taipeiDate = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export function KitchenPage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const queryClient = useQueryClient();
  const [style, setStyle] = useState(STYLES[0]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { prepIds, addToTray, removeFromTray, clearTray } = usePrepTray();
  const [isCookwareModalOpen, setIsCookwareModalOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<"today" | "freestyle">("today");
  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({});
  const [isCatalogDrawerOpen, setIsCatalogDrawerOpen] = useState(false);

  // Fetch today's decision to check if there is an active planned meal
  const today = taipeiDate();
  const todayDecisionQuery = useQuery({
    queryKey: ["meal-decision-today", today],
    queryFn: () =>
      api<TodayDecision>(`/meal-decisions/today?date=${today}&energy=normal`).catch(
        () => null,
      ),
  });

  // Fetch catalog recommendations for the collapsed drawer
  const catalogQuery = useQuery({
    queryKey: ["catalog-recommendations-lite"],
    queryFn: () =>
      api<RecipeRecommendations>("/recipes/recommendations", json("POST", {
        mode: "inventory_only",
        purchaseBudget: 100,
        allowRepeat: false,
      })).catch(() => null),
    enabled: isCatalogDrawerOpen,
  });

  // Check if current user has owner role for recipe catalog administration
  const access = useQuery({
    queryKey: ["catalog-access", data?.session.user?.id],
    queryFn: () => api<{ owner: boolean }>("/admin/recipes/access"),
    enabled: Boolean(data?.session.user),
  });
  const isOwner = Boolean(access.data?.owner);

  if (!data) return null;

  const todayRecipe = todayDecisionQuery.data?.primary;

  // Filter actual prepped items from real database inventory
  const preppedItems = data.inventory.filter((item) => prepIds.includes(item.id));
  const availableItems = data.inventory
    .filter((item) => !prepIds.includes(item.id))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // User's owned cookware from app state
  const ownedCookware = data.cookware.map((item) => item.name || item.type);

  // Toggle meal cookware selection
  const toggleToolSelection = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  // Toggle prep checklist
  const toggleChecklistItem = (key: string) => {
    setPrepChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Start cooking freestyle recipe (AI generation)
  const handleStartFreestyleCooking = () => {
    if (preppedItems.length === 0) {
      ui.toast("請先在備料盤選取至少 1 項食材！");
      return;
    }

    const effectiveCookware =
      selectedTools.length > 0 ? selectedTools.join("、") : "全部設備";
    const effectiveStyle = `${style} (指定設備：${effectiveCookware})`;

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

  // Start today's planned recipe
  const handleStartTodayRecipe = (recipe: RecipePackage) => {
    ui.open(
      <RecipePackageModal
        recipePackage={recipe}
        ingredientIds={recipe.ingredients.map((i) => i.ingredientKey)}
        onClose={ui.close}
        onComplete={() => {
          ui.toast("今日餐券料理完賽！已扣除庫存並累積圓夢基金。");
        }}
      />,
    );
  };

  return (
    <div className="kitchen-page space-y-4 px-3 py-2 sm:px-4 sm:py-3">
      {/* 頂部工作台標題列 */}
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-[#2a9d8f]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-stone-900">小廚房</h2>
              <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-[#92400e]">
                料理流理台
              </span>
            </div>
            <p className="text-[10px] text-stone-500">實體備料切菜 · 設備就緒 · 開火出餐</p>
          </div>
        </div>

        {/* 廚具管理按鈕（打通 Today 跳轉死胡同） */}
        <button
          type="button"
          onClick={() => setIsCookwareModalOpen(true)}
          className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-700 shadow-2xs hover:bg-stone-50"
        >
          <span className="material-symbols-outlined text-xs text-[#2a9d8f]">countertops</span>
          <span>自備 <strong className="font-black text-[#2a9d8f]">{ownedCookware.length}</strong> 項</span>
        </button>
      </header>

      {/* ==================== 區塊 A：承接今日排定餐點 (MISE EN PLACE BOARD) ==================== */}
      {todayRecipe && activeWorkflow === "today" ? (
        <section className="space-y-3">
          {/* 今日出餐看板抬頭 */}
          <div className="flex items-center justify-between rounded-2xl bg-[#264653] p-3 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-amber-400">
                  ACTIVE COOKING ORDER
                </span>
                <h3 className="text-sm font-black text-white">{todayRecipe.title}</h3>
                <span className="text-[10px] text-stone-300">
                  {todayRecipe.steps.length} 步驟 · 約 {todayRecipe.totalMinutes} 分鐘
                </span>
              </div>
            </div>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-300">
              今日餐券就緒
            </span>
          </div>

          {/* 砧板實體備料盤 (Mise en Place Board) */}
          <div className="prep-tray-card space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e0f2f1] text-[10px] font-black text-[#2a9d8f]">
                  砧
                </span>
                <h4 className="text-xs font-black text-stone-900">
                  砧板備料處理盤（動工前檢核）
                </h4>
              </div>
              <span className="text-[10px] font-bold text-[#2a9d8f]">
                {todayRecipe.ingredients.length} 項食材就位
              </span>
            </div>
            <p className="text-[10px] text-stone-500">
              帶有前置處理指引，點擊卡片標註洗切準備進度：
            </p>

            <div className="space-y-1.5">
              {todayRecipe.ingredients.map((ing) => {
                const isChecked = Boolean(prepChecklist[ing.ingredientKey]);
                const matchedInv = data.inventory.find(
                  (i) =>
                    i.name.includes(ing.name) ||
                    ing.name.includes(i.name) ||
                    i.id === ing.ingredientKey,
                );
                const isUrgent = matchedInv && matchedInv.daysLeft <= 3;

                return (
                  <div
                    key={ing.ingredientKey}
                    onClick={() => toggleChecklistItem(ing.ingredientKey)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all ${
                      isChecked
                        ? "border-emerald-300 bg-emerald-50/60"
                        : "border-stone-200 bg-white hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center">
                        <IngredientIcon name={ing.name} size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-stone-900">
                          {ing.name}{" "}
                          <span className="text-[11px] font-normal text-stone-500">
                            {ing.quantity} {ing.unit}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <span className="rounded border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[9px] font-extrabold text-[#ea580c]">
                          剩 {matchedInv.daysLeft} 天即期
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black transition-all ${
                          isChecked
                            ? "bg-emerald-600 text-white"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {isChecked ? "✓ 已備妥" : "待處理"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 灶台設備就緒檢核燈 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-stone-700">
                灶台設備待命檢核：
              </span>
              <span className="text-[9px] text-stone-400">依菜色需求指派</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {todayRecipe.cookwareTypes.map((cw) => (
                <div
                  key={cw}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-2.5 py-1 text-xs"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <strong className="text-stone-900">{cw}</strong>
                  <span className="text-[9px] font-bold text-emerald-700">就緒</span>
                </div>
              ))}
            </div>
          </div>

          {/* 開火動工大按鈕（直通 STEP 01） */}
          <button
            type="button"
            onClick={() => handleStartTodayRecipe(todayRecipe)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ea580c] py-3 text-xs font-black text-white shadow-md transition-all hover:bg-[#d94e08] active:scale-95"
          >
            <span className="material-symbols-outlined text-base">local_fire_department</span>
            <span>開火動工！進入 STEP 01</span>
          </button>

          {/* 切換至自由工作台按鈕 */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setActiveWorkflow("freestyle")}
              className="text-[10px] font-bold text-[#2a9d8f] hover:underline"
            >
              或使用其他食材自由配菜出餐？展開自由工作台 ↓
            </button>
          </div>
        </section>
      ) : null}

      {/* ==================== 區塊 B：自由備料出餐工作台 (FREESTYLE WORKBENCH) ==================== */}
      {(!todayRecipe || activeWorkflow === "freestyle") && (
        <div className="space-y-4">
          {todayRecipe && (
            <div className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-200 p-2 text-xs">
              <span className="text-orange-900 font-bold">目前處於自由備料模式</span>
              <button
                type="button"
                onClick={() => setActiveWorkflow("today")}
                className="text-[11px] font-black text-[#2a9d8f] underline"
              >
                返回今日餐券（{todayRecipe.title}）→
              </button>
            </div>
          )}

          {/* 1. 選擇料理風味 */}
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

          {/* 2. 指定本次烹調設備（讀取自真實自備設備，支援多選） */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-stone-900">2. 本次指定設備</h3>
                <span className="text-[10px] text-stone-400">（可複選連動）</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCookwareModalOpen(true)}
                className="text-[10px] font-extrabold text-[#2a9d8f] hover:underline"
              >
                ＋ 管理廚具
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {ownedCookware.map((tool) => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleToolSelection(tool)}
                    className={`cookware-chip rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "border-[#2a9d8f] bg-[#e0f2f1] text-[#1b6b61] font-black shadow-xs"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {isSelected ? "✓ " : ""}{tool}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone-400">
              * 僅顯示您擁有的真實設備；AI 將自動為選中廚具優化火候步驟。
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
                <h3 className="text-xs font-black text-stone-900">3. 出餐備料盤</h3>
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
                        <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <span className="font-normal text-stone-500">
                            {item.qty} {item.unit}
                          </span>
                          {item.daysLeft <= 3 && (
                            <span className="rounded bg-orange-100 px-1.5 py-0.2 text-[9px] font-extrabold text-[#ea580c]">
                              剩 {item.daysLeft} 天即期
                            </span>
                          )}
                        </h4>
                        <p className="text-[9px] font-mono text-stone-400">
                          {item.chamber === "frozen" ? "冷凍保存" : "冷藏保存"} · 剩 {item.daysLeft} 天
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

          {/* 4. 快捷加料 (含急迫色標與天數) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-stone-900">4. 冰箱在庫快捷加料</h3>
              <span className="text-[10px] text-emerald-800 font-bold">點擊加入備料盤</span>
            </div>
            {availableItems.length === 0 ? (
              <p className="text-[11px] text-stone-400">
                {preppedItems.length > 0
                  ? "已將所有冰箱在庫食材全數加入備料盤。"
                  : "目前冰箱無其他在庫食材，可至「冰箱沙漏」新增庫存。"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableItems.map((item) => {
                  const isUrgent = item.daysLeft <= 3;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addToTray(item.id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        isUrgent
                          ? "border-orange-300 bg-orange-50 text-[#c2410c] hover:bg-orange-100"
                          : "border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      <IngredientIcon name={item.name} size={16} />
                      <span>＋ {item.name} ({item.qty} {item.unit})</span>
                      <span
                        className={`rounded px-1 text-[9px] font-black ${
                          isUrgent
                            ? "bg-orange-200 text-orange-900"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isUrgent ? `急·剩${item.daysLeft}天` : `${item.daysLeft}天`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5. 輕量收合式：公版食譜庫抽屜 */}
          <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-stone-600">auto_stories</span>
                <span className="text-xs font-bold text-stone-700">沒靈感？也可以參考公版食譜庫</span>
              </div>
              <div className="flex items-center gap-3">
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => ui.open(<CatalogAdminModal onClose={ui.close} />)}
                    className="text-xs font-black text-[#2a9d8f] hover:underline"
                  >
                    食譜管理
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCatalogDrawerOpen((prev) => !prev)}
                  className="text-xs font-black text-[#2a9d8f] hover:underline flex items-center gap-0.5"
                >
                  <span>{isCatalogDrawerOpen ? "收合" : "展開瀏覽"}</span>
                  <span className="material-symbols-outlined text-sm">
                    {isCatalogDrawerOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
            </div>

            {isCatalogDrawerOpen && (
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <p className="text-[10px] text-stone-500">公版檢核食譜，零額外 AI 費用：</p>
                {catalogQuery.isLoading ? (
                  <p className="text-xs text-stone-400">正在查詢庫存匹配食譜…</p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {(catalogQuery.data?.eligible || []).slice(0, 3).map((item) => (
                      <div
                        key={item.recipe.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200"
                      >
                        <div>
                          <strong className="text-stone-900">{item.recipe.title}</strong>
                          <p className="text-[10px] text-stone-500">
                            {item.recipe.totalMinutes} 分鐘 · {item.missing.length ? `需補買 ${item.missing.length} 項` : "庫存完全覆蓋"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartTodayRecipe(item.recipe)}
                          className="px-2.5 py-1 rounded-lg bg-[#2a9d8f] text-white font-bold text-[11px]"
                        >
                          查看步驟
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 底部浮動備菜出餐列 */}
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
                  {selectedTools.length > 0 ? selectedTools.join("、") : "全部設備"} · {style}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={preppedItems.length === 0}
              onClick={handleStartFreestyleCooking}
              className="floating-cooking-btn disabled:opacity-40"
            >
              開始料理
            </button>
          </div>
        </div>
      )}

      {/* ==================== 廚具管理彈窗 ==================== */}
      {isCookwareModalOpen && (
        <CookwareManagementModal
          ownedCookware={ownedCookware}
          onClose={() => setIsCookwareModalOpen(false)}
          onSave={async (newCookware) => {
            try {
              await api(
                "/settings/cookware",
                json("PUT", {
                  cookware: newCookware.map((name) => ({
                    id: crypto.randomUUID(),
                    name,
                    type: name,
                    limitations: [],
                  })),
                }),
              );
              await queryClient.invalidateQueries({ queryKey: stateQueryKey });
              setIsCookwareModalOpen(false);
              ui.toast("自備廚具設定已更新！");
            } catch {
              ui.toast("廚具設定更新失敗，請稍後重試");
            }
          }}
        />
      )}
    </div>
  );
}

function CookwareManagementModal({
  ownedCookware,
  onClose,
  onSave,
}: {
  ownedCookware: string[];
  onClose: () => void;
  onSave: (cookware: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([...ownedCookware]);
  const [customInput, setCustomInput] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (tool: string) => {
    setSelected((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleAddCustom = () => {
    const val = customInput.trim();
    if (!val) return;
    if (!selected.includes(val)) {
      setSelected((prev) => [...prev, val]);
    }
    setCustomInput("");
  };

  // Combine default list and user-owned custom items
  const allChoices = Array.from(new Set([...DEFAULT_COOKWARE_LIST, ...selected]));

  return (
    <Modal label="自備烹調設備管理" onClose={onClose}>
      <ModalHeader title="維護自備烹調設備" kicker="打通今日頁面跳轉至廚房的設定通道" onClose={onClose} />
      <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
        勾選您在租屋處擁有的烹調設備，食譜推薦與火候優化將嚴格限制在您擁有的設備內：
      </p>

      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
        {allChoices.map((tool) => {
          const checked = selected.includes(tool);
          return (
            <label
              key={tool}
              className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-100 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(tool)}
                  className="rounded text-[#2a9d8f] focus:ring-[#2a9d8f] h-4 w-4"
                />
                <span className="font-bold text-stone-800">{tool}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  checked ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-500"
                }`}
              >
                {checked ? "已啟用" : "未啟用"}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 pt-3 border-t border-stone-200 mt-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="新增其他自備設備（如：黑晶爐）"
          className="flex-1 px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-[#2a9d8f]"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          className="px-3 py-1.5 rounded-xl bg-[#2a9d8f] text-white font-bold text-xs shrink-0 hover:bg-[#238276] transition-all"
        >
          ＋ 新增
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="secondary-btn flex-1">
          取消
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(selected);
            setSaving(false);
          }}
          className="primary-btn flex-1"
        >
          {saving ? "儲存中…" : "儲存設定"}
        </button>
      </div>
    </Modal>
  );
}
