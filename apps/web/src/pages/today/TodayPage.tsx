import { useContext, useEffect, useState } from "react";
import type { MealPlanResult, MealPostpone, MealSlot, PlannedMeal, RecipePackage, TodayDecision } from "@coocoo/contracts";
import { useAppState } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { RecipePackageModal } from "@/features/cooking/RecipeModal";
import { api, json } from "@/shared/api/client";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import "./TodayPage.css";

const subtitles: Record<string, string> = {
  "番茄滑蛋飯": "先用掉冰箱裡的蛋與番茄，一鍋到底滑嫩起鍋",
  "番茄滑蛋牛肉飯": "先用掉冰箱裡的蛋與番茄，一鍋到底滑嫩起鍋",
  "味噌蔬菜烏龍麵": "剩菜一鍋到底全下，收拾只要洗一個鍋",
  "胡麻雞絲拌麵": "同批小黃瓜與雞胸肉，爽口開胃免開大火",
  "蔥油手撕雞肉拌飯": "手撕雞肉＋熱飯＋香蔥油，免洗砧板極速開動",
  "蒜炒鮮蔬里肌": "高纖清爽，下班快速補充蛋白質",
};
const taipeiDateParts = (value: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
const dateOnly = () => {
  const parts = taipeiDateParts(new Date());
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const weekStart = (date: string) => {
  const value = new Date(date + "T12:00:00+08:00");
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  const parts = taipeiDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const slotName: Record<MealSlot, string> = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    weekday: "short",
    month: "numeric",
    day: "numeric",
  }).format(new Date(date + "T12:00:00+08:00"));

export function TodayPage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const [energyLow, setEnergyLow] = useState(false);
  const [decision, setDecision] = useState<TodayDecision | null>(null);
  const [planResult, setPlanResult] = useState<MealPlanResult | null>(null);
  const [primaryId, setPrimaryId] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [planError, setPlanError] = useState("");
  const [weekExpanded, setWeekExpanded] = useState(false);
  const today = dateOnly();

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
    const week = weekStart(today);
    setPlanError("");
    api<MealPlanResult>("/meal-plans", json("POST", { weekStart: week }))
      .then((value) => active && setPlanResult(value))
      .catch((reason) => active && setPlanError(reason instanceof Error ? reason.message : "本週餐單載入失敗"));
    return () => {
      active = false;
    };
  }, [today]);

  const choices = [decision?.primary, ...(decision?.alternatives || [])].filter(
    (item): item is RecipePackage => Boolean(item),
  );
  const recommended = choices.find((item) => item.id === primaryId) || choices[0];
  const choose = (meal: RecipePackage) => {
    setPrimaryId(meal.id);
    ui.toast("今天就煮「" + meal.title + "」");
  };

  const start = () => {
    if (!recommended) return;
    const ingredientIds = (data?.inventory || [])
      .filter((item) =>
        recommended.ingredients.some((ingredient) =>
          [ingredient.name, ingredient.ingredientKey].includes(item.name),
        ),
      )
      .map((item) => item.id);
    ui.open(
      <RecipePackageModal
        recipePackage={recommended}
        ingredientIds={ingredientIds}
        onClose={ui.close}
      />,
    );
  };

  const reschedule = (meal: PlannedMeal) =>
    ui.open(
      <PostponeModal
        meal={meal}
        planWeekStart={planResult!.plan.weekStart}
        planUpdatedAt={planResult!.plan.updatedAt}
        onClose={ui.close}
        onSaved={(value) => {
          setPlanResult(value);
          ui.close();
          ui.toast("本週餐單已更新");
        }}
      />,
    );

  const loading = !decision && !decisionError;
  if (loading) {
    return (
      <div className="today-page">
        <section className="today-intro">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              今天 · 安排中
            </p>
            <h2>
              先別想一整週，
              <br />
              決定下一餐就好。
            </h2>
          </div>
        </section>
        <div className="today-loading-card" role="status">
          <span className="material-symbols-outlined spinning">sync</span>
          <p>正在依你的廚具、預算與庫存檢核今日餐點…</p>
        </div>
      </div>
    );
  }

  const todaySlotText = decision?.slot ? slotName[decision.slot] : "晚餐";
  const todayPlanned = planResult?.plan?.meals.find(
    (m) => m.date === today && m.status === "planned",
  );
  const plannedDayNumber = todayPlanned && planResult
    ? planResult.plan.meals.indexOf(todayPlanned) + 1
    : null;

  const preparedServings = (data?.mealServings || []).filter(
    (item) => item.status === "prepared_inventory",
  );
  const showPreparedCapsule = preparedServings.length > 0;
  const preparedCount = preparedServings.length;

  const cookwareLabel =
    recommended && recommended.cookwareTypes.length > 0
      ? recommended.cookwareTypes.join("、")
      : "單平底鍋";
  const prepTimeLabel =
    recommended && recommended.prepMinutes > 0 ? `備料 ${recommended.prepMinutes} 分鐘` : "備料 5 分鐘";
  const stepCountLabel =
    recommended && recommended.steps.length > 0 ? `${recommended.steps.length} 大步驟` : "4 大步驟";

  const outsidePrice = data?.cookingPlan?.eatingOutCost || 150;
  const mealSaving = recommended ? Math.max(0, outsidePrice - recommended.estimatedCost) : 0;
  const goalName = data?.activeGoal?.name || "圓夢目標";
  const generalError = decisionError || planError;

  return (
    <div className="today-page">
      {generalError && recommended && (
        <p className="today-warning" role="alert">
          {generalError}
        </p>
      )}

      {/* 1. Header greeting & energy toggle */}
      <section className="today-intro">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            今天 · {plannedDayNumber ? `第 ${plannedDayNumber} 餐 · ` : ""}{todaySlotText}
          </p>
          <h2>
            先別想一整週，
            <br />
            決定下一餐就好。
          </h2>
        </div>
        <button
          type="button"
          className={energyLow ? "energy-toggle active" : "energy-toggle"}
          onClick={() => setEnergyLow((value) => !value)}
        >
          <span>{energyLow ? "✨" : "☁"}</span>
          {energyLow ? "低體力模式已開" : "今天有點累"}
        </button>
      </section>

      {/* 2. Notification capsule: 熟食庫存 (溫和綠色提醒) */}
      {showPreparedCapsule && (
        <div className="cooked-inventory-capsule" role="status">
          <div className="cooked-capsule-info">
            <span className="cooked-capsule-icon">🍲</span>
            <div className="cooked-capsule-text">
              <div className="cooked-capsule-header">
                <span className="cooked-capsule-label">熟食庫存可用</span>
                <span className="cooked-capsule-count">· 剩 {preparedCount} 份</span>
              </div>
              <p className="cooked-capsule-desc">冰箱尚有已備妥的熟食，加熱 5 分鐘即可享用</p>
            </div>
          </div>
          <button
            type="button"
            className="cooked-capsule-btn"
            onClick={() => ui.toast("今天優先食用熟食庫存，省去備料與洗鍋！")}
          >
            加熱即食 5m
          </button>
        </div>
      )}

      {/* 3. Hero Ticket Card: 風格 B */}
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
                後端食安與廚具檢核
              </span>
            </div>

            <h3>目前條件暫無完全匹配的料理</h3>
            <p className="meal-subtitle">
              {decision?.notice || decisionError || planError || "後台檢核您的可用廚具、預算與飲食限制，尚未找到同時符合全部條件的食譜。"}
            </p>

            <div className="backend-diagnostics-box">
              <div className="diag-header">後端目前讀取的偏好設定：</div>
              <div className="diag-grid">
                <div className="diag-item">
                  <span className="diag-label">🍳 可用廚具</span>
                  <strong className="diag-val">
                    {(data?.cookware || []).map((c) => c.name || c.type).join("、") || "尚未登記廚具"}
                  </strong>
                </div>
                <div className="diag-item">
                  <span className="diag-label">💰 每日餐飲預算</span>
                  <strong className="diag-val">
                    NT$ {data?.cookingPlan?.homeCookBudget ?? 300}
                  </strong>
                </div>
                <div className="diag-item">
                  <span className="diag-label">🥗 飲食限制</span>
                  <strong className="diag-val">
                    {data?.onboardingProfile?.restrictions && data.onboardingProfile.restrictions.length > 0
                      ? data.onboardingProfile.restrictions.map((r) => r.label).join("、")
                      : "無特殊飲食限制"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="ticket-actions-group">
              <a href="/kitchen" className="diag-action-btn primary">
                <span className="material-symbols-outlined">skillet</span>
                前往「廚房」新增或調整廚具
              </a>
              <a href="/fridge" className="diag-action-btn secondary">
                <span className="material-symbols-outlined">kitchen</span>
                前往「冰箱」選取食材生成料理
              </a>
              <button
                type="button"
                className="diag-action-btn text"
                onClick={() => location.reload()}
              >
                <span className="material-symbols-outlined">refresh</span>
                重新檢核後端推薦
              </button>
            </div>
          </div>
        </article>
      ) : (
        <article className="meal-ticket primary-meal">
          <div className="ticket-notch ticket-notch-top" aria-hidden="true" />
          <div className="ticket-notch ticket-notch-bottom" aria-hidden="true" />

          {/* Ticket Stub (Left) */}
          <div className="ticket-stub">
            <span className="stub-vertical-text">TODAY</span>
            <div className="stub-center">
              <small>首選</small>
              <strong>01</strong>
            </div>
            <span className="material-symbols-outlined stub-icon">restaurant</span>
          </div>

          {/* Ticket Body (Right) */}
          <div className="ticket-body">
            <div className="meal-tags">
              <span className="tag-time">
                <span className="material-symbols-outlined">bolt</span>
                {recommended.totalMinutes <= 15 ? "15 分快手" : `${recommended.totalMinutes} 分鐘`}
              </span>
              <span className="tag-covered">
                <span className="material-symbols-outlined">inventory_2</span>
                庫存優先
              </span>
              <span className="tag-cost">食材 NT$ {recommended.estimatedCost}</span>
            </div>

            <h3>{recommended.title}</h3>
            <p className="meal-subtitle">{subtitles[recommended.title] || decision?.notice || "符合你的廚具與飲食設定"}</p>

            <div className="cook-prep-row">
              <div>
                <small>廚具需求</small>
                <strong>🍳 {cookwareLabel}</strong>
              </div>
              <div className="prep-divider" />
              <div>
                <small>備料負擔</small>
                <strong>🔪 {prepTimeLabel}</strong>
              </div>
              <div className="prep-divider" />
              <div>
                <small>步驟數量</small>
                <strong>📝 {stepCountLabel}</strong>
              </div>
            </div>

            <div className="ingredient-route-wrapper">
              <span className="route-title">食材路徑</span>
              <div className="ingredient-route">
                {recommended.ingredients
                  .filter((item) => !item.isPantryStaple)
                  .map((item, index, arr) => (
                    <span
                      key={item.ingredientKey}
                      className={`route-chip ${item.coveredByInventory ? "covered" : ""}`}
                    >
                      {item.name}
                      {item.coveredByInventory && <small>（已有）</small>}
                      {index < arr.length - 1 && <i className="route-plus">＋</i>}
                    </span>
                  ))}
              </div>
            </div>

            <div className="roi-motivation-banner">
              <span className="roi-icon">✈️</span>
              <p>
                這餐預估為［{goalName}］省下 <strong>NT$ {mealSaving}</strong>
              </p>
            </div>

            <button type="button" className="cook-choice" onClick={start}>
              <span className="cook-choice-label">
                <span className="material-symbols-outlined">local_fire_department</span>
                就煮這道（免手持離線料理包）
              </span>
              <span className="cook-choice-arrow">→</span>
            </button>
          </div>
        </article>
      )}

      {/* 4. Alternatives: 2 safe paths (only when choices exist) */}
      {recommended && choices.filter((meal) => meal.id !== recommended.id).length > 0 && (
        <section className="alternatives">
          <div className="section-heading">
            <div>
              <p className="eyebrow">還有兩個方向</p>
              <h3>不用從無限食譜裡挑</h3>
            </div>
            <span className="alternatives-hint">點選卡片即可置換</span>
          </div>

          <div className="alternative-grid">
            {choices
              .filter((meal) => meal.id !== recommended.id)
              .map((meal) => (
                <button
                  type="button"
                  className="alternative-card"
                  key={meal.id}
                  onClick={() => choose(meal)}
                >
                  <span className="alt-badge">
                    {meal.totalMinutes <= 15 ? "⚡ 一鍋到底" : "🌿 換個口味"}
                  </span>
                  <strong>{meal.title}</strong>
                  <small>{subtitles[meal.title] || "符合你的廚具與飲食設定"}</small>
                  <footer>
                    <b>⏱️ {meal.totalMinutes} 分</b>
                    <b>NT$ {meal.estimatedCost}</b>
                  </footer>
                </button>
              ))}
          </div>
        </section>
      )}

      {/* 5. Weekly rhythm: Collapsible accordion (when planResult is available) */}
      {planResult && (
        <section className="week-strip">
          <div className="week-summary">
            <div className="week-summary-header">
              <div>
                <p className="eyebrow">
                  這週的 {planResult.plan.meals.filter((meal) => meal.status !== "cancelled").length} 餐
                </p>
                <h3>買一次，食材多用幾次</h3>
              </div>
              <button
                type="button"
                className="week-toggle-btn"
                onClick={() => setWeekExpanded((value) => !value)}
                aria-expanded={weekExpanded}
              >
                <span>{weekExpanded ? "收摺明細" : "展開明細"}</span>
                <span className="material-symbols-outlined">
                  {weekExpanded ? "expand_less" : "expand_more"}
                </span>
              </button>
            </div>

            <div className="week-rates">
              <span>
                <strong>{Math.round(planResult.plan.overlapRate * 100)}%</strong>
                <small>食材重疊率</small>
              </span>
              <span>
                <strong>{Math.round(planResult.plan.inventoryCoverageRate * 100)}%</strong>
                <small>庫存覆蓋率</small>
              </span>
            </div>

            {planResult.expiryWarnings.map((message) => (
              <small className="expiry-warning" key={message}>
                <span className="material-symbols-outlined">warning</span>
                {message}
              </small>
            ))}
          </div>

          {weekExpanded && (
            <ol className="week-meals-list">
              {planResult.plan.meals.map((meal, index) => (
                <li key={meal.id}>
                  <i>{index + 1}</i>
                  <span>
                    {dayLabel(meal.date)} · {slotName[meal.slot]} · {meal.title}
                    {meal.status === "cancelled" ? "（已取消）" : ""}
                  </span>
                  {meal.status === "planned" && (
                    <button type="button" onClick={() => reschedule(meal)}>
                      順延
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

function PostponeModal({meal,planWeekStart,planUpdatedAt,onClose,onSaved}:{meal:PlannedMeal;planWeekStart:string;planUpdatedAt:string;onClose:()=>void;onSaved:(value:MealPlanResult)=>void}){
  const [date,setDate]=useState(meal.date);const [slot,setSlot]=useState<MealSlot>(meal.slot);const [error,setError]=useState("");const [saving,setSaving]=useState(false);
  const submit=async(command:Pick<MealPostpone,"kind">)=>{setSaving(true);setError("");try{onSaved(await api<MealPlanResult>("/meal-plans/meals/"+meal.id,json("PATCH",{weekStart:planWeekStart,kind:command.kind,date:command.kind==="specific_date"?date:undefined,slot:command.kind==="specific_date"?slot:undefined,expectedUpdatedAt:planUpdatedAt})))}catch(reason){setError(reason instanceof Error?reason.message:"餐單更新失敗");setSaving(false)}};
  return <Modal label="順延餐點" onClose={onClose}><ModalHeader title={"調整「"+meal.title+"」"} kicker="選擇下一步" onClose={onClose}/>{error&&<p className="offline-error" role="alert">{error}</p>}<button className="primary-btn w-full" disabled={saving} onClick={()=>submit({kind:"next_slot"})}>移到下一個空位</button><div className="mt-md grid grid-cols-2 gap-sm"><label className="field-label">指定日期<input className="field" type="date" value={date} onChange={event=>setDate(event.target.value)}/></label><label className="field-label">餐期<select className="field" value={slot} onChange={event=>setSlot(event.target.value as MealSlot)}><option value="breakfast">早餐</option><option value="lunch">午餐</option><option value="dinner">晚餐</option></select></label></div><button className="secondary-btn mt-sm w-full" disabled={saving} onClick={()=>submit({kind:"specific_date"})}>移到指定日期</button><button className="secondary-btn mt-sm w-full" disabled={saving} onClick={()=>submit({kind:"cancel"})}>取消這餐</button></Modal>;
}
