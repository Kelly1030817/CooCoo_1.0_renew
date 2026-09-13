import { useEffect, useMemo, useState } from "react";
import type { MealSlot, WeeklyStockupResult } from "@coocoo/contracts";
import { api, json } from "@/shared/api/client";
import "./WeeklyStockupFlow.css";

const DISMISSED_WEEK_KEY = "coocoo.weekly-stockup-dismissed.v1";
const dayNames = ["一", "二", "三", "四", "五", "六", "日"];
const slotNames: Record<MealSlot, string> = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
const categoryNames = { produce: "蔬果", protein: "蛋白質", pantry: "常溫", other: "其他" } as const;

function dateAt(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function WeeklyStockupFlow({
  today,
  weekStart,
  mealSlots,
  suggestedCount,
  onSaved,
}: {
  today: string;
  weekStart: string;
  mealSlots: MealSlot[];
  suggestedCount: number;
  onSaved: () => Promise<void>;
}) {
  const maxMeals = useMemo(() => {
    const remainingDays = Math.max(1, Math.round((Date.parse(`${dateAt(weekStart, 6)}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000) + 1);
    return Math.max(1, Math.min(21, remainingDays * Math.max(1, mealSlots.length)));
  }, [mealSlots.length, today, weekStart]);
  const [mealCount, setMealCount] = useState(() => Math.max(1, Math.min(suggestedCount, maxMeals)));
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<WeeklyStockupResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "save" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_WEEK_KEY) !== weekStart) setOpen(true);
  }, [weekStart]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => dateAt(weekStart, index)), [weekStart]);
  const plannedDates = useMemo(() => new Set(preview?.plan.meals.map(meal => meal.date) ?? []), [preview]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_WEEK_KEY, weekStart);
    setOpen(false);
  };
  const loadPreview = async () => {
    setBusy("preview");
    setError("");
    try {
      setPreview(await api<WeeklyStockupResult>("/meal-plans/preview", json("POST", { weekStart, startDate: today, mealCount })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "本週餐單暫時無法預覽。");
    } finally {
      setBusy(null);
    }
  };
  const save = async () => {
    setBusy("save");
    setError("");
    try {
      await api<WeeklyStockupResult>("/meal-plans", json("POST", { weekStart, startDate: today, mealCount }));
      localStorage.removeItem(DISMISSED_WEEK_KEY);
      await onSaved();
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "本週餐單尚未儲存。");
    } finally {
      setBusy(null);
    }
  };

  return <>
    <button type="button" className="weekly-stockup-invite" onClick={() => setOpen(true)}>
      <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
      <span><strong>這週要一次備齊嗎？</strong><small>先決定料理餐數，再看合併後真正要買的食材</small></span>
      <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
    </button>
    {open ? <div className="weekly-stockup-overlay" role="dialog" aria-modal="true" aria-labelledby="weekly-stockup-title">
      <section className="weekly-stockup-sheet">
        <header>
          <div><p>本週一次備齊</p><h2 id="weekly-stockup-title">少跑一趟，先把這週想煮的排好</h2></div>
          <button type="button" onClick={dismiss} aria-label="關閉本週規劃">×</button>
        </header>

        <div className="weekly-stockup-days" aria-label="本週七日安排">
          {days.map((date, index) => <div key={date} className={`${date < today ? "past" : ""} ${plannedDates.has(date) ? "planned" : ""}`}>
            <span>週{dayNames[index]}</span><strong>{shortDate(date)}</strong><i aria-hidden="true" />
          </div>)}
        </div>

        {!preview ? <div className="weekly-stockup-question">
          <p>這不是打卡目標。請填這週實際想安排的料理餐數，之後仍可調整。</p>
          <div className="weekly-stockup-counter">
            <button type="button" onClick={() => setMealCount(value => Math.max(1, value - 1))} disabled={mealCount === 1}>−</button>
            <span><strong>{mealCount}</strong><small>餐料理</small></span>
            <button type="button" onClick={() => setMealCount(value => Math.min(maxMeals, value + 1))} disabled={mealCount === maxMeals}>＋</button>
          </div>
          <small>依剩餘日期與常用餐期，本週最多還能安排 {maxMeals} 餐。</small>
        </div> : <div className="weekly-stockup-preview">
          <div className="weekly-stockup-summary"><strong>已排 {preview.plan.meals.length} 餐</strong><span>合併後需補 {preview.shoppingDraft.length} 樣</span></div>
          {preview.plan.meals.length ? <div className="weekly-stockup-meals">
            {preview.plan.meals.map(meal => <article key={meal.id}><time>{shortDate(meal.date)} · {slotNames[meal.slot]}</time><strong>{meal.title}</strong><small>{meal.servings} 人份 · {meal.totalMinutes} 分鐘</small></article>)}
          </div> : <p className="weekly-stockup-empty">目前沒有足夠的安全食譜可安排，這份預覽不會儲存。</p>}
          {preview.shoppingDraft.length ? <div className="weekly-stockup-shopping"><h3>一次採買草稿</h3>{preview.shoppingDraft.map(item => <div key={item.key}><span>{categoryNames[item.category]}</span><strong>{item.name}</strong><small>{Number(item.quantity.toFixed(2))} {item.unit}</small></div>)}</div> : preview.plan.meals.length ? <p className="weekly-stockup-covered">目前庫存已能覆蓋這份餐單。</p> : null}
          {preview.unfilledSlots.length ? <p className="weekly-stockup-note">目前安全候選不足，還有 {preview.unfilledSlots.length} 個餐期未排入；不會用不符合限制的食譜補滿。</p> : null}
        </div>}

        {error ? <p className="weekly-stockup-error" role="alert">{error}</p> : null}
        <footer>
          <button type="button" className="weekly-stockup-later" onClick={preview ? () => setPreview(null) : dismiss}>{preview ? "重新選餐數" : "這週先照下一餐"}</button>
          <button type="button" className="weekly-stockup-primary" disabled={Boolean(busy) || Boolean(preview && preview.plan.meals.length === 0)} onClick={() => void (preview ? save() : loadPreview())}>
            {busy === "preview" ? "正在合併需求…" : busy === "save" ? "正在儲存…" : preview ? "確認本週餐單" : "預覽餐單與採買"}
          </button>
        </footer>
      </section>
    </div> : null}
  </>;
}
