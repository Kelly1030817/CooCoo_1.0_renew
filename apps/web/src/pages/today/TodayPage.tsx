import { useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RecipePackage, RecipePreferences, RecipeRecommendations, TodayDecision } from "@coocoo/contracts";
import { CHEF_RANKS, EXP_POINTS, dateInTimeZone, getWeekStart, todayMealNumberLabel } from "@coocoo/core";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { RecipePackageModal } from "@/features/cooking/RecipeModal";
import { ChefRevisitModal } from "./ChefRevisitModal";
import { PurchaseReminder, OfflineImportAndConflicts } from "@/features/recipes/RecipeCatalogPanel";
import {
  LOW_ENERGY_EMERGENCY_RECIPE,
  findEmergencyRecipeRestriction,
  hasCompatibleEmergencyCookware,
} from "@/features/cooking/emergencyRecipe";
import { api, json } from "@/shared/api/client";
import { shouldAutoSwitchToPurchase } from "./recommendationMode";
import { WeeklyStockupFlow } from "./WeeklyStockupFlow";
import "./TodayPage.css";

const subtitles: Record<string, string> = {
  "番茄滑蛋飯": "先用掉冰箱裡的蛋與番茄，一鍋到底滑嫩起鍋",
  "番茄滑蛋牛肉飯": "先用掉冰箱裡的蛋與番茄，一鍋到底滑嫩起鍋",
  "味噌蔬菜烏龍麵": "剩菜一鍋到底全下，收拾只要洗一個鍋",
  "胡麻雞絲拌麵": "同批小黃瓜與雞胸肉，爽口開胃免開大火",
  "蔥油手撕雞肉拌飯": "手撕雞肉＋熱飯＋香蔥油，免洗砧板極速開動",
  "蒜炒鮮蔬里肌": "高纖清爽，下班快速補充蛋白質",
};

export function TodayPage() {
  const { data } = useAppState();
  const queryClient = useQueryClient();
  const ui = useContext(UiContext);
  const [energyLow, setEnergyLow] = useState(false);
  const [ticketMode, setTicketMode] = useState<"fridge" | "purchase">("fridge");
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);
  const [decision, setDecision] = useState<TodayDecision | null>(null);
  const [primaryId, setPrimaryId] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  // Purchase recommendations state
  const [purchaseResult, setPurchaseResult] = useState<RecipeRecommendations | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [selectedPurchaseRecipeId, setSelectedPurchaseRecipeId] = useState<string | null>(null);

  const recipeSettings = useQuery({
    queryKey: ["recipe-preferences", data?.session.user?.id],
    queryFn: () => api<RecipePreferences>("/settings/recipes").catch(() => null),
  });
  const purchaseBudget = recipeSettings.data?.purchaseBudget ?? 100;
  const today = dateInTimeZone(new Date()) ?? "";
  const weekStart = getWeekStart(`${today}T12:00:00Z`) ?? today;

  const openChefConsultation = () => {
    ui.open(
      <ChefRevisitModal
        onClose={ui.close}
        onSelectLowEnergy={() => {
          setEnergyLow(true);
          setTicketMode("fridge");
        }}
        onStartCooking={(customRecipe) => startCooking(customRecipe)}
        inventoryNames={(data?.inventory || []).map((item) => item.name)}
        restrictions={data?.onboardingProfile?.restrictions || []}
        cookwareTypes={(data?.cookware || []).map((item) => item.type)}
        weeklyTarget={data?.weeklyGoal.target ?? 1}
        onAdjustTarget={async (newTarget) => {
          await api("/weekly-goal", json("PATCH", { metric: data?.weeklyGoal.metric ?? "cooking_sessions", target: newTarget }));
          await queryClient.invalidateQueries({ queryKey: stateQueryKey });
        }}
        onRecordTakeout={async () => "今晚休息也沒關係；本週目標可以隨生活調整，不會扣除 EXP 或留下失敗標記。"}
      />,
    );
  };

  useEffect(() => {
    let active = true;
    setDecisionError("");
    api<TodayDecision>(
      "/meal-decisions/today?date=" + today + "&energy=" + (energyLow ? "low" : "normal"),
    )
      .then((value) => {
        if (active) {
          setDecision(value);
          setPrimaryId(value.primary?.id || "");
        }
      })
      .catch((reason) => active && setDecisionError(reason instanceof Error ? reason.message : "餐點載入失敗"));
    return () => {
      active = false;
    };
  }, [energyLow, today]);

  useEffect(() => {
    let active = true;
    setPurchaseLoading(true);
    setPurchaseError("");
    api<RecipeRecommendations>("/recipes/recommendations", json("POST", {
      mode: "small_purchase",
      purchaseBudget,
      allowRepeat: false,
      energy: energyLow ? "low" : "normal",
    }))
      .then((value) => {
        if (active) {
          setPurchaseResult(value);
          setSelectedPurchaseRecipeId((current) => current ?? value.eligible[0]?.recipe.id ?? null);
        }
      })
      .catch((reason) => active && setPurchaseError(reason instanceof Error ? reason.message : "補買推薦載入失敗"))
      .finally(() => {
        if (active) setPurchaseLoading(false);
      });
    return () => {
      active = false;
    };
  }, [purchaseBudget, energyLow, today]);

  const choices = [decision?.primary, ...(decision?.alternatives || [])].filter(
    (item): item is RecipePackage => Boolean(item),
  );
  const recommendedFridge = choices.find((item) => item.id === primaryId) || choices[0];
  const purchaseChoices = purchaseResult?.eligible || [];
  const activePurchaseItem =
    purchaseChoices.find((item) => item.recipe.id === selectedPurchaseRecipeId) ||
    purchaseChoices[0];

  useEffect(() => {
    if (shouldAutoSwitchToPurchase({
      hasDecision: Boolean(decision),
      inventoryRecipeCount: choices.length,
      purchaseRecipeCount: purchaseChoices.length,
      hasAutoSwitched,
      ticketMode: ticketMode === "purchase" ? "purchase" : "fridge",
    })) {
      setTicketMode("purchase");
      setHasAutoSwitched(true);
    }
  }, [decision, choices.length, purchaseChoices.length, hasAutoSwitched, ticketMode]);

  const recommended = ticketMode === "purchase" ? (activePurchaseItem?.recipe || recommendedFridge) : recommendedFridge;
  const activeMissing = ticketMode === "purchase" ? (activePurchaseItem?.missing || []) : [];

  const choose = (meal: RecipePackage) => {
    if (ticketMode !== "purchase") {
      setPrimaryId(meal.id);
    } else {
      setSelectedPurchaseRecipeId(meal.id);
    }
  };

  const startCooking = (customRecipe?: RecipePackage) => {
    const targetRecipe = customRecipe || recommended || LOW_ENERGY_EMERGENCY_RECIPE;
    if (!targetRecipe) return;
    if (targetRecipe.id === LOW_ENERGY_EMERGENCY_RECIPE.id) {
      const blockedBy = findEmergencyRecipeRestriction(data?.onboardingProfile?.restrictions || []);
      if (blockedBy) {
        ui.toast(`「${blockedBy.label}」是硬限制，這道保底料理不會開啟。`, "error");
        return;
      }
      if (!hasCompatibleEmergencyCookware((data?.cookware || []).map((item) => item.type))) {
        ui.toast("目前登記的廚具不適合這道單鍋保底料理，因此不會開啟。", "error");
        return;
      }
    }
    const ingredientIds = (data?.inventory || [])
      .filter((item) =>
        targetRecipe.ingredients.some((ingredient) =>
          [ingredient.name, ingredient.ingredientKey].some((name) => item.name.includes(name)) ||
          (ingredient.ingredientKey === "egg" && item.name.includes("蛋")) ||
          (ingredient.ingredientKey === "greens" && (item.name.includes("菜") || item.name.includes("蔬"))) ||
          (ingredient.ingredientKey === "noodles" && (item.name.includes("麵") || item.name.includes("粉")))
        ),
      )
      .map((item) => item.id);
    ui.open(
      <RecipePackageModal
        recipePackage={targetRecipe}
        ingredientIds={ingredientIds}
        onClose={ui.close}
      />,
    );
  };

  const loading = !decision && !decisionError;
  if (loading) {
    return (
      <div className="today-page">
        <section className="today-intro">
          <div>
            <h2>
              先看今天，
              <br />
              再決定這週要不要一起備齊。
            </h2>
          </div>
        </section>
        <div className="today-loading-card" role="status">
          <span className="material-symbols-outlined spinning">sync</span>
          <p>正在依你的廚具、時間與庫存檢核今日餐點…</p>
        </div>
      </div>
    );
  }

  const preparedServings = (data?.mealServings || []).filter(
    (item) => item.status === "prepared_inventory",
  );
  const preparedCount = preparedServings.length;
  const eatPreparedServing = async () => {
    const serving = preparedServings[0];
    if (!serving) return;
    await api(`/meal-servings/${serving.id}/eat`, json("POST", { operationId: crypto.randomUUID() }));
    await queryClient.invalidateQueries({ queryKey: stateQueryKey });
    ui.toast("熟食已記為吃完，獲得 10 EXP");
  };

  const growth = data?.growth;
  const weeklyGoal = data?.weeklyGoal;
  const totalExp = growth?.totalExp ?? 0;
  let rankIndex = 0;
  for (let i = 0; i < CHEF_RANKS.length; i += 1) if (totalExp >= CHEF_RANKS[i].threshold) rankIndex = i;
  const rank = CHEF_RANKS[rankIndex];
  const nextRank = CHEF_RANKS[rankIndex + 1];
  const xpSpan = nextRank ? nextRank.threshold - rank.threshold : 1;
  const xpDone = nextRank ? totalExp - rank.threshold : 1;
  const xpPercent = Math.min(100, Math.round((xpDone / xpSpan) * 100));

  const missions = data?.missions ?? [];
  const missionsDone = missions.filter((mission) => mission.done).length;

  const mealNumber = todayMealNumberLabel(data?.mealPlan?.meals ?? []);

  const cookwareLabel = recommended && recommended.cookwareTypes.length > 0 ? recommended.cookwareTypes.join("、") : "單平底鍋";
  const stepCount = recommended?.steps.length ?? 0;
  const totalMinutes = recommended?.totalMinutes ?? 0;
  const missingCount = activeMissing.length;
  const nextBadge = growth?.nextBadge ?? null;
  const generalError = decisionError;

  const openPurchaseReminder = () => {
    if (!activePurchaseItem || activeMissing.length === 0) return;
    ui.open(
      <PurchaseReminder
        item={activePurchaseItem}
        budget={purchaseBudget}
        allowRepeat={false}
        onClose={ui.close}
        onUseInventory={() => {
          ui.close();
          setTicketMode("fridge");
          setEnergyLow(false);
        }}
        onAdded={async () => {
          await queryClient.invalidateQueries({ queryKey: stateQueryKey });
          ui.close();
          ui.toast("已加入購物清單；完成採買入庫後再開始料理。");
        }}
      />,
    );
  };

  const alternativeMeals = recommended
    ? choices.filter((meal) => meal.id !== recommended.id)
    : [];
  const purchaseAlternatives = recommended
    ? purchaseChoices.filter((item) => item.recipe.id !== recommended.id).slice(0, 2)
    : [];

  return (
    <div className="today-page">
      {generalError && <p className="today-warning" role="alert">{generalError}</p>}
      {ticketMode === "purchase" && purchaseError && <p className="today-warning" role="alert">{purchaseError}</p>}

      {/* 1. 今日頁面 Header 問候與低體力切換 */}
      <section className="today-intro">
        <div>
          <h2>
            {data?.mealPlan ? "這週有安排，" : "先決定下一餐，"}
            <br />
            {data?.mealPlan ? "現在看下一餐。" : "也能一次備齊。"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !energyLow;
            setEnergyLow(next);
            ui.toast(next ? "已開啟低體力模式" : "已恢復一般模式");
          }}
          className={`energy-toggle ${energyLow ? "active" : ""}`}
          aria-pressed={energyLow}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          <span>{energyLow ? "低體力中" : "今天有點累"}</span>
        </button>
      </section>

      {!data?.mealPlan ? <WeeklyStockupFlow
        today={today}
        weekStart={weekStart}
        mealSlots={data?.onboardingProfile?.plannedMealSlots ?? ["dinner"]}
        suggestedCount={data?.weeklyGoal.target ?? 3}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: stateQueryKey });
          ui.toast("本週餐單已成立；合併食材已加入採買。");
        }}
      /> : null}

      {/* HUD：主廚職階與 EXP 進度 */}
      <section className="today-hud" aria-label="主廚職階與 EXP">
        <div className="hud-row">
          <div className="hud-chef">
            <span className="hud-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                <line className="chef-eyes" x1="9" y1="12" x2="9.01" y2="12" />
                <line className="chef-eyes" x1="15" y1="12" x2="15.01" y2="12" />
                <line x1="6" y1="17" x2="18" y2="17" />
              </svg>
            </span>
            <div className="hud-chef-text">
              <strong>{rank.name}</strong>
              <small>{nextRank ? `距下一職階還有 ${nextRank.threshold - totalExp} EXP` : "已達最高職階"}</small>
            </div>
          </div>
          <button type="button" className="hud-xp" onClick={openChefConsultation}>{totalExp} EXP</button>
        </div>
        <div className="hud-bar" aria-hidden="true"><span style={{ width: `${xpPercent}%` }} /></div>
        <div className="hud-meta"><span>{rank.threshold}</span><span>{nextRank ? `下一目標 ${nextRank.threshold} EXP` : "最高職階 900 EXP"}</span></div>
      </section>

      {/* 主任務票券 */}
      {!recommended ? (
        <article className="meal-ticket ticket-mismatch">
          <div className="ticket-notch ticket-notch-top" aria-hidden="true" />
          <div className="ticket-notch ticket-notch-bottom" aria-hidden="true" />
          <div className="ticket-stub stub-mismatch">
            <span className="stub-vertical-text">STATUS</span>
            <div className="stub-center">
              <small>檢核</small>
              <strong>!</strong>
            </div>
            <span className="material-symbols-outlined stub-icon">tune</span>
          </div>
          <div className="ticket-body">
            <div className="meal-tags">
              <span className="tag-warning">
                <span className="material-symbols-outlined">info</span>
                {ticketMode === "purchase" ? "少量補買條件檢核" : "冰箱現有庫存檢核"}
              </span>
            </div>
            <h3>{ticketMode !== "purchase" ? "目前冰箱現有食材暫無完全匹配的料理" : "目前條件暫無完全匹配的料理"}</h3>
            <p className="meal-subtitle">
              {ticketMode !== "purchase"
                ? decision?.notice || decisionError || "後台檢核您的可用廚具、時間與飲食限制，尚未找到同時符合全部條件的食譜。"
                : purchaseError || purchaseResult?.notice || "目前沒有符合預算且補買不超過 2 項食材的候選食譜。"}
            </p>
            <div className="ticket-actions-group">
              {ticketMode !== "purchase" && purchaseChoices.length > 0 && (
                <button type="button" className="diag-action-btn primary highlight-switch" onClick={() => setTicketMode("purchase")}>
                  <span className="material-symbols-outlined">shopping_cart</span>
                  查看「少量補買」候選（{purchaseChoices.length} 道）
                </button>
              )}
              <a href="/fridge" className="diag-action-btn secondary">
                <span className="material-symbols-outlined">kitchen</span>
                前往「冰箱」新增或盤點食材
              </a>
              <a href="/me" className="diag-action-btn text">
                <span className="material-symbols-outlined">skillet</span>
                前往「我的」新增或調整廚具
              </a>
            </div>
          </div>
        </article>
      ) : (
        <article className="meal-ticket primary-meal">
          <div className="ticket-notch ticket-notch-top" aria-hidden="true" />
          <div className="ticket-notch ticket-notch-bottom" aria-hidden="true" />
          <div className="ticket-stub">
            <span className="stub-vertical-text">TODAY</span>
            <div className="stub-center">
              <small className="stub-mealno">{mealNumber}</small>
              <strong>{missionsDone}/3</strong>
              <span className="stub-pips" aria-hidden="true">
                {missions.map((mission, index) => (
                  <i key={mission.key} className={index < missionsDone ? "on" : ""} />
                ))}
              </span>
            </div>
            <span className="material-symbols-outlined stub-icon">restaurant</span>
          </div>

          <div className="ticket-body">
            <div className="ticket-mode-row">
              <div className="segmented-switch" role="tablist" aria-label="今日推薦模式切換">
                <button
                  type="button" role="tab" aria-selected={ticketMode === "fridge"}
                  className={`segmented-btn ${ticketMode === "fridge" ? "active" : ""}`}
                  onClick={() => { setTicketMode("fridge"); setEnergyLow(false); }}
                >
                  <span className="material-symbols-outlined">kitchen</span>
                  冰箱就能煮{choices.length > 0 ? `（${choices.length}）` : "（0）"}
                </button>
                <button
                  type="button" role="tab" aria-selected={ticketMode === "purchase"}
                  className={`segmented-btn ${ticketMode === "purchase" ? "active" : ""}`}
                  onClick={() => { setTicketMode("purchase"); setEnergyLow(false); }}
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  補買{purchaseLoading ? "…" : `（${purchaseChoices.length}）`}
                </button>
              </div>
            </div>

            <div className="meal-tags">
              <span className="tag-time">
                <span className="material-symbols-outlined">schedule</span>
                {totalMinutes <= 15 ? "15 分快手" : `${totalMinutes} 分鐘`}
              </span>
              <span className={`tag-coverage ${ticketMode !== "purchase" ? "tag-covered" : "tag-purchase"}`}>
                <span className="material-symbols-outlined">{missingCount > 0 ? "shopping_cart" : "check_circle"}</span>
                {missingCount > 0 ? `需補 ${missingCount} 樣` : "庫存足夠"}
              </span>
              <span className="tag-cost">
                <span className="material-symbols-outlined">payments</span>
                NT$ {recommended.estimatedCost}
              </span>
            </div>

            <h3>{recommended.title}</h3>

            <div className="ticket-stats">
              <div className="tstat">
                <span className="material-symbols-outlined">skillet</span>
                <b>{cookwareLabel}</b>
              </div>
              <div className="tstat">
                <span className="material-symbols-outlined">format_list_numbered</span>
                <b>{stepCount}</b>
              </div>
              <div className="tstat">
                <span className="material-symbols-outlined">schedule</span>
                <b>{totalMinutes}m</b>
              </div>
            </div>

            <div className="ingredient-route">
              {recommended.ingredients
                .filter((item) => !item.isPantryStaple)
                .map((item) => {
                  const isMissing = ticketMode === "purchase" && activeMissing.some((m) => m.ingredientKey === item.ingredientKey || m.name === item.name);
                  return (
                    <span key={item.ingredientKey} className={`route-chip ${isMissing ? "missing" : (item.coveredByInventory ? "covered" : "")}`}>
                      <span className="material-symbols-outlined">{isMissing ? "shopping_cart" : "check"}</span>
                      {item.name}
                    </span>
                  );
                })}
            </div>

            <div className="ticket-rewards">
              <span className="reward-chip xp">
                <span className="material-symbols-outlined">local_fire_department</span>
                +{EXP_POINTS.cooking_completed} EXP
              </span>
              {nextBadge && (
                <span className="reward-chip badge">
                  <span className="material-symbols-outlined">military_tech</span>
                  {nextBadge.title} {nextBadge.current}/{nextBadge.target}
                </span>
              )}
            </div>

            <div className="ticket-cta">
              <button
                type="button"
                className="cook-choice"
                disabled={ticketMode === "purchase" && missingCount > 0}
                onClick={() => {
                  if (ticketMode === "purchase" && missingCount > 0) {
                    openPurchaseReminder();
                  } else {
                    startCooking(recommended);
                  }
                }}
              >
                <span className="cook-choice-label">
                  <span className="material-symbols-outlined">local_fire_department</span>
                  {ticketMode === "purchase" && missingCount > 0 ? "補買前確認" : "就煮這道"}
                </span>
              </button>
              <button type="button" className="ticket-more" aria-label="更多細節" onClick={() => setDetailOpen(true)}>
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
          </div>

          {detailOpen && (
            <div className="ticket-detail" role="dialog" aria-label="餐點細節">
              <div className="detail-head">
                <strong>{recommended.title}</strong>
                <button type="button" className="detail-close" onClick={() => setDetailOpen(false)} aria-label="關閉">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="detail-why">{subtitles[recommended.title] || decision?.notice || "符合你的廚具與飲食設定。"}</p>
              {ticketMode === "purchase" && missingCount > 0 && (
                <p className="detail-missing">
                  需補買 {activeMissing.map((m) => `${m.name} ${m.quantity} ${m.unit}`).join("、")}
                  {activePurchaseItem?.estimatedPurchaseCost ? `（約 NT$ ${activePurchaseItem.estimatedPurchaseCost}）` : ""}
                </p>
              )}
              <p className="detail-note">安全與過敏資訊仍以文字完整呈現；完成料理可獲得 +{EXP_POINTS.cooking_completed} EXP，使用即期食材再加 +{EXP_POINTS.expiring_ingredient_used} EXP。</p>
            </div>
          )}
        </article>
      )}

      {/* 三個可行方向（小票根列） */}
      {ticketMode !== "purchase" && alternativeMeals.length > 0 && (
        <section className="alt-stubs" aria-label="三個可行方向">
          <h4><span className="material-symbols-outlined">alt_route</span>三個可行方向</h4>
          {alternativeMeals.map((meal, index) => (
            <button type="button" className="ministub" key={meal.id} onClick={() => choose(meal)}>
              <span className="mstub">{String(index + 1).padStart(2, "0")}</span>
              <span className="mbody">
                <strong>{meal.title}</strong>
                <span className="mmeta">
                  <span><span className="material-symbols-outlined">payments</span>NT$ {meal.estimatedCost}</span>
                  {meal.ingredients.some((i) => !i.isPantryStaple && !i.coveredByInventory) ? (
                    <span><span className="material-symbols-outlined">shopping_cart</span>需補</span>
                  ) : (
                    <span><span className="material-symbols-outlined">check_circle</span>現有</span>
                  )}
                </span>
              </span>
              <span className="mside"><span className="material-symbols-outlined">swap_horiz</span></span>
            </button>
          ))}
        </section>
      )}

      {/* 少量補買候選（小票根列） */}
      {ticketMode === "purchase" && purchaseAlternatives.length > 0 && (
        <section className="alt-stubs" aria-label="其他補買候選">
          <h4><span className="material-symbols-outlined">shopping_cart</span>其他補買候選</h4>
          {purchaseAlternatives.map((item) => (
            <button
              type="button" className="ministub" key={item.recipe.id}
              onClick={() => setSelectedPurchaseRecipeId(item.recipe.id)}
            >
              <span className="mstub">{item.recipe.totalMinutes}m</span>
              <span className="mbody">
                <strong>{item.recipe.title}</strong>
                <span className="mmeta">
                  <span><span className="material-symbols-outlined">payments</span>NT$ {item.recipe.estimatedCost}</span>
                  {item.missing.length > 0 && (
                    <span><span className="material-symbols-outlined">shopping_cart</span>{item.missing.length}</span>
                  )}
                </span>
              </span>
              <span className="mside"><span className="material-symbols-outlined">swap_horiz</span></span>
            </button>
          ))}
        </section>
      )}

      {/* 熟食庫存 */}
      {preparedCount > 0 && (
        <div className="cooked-inventory-capsule" role="status">
          <div className="cooked-capsule-info">
            <span className="cooked-capsule-icon" aria-hidden="true">
              <span className="material-symbols-outlined">ramen_dining</span>
            </span>
            <div className="cooked-capsule-text">
              <div className="cooked-capsule-header">
                <span className="cooked-capsule-label">熟食庫存</span>
                <span className="cooked-capsule-count">· 剩 {preparedCount} 份</span>
              </div>
              <p className="cooked-capsule-desc">加熱 5 分鐘即可享用</p>
            </div>
          </div>
          <button type="button" className="cooked-capsule-btn" onClick={() => void eatPreparedServing()}>
            加熱即食 5m
          </button>
        </div>
      )}

      {/* 今日任務 */}
      <section className="mission-list" aria-label="今日任務">
        <h4><span className="material-symbols-outlined">flag</span>今日任務</h4>
        {missions.map((mission) => (
          <div className={`mrow ${mission.done ? "done" : ""}`} key={mission.key}>
            <span className="mmark"><span className="material-symbols-outlined">check</span></span>
            <span className="mlabel">
              {mission.label}
              <small>{mission.done ? "已完成" : mission.key === "cook_today" ? "就煮這道" : mission.key === "eat_prepared" ? "到冰箱加熱" : `用即期食材煮${mission.hint ? ` · 庫存 ${mission.hint} 項即期` : ""}`}</small>
            </span>
            <span className="rw">{mission.done ? "已入帳" : `+${mission.reward}`}</span>
            {!mission.done && <span className="mgo material-symbols-outlined" aria-hidden="true">{mission.key === "cook_today" ? "local_fire_department" : mission.key === "eat_prepared" ? "ramen_dining" : "schedule"}</span>}
          </div>
        ))}
      </section>

      {/* 本週節奏（單行進度） */}
      <div className="weekstrip">
        <span className="wk"><span className="material-symbols-outlined">calendar_month</span></span>
        <div className="wtxt">
          <b>本週 {weeklyGoal?.progress ?? 0} / {weeklyGoal?.target ?? 1} 餐</b>
          <div className="wbar"><span style={{ width: `${Math.min(100, Math.round(((weeklyGoal?.progress ?? 0) / Math.max(1, weeklyGoal?.target ?? 1)) * 100))}%` }} /></div>
        </div>
        <a className="wgo" href="/me" aria-label="前往我的">
          <span className="material-symbols-outlined">chevron_right</span>
        </a>
      </div>

      <div className="today-operations">
        <OfflineImportAndConflicts userId={data?.session.user?.id} />
      </div>
    </div>
  );
}
