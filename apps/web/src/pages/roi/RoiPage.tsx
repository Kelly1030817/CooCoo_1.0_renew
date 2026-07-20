import { useContext } from "react";
import {
  calculateCurrentSaved,
  calculateGoalProjection,
  getMilestoneProgress,
} from "@coocoo/core";
import { useAppState } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { GoalSetupModal } from "@/features/goal-setup/GoalSetupModal";
import { GoalSettingsModal } from "@/features/goal-setup/GoalSettingsModal";

export function RoiPage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  if (!data) return null;
  if (!data.activeGoal)
    return (
      <div className="mx-auto max-w-[760px] space-y-md">
        <section className="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-sm">
          <div className="h-2 bg-gradient-to-r from-primary via-terracotta to-ochre-gold" />
          <div className="p-lg text-center md:p-xl">
            <span
              aria-hidden="true"
            className="material-symbols-outlined text-primary"
            >
              park
            </span>
            <p className="mt-md text-xs font-extrabold tracking-[.18em] text-secondary">
              一個目標，一條清楚的路
            </p>
            <h2 className="mt-sm text-2xl font-extrabold text-slate-blue md:text-3xl">
              用每一次自煮，靠近真正想完成的事
            </h2>
            <p className="mx-auto mt-sm max-w-[520px] text-sm leading-6 text-on-surface-variant">
              先設定目前已存金額與飲食支出，系統會建議每餐自煮預算，算出還差多少、約要煮多久。所有建議都能調整。
            </p>
            <button
              type="button"
              onClick={() => ui.open(<GoalSetupModal onClose={ui.close} />)}
              className="mt-lg inline-flex items-center justify-center gap-sm rounded-full bg-primary px-lg py-3 text-sm font-extrabold text-white shadow-sm transition-colors duration-200 hover:bg-on-primary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                add_circle
              </span>
              設定主要目標
            </button>
            <p className="mt-md text-[11px] text-outline">
              舊版多夢想資料不會被刪除，也不會自動加入新版進度。
            </p>
          </div>
        </section>
      </div>
    );
  const goal = data.activeGoal;
  const events = data.amountEvents.filter((e) => e.goalId === goal.id);
  const saved = calculateCurrentSaved(events);
  const percent = Math.min(100, Math.round((saved / goal.targetAmount) * 100));
  const milestones = getMilestoneProgress(goal.milestones, saved);
  const projection = calculateGoalProjection({
    targetAmount: goal.targetAmount,
    currentSavedAmount: saved,
    estimatedSavingPerMeal: data.cookingPlan?.estimatedSavingPerMeal,
    weeklyCookingMeals: data.cookingPlan?.weeklyCookingMeals,
    targetDate: goal.targetDate,
  });
  return (
    <div className="mx-auto max-w-[820px] space-y-lg">
      <section className="flex flex-col justify-between gap-md sm:flex-row sm:items-start">
        <div>
          <p className="text-[10px] font-extrabold tracking-[.16em] text-secondary">
            一個目標，一條清楚的路
          </p>
          <h2 className="text-3xl font-extrabold text-primary">圓夢看板</h2>
          <p className="mt-xs text-on-surface-variant">
            每一次自煮，都留下可追蹤的進度。
          </p>
        </div>
        <button
          onClick={() => ui.open(<GoalSettingsModal onClose={ui.close} />)}
          className="secondary-btn self-start"
        >
          <span className="material-symbols-outlined mr-1 align-middle text-base">
            settings
          </span>
          調整計畫
        </button>
      </section>
      <section className="rounded-3xl border border-primary/10 bg-white p-lg shadow-sm">
        <div className="flex flex-col items-center gap-lg sm:flex-row">
          <div
            className="radial-progress flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
            style={{ "--progress": percent } as React.CSSProperties}
          >
            <div className="text-center">
              <strong className="block text-3xl text-primary">
                {percent}%
              </strong>
              <span className="text-[10px] text-outline">完成進度</span>
            </div>
          </div>
          <div className="w-full">
            <span className="text-[10px] font-extrabold text-secondary">
              主要目標
            </span>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-blue">
              {goal.name}
            </h3>
            <div className="mt-md grid grid-cols-2 gap-sm">
              <div className="rounded-2xl bg-surface-container-low p-md">
                <span className="text-[10px] text-outline">目前已存</span>
                <strong className="block text-lg text-primary">
                  NT$ {saved.toLocaleString()}
                </strong>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-md">
                <span className="text-[10px] text-outline">還差</span>
                <strong className="block text-lg text-slate-blue">
                  NT$ {Math.max(0, goal.targetAmount - saved).toLocaleString()}
                </strong>
              </div>
            </div>
            <p className="mt-sm text-xs text-on-surface-variant">
              依目前節奏，約需 {projection.mealsNeeded ?? "—"} 餐；預估完成日{" "}
              {projection.estimatedDate || "尚無法估算"}。
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-3xl bg-white p-lg shadow-sm">
        <h3 className="font-extrabold text-slate-blue">三段圓夢路徑</h3>
        <div className="mt-md space-y-sm">
          {milestones.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-md ${item.status === "current" ? "border-primary/30 bg-primary/5" : "border-outline-variant/20 bg-surface-container-low"}`}
            >
              <span
                className={`material-symbols-outlined align-middle ${item.status === "completed" ? "text-secondary" : "text-outline"}`}
              >
                {item.status === "completed"
                  ? "check_circle"
                  : item.status === "current"
                    ? "radio_button_checked"
                    : "radio_button_unchecked"}
              </span>
              <strong className="ml-2 text-sm text-slate-blue">
                {item.label}
              </strong>
              <span className="float-right text-xs font-extrabold text-primary">
                NT$ {item.targetAmount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-2 gap-md">
        <div className="rounded-2xl bg-secondary/10 p-md">
          <span className="text-[10px] text-on-surface-variant">本週自煮</span>
          <strong className="block text-2xl text-secondary">
            {data.habitProgress.totalMeals} 餐
          </strong>
        </div>
        <div className="rounded-2xl bg-ochre-gold/30 p-md">
          <span className="text-[10px] text-on-surface-variant">
            健康自主餐
          </span>
          <strong className="block text-2xl text-tertiary">
            {data.healthAssets.healthyAutonomyMeals} 餐
          </strong>
        </div>
      </div>
    </div>
  );
}
