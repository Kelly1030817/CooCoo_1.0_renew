import { useContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CookingCostRecord,
  CookingOutcome,
  ChefChatSession,
  ReminderPreferences,
} from "@coocoo/contracts";
import { BADGE_DEFINITIONS, CHEF_RANKS } from "@coocoo/core";
import { useAppRoute } from "@/app/routing/useAppRoute";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api, json } from "@/shared/api/client";
import {
  readOnboardingDraft,
  saveOnboardingDraft,
} from "@/shared/model/onboarding-draft";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { UiContext } from "@/app/ui-context";
import {
  CookwareModal,
  ProfileModal,
} from "@/widgets/app-shell/Header";
import "./MePage.css";

const defaultReminders: ReminderPreferences = {
  expiringIngredients: true,
  plannedMeals: true,
  weeklyRhythm: true,
  pushEnabled: false,
  quietHoursStart: "21:00",
  quietHoursEnd: "09:00",
  weeklyLimit: 3,
};

export function MePage() {
  const { data } = useAppState();
  const query = useQueryClient();
  const ui = useContext(UiContext);
  const { navigate } = useAppRoute();
  const [target, setTarget] = useState(data?.weeklyGoal.target ?? 1);

  if (!data) return null;

  const { weeklyGoal, growth } = data;
  const percent = Math.min(
    100,
    Math.round((weeklyGoal.progress / weeklyGoal.target) * 100),
  );

  const saveGoal = async () => {
    await api(
      "/weekly-goal",
      json("PATCH", { metric: weeklyGoal.metric, target }),
    );
    await query.invalidateQueries({ queryKey: stateQueryKey });
    ui.toast("本週主目標已更新；本週獎勵仍最多一次。");
  };

  const replayOnboarding = () => {
    ui.close();
    saveOnboardingDraft({
      ...readOnboardingDraft(),
      currentStep: 1,
      status: "draft",
    });
    navigate("onboarding");
  };

  return (
    <div className="me-page">
      <header>
        <p className="eyebrow">MY KITCHEN RHYTHM</p>
        <h2>我的</h2>
        <p>每一次回來，都算數；沒達標不扣分，也不把你歸零。</p>
      </header>

      <section className="weekly-card">
        <div>
          <span>本週主目標</span>
          <h3>
            {weeklyGoal.metric === "cooking_sessions" ? "料理次數" : "自煮餐份"}
          </h3>
          <strong>
            {weeklyGoal.progress} / {weeklyGoal.target}
          </strong>
        </div>
        <div className="goal-ring" style={{ "--progress": `${percent}%` } as React.CSSProperties}>
          {percent}%
        </div>
        <label>
          隨生活調整目標
          <input
            aria-label="本週目標"
            name="weekly-goal-target"
            type="number"
            min="1"
            max="21"
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          />
          <button type="button" onClick={() => void saveGoal()}>
            儲存
          </button>
        </label>
      </section>

      <section className="rank-card">
        <div>
          <span>目前職階</span>
          <h3>{growth.rank.name}</h3>
          <strong>{growth.totalExp} EXP</strong>
        </div>
        <div className="rank-track" aria-label={`目前 ${growth.totalExp} EXP`}>
          {CHEF_RANKS.map((rank) => (
            <i
              key={rank.level}
              className={growth.totalExp >= rank.threshold ? "reached" : ""}
              title={`${rank.name} ${rank.threshold} EXP`}
            />
          ))}
        </div>
        <p>
          {growth.rank.nextThreshold
            ? `距下一職階還有 ${growth.rank.nextThreshold - growth.totalExp} EXP`
            : "你已抵達最高職階"}
        </p>
      </section>

      <section className="badge-card">
        <span>下一枚徽章</span>
        <h3>{growth.nextBadge?.title ?? "12 枚徽章全部收藏"}</h3>
        {growth.nextBadge && (
          <p>
            {growth.nextBadge.current} / {growth.nextBadge.target}
          </p>
        )}
        <details>
          <summary>查看所有 12 枚徽章</summary>
          <div className="badge-grid">
            {BADGE_DEFINITIONS.map((badge) => (
              <div
                className={
                  data.badgeAwards.some((award) => award.badgeKey === badge.badgeKey)
                    ? "earned"
                    : ""
                }
                key={badge.badgeKey}
              >
                <b>{badge.title}</b>
                <small>{badge.target}</small>
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="me-settings">
        <h3>更多</h3>
        <button
          type="button"
          onClick={() => ui.open(<HistoryModal outcomes={data.cookingOutcomes} onClose={ui.close} />)}
        >
          料理歷程
        </button>
        <button
          type="button"
          onClick={() => ui.open(<CostModal costs={data.cookingCosts ?? []} onClose={ui.close} />)}
        >
          成本統計（選用）
        </button>
        <button
          type="button"
          onClick={() =>
            ui.open(
              <ReminderSettingsModal
                initial={data.reminderPreferences ?? defaultReminders}
                onClose={ui.close}
              />,
            )
          }
        >
          提醒設定
        </button>
        <button
          type="button"
          onClick={() => ui.open(<CookwareModal onClose={ui.close} />)}
        >
          廚具設定
        </button>
        <button
          type="button"
          onClick={() =>
            ui.open(
              <ProfileModal
                onClose={ui.close}
                onReplayOnboarding={replayOnboarding}
              />,
            )
          }
        >
          帳號與主廚檔案
        </button>
        <button type="button" onClick={() => ui.open(<ChefChatModal onClose={ui.close} />)}>
          主廚相談室 <small>每日 30 則 · 最近 10 次</small>
        </button>
      </section>
    </div>
  );
}

function HistoryModal({ outcomes, onClose }: { outcomes: CookingOutcome[]; onClose: () => void }) {
  return (
    <Modal label="料理歷程" onClose={onClose}>
      <ModalHeader title="料理歷程" kicker="每次完成都會留在這裡" onClose={onClose} />
      {outcomes.length === 0 ? (
        <p className="text-sm text-on-surface-variant">完成第一道料理後，這裡會出現料理與 EXP 紀錄。</p>
      ) : (
        <div className="space-y-sm">
          {outcomes.map((outcome) => (
            <article key={outcome.id} className="rounded-2xl bg-surface-container-low p-md">
              <strong className="text-sm text-slate-blue">{outcome.mealName}</strong>
              <p className="mt-xs text-xs text-on-surface-variant">
                {new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium" }).format(new Date(outcome.createdAt))}
                {` · ${outcome.servingsEaten} 份已吃 · +${outcome.expAwarded} EXP`}
              </p>
            </article>
          ))}
        </div>
      )}
    </Modal>
  );
}

function CostModal({ costs, onClose }: { costs: CookingCostRecord[]; onClose: () => void }) {
  const formatter = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });
  return (
    <Modal label="成本統計" onClose={onClose}>
      <ModalHeader title="成本統計" kicker="選用紀錄，不影響 EXP" onClose={onClose} />
      {costs.length === 0 ? (
        <p className="text-sm text-on-surface-variant">尚未開啟料理成本紀錄；不記錄也能完整使用 CooCoo。</p>
      ) : (
        <div className="space-y-sm">
          {costs.map((cost) => (
            <article key={cost.id} className="rounded-2xl bg-surface-container-low p-md text-xs">
              <strong className="text-slate-blue">本餐食材 {formatter.format(cost.actualIngredientCost)}</strong>
              <p className="mt-xs text-on-surface-variant">比較基準 {formatter.format(cost.comparisonMealPrice)} · 差額僅供統計 {formatter.format(cost.difference)}</p>
            </article>
          ))}
        </div>
      )}
    </Modal>
  );
}

function ReminderSettingsModal({ initial, onClose }: { initial: ReminderPreferences; onClose: () => void }) {
  const query = useQueryClient();
  const [preferences, setPreferences] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toggle = (key: "expiringIngredients" | "plannedMeals" | "weeklyRhythm") =>
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api(
        "/settings/reminders",
        json("PATCH", {
          expiringIngredients: preferences.expiringIngredients,
          plannedMeals: preferences.plannedMeals,
          weeklyRhythm: preferences.weeklyRhythm,
        }),
      );
      await query.invalidateQueries({ queryKey: stateQueryKey });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提醒設定未能儲存");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal label="提醒設定" onClose={onClose}>
      <ModalHeader title="提醒設定" kicker="每週最多 3 則" onClose={onClose} />
      <div className="space-y-sm">
        {([
          ["expiringIngredients", "即期食材"],
          ["plannedMeals", "已安排料理"],
          ["weeklyRhythm", "本週節奏"],
        ] as const).map(([key, label]) => (
          <label className="check-row" key={key}>
            <input type="checkbox" checked={preferences[key]} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
      <p className="mt-md text-xs text-on-surface-variant">21:00–09:00 不推播；每一類每週最多 1 則。</p>
      {error && <p role="alert" className="onboarding-error">{error}</p>}
      <button type="button" className="primary-btn mt-md w-full" disabled={busy} onClick={() => void save()}>
        {busy ? "儲存中…" : "儲存提醒設定"}
      </button>
    </Modal>
  );
}

function ChefChatModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [source, setSource] = useState<"openrouter" | "rules">("rules");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const history = useQuery({queryKey:["chef-chat-sessions"],queryFn:()=>api<ChefChatSession[]>("/chef-chat/sessions")});
  const send = async () => {
    if (!message.trim()) return;
    setBusy(true);
    setError("");
    try {
      const session = await api<{
        messages: Array<{ role: string; content: string }>;
        source: "openrouter" | "rules";
      }>(
        "/chef-chat/sessions",
        json("POST", { operationId: crypto.randomUUID(), message: message.trim() }),
      );
      setSource(session.source);
      setReply(session.messages.find((item) => item.role === "assistant")?.content ?? "");
      setMessage("");
      await history.refetch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "相談室暫時無法使用");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal label="主廚相談室" onClose={onClose}>
      <ModalHeader title="主廚相談室" kicker="每日 30 則 · 最近 10 次可刪除" onClose={onClose} />
      <p className="text-sm text-on-surface-variant">AI 失敗或本月 NT$100 額度用完時，會清楚切換成規則型協助。</p>
      <label className="field-label" htmlFor="chef-chat-message">今天想相談什麼？</label>
      <textarea
        id="chef-chat-message"
        name="chef-chat-message"
        className="field mt-xs"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="告訴我今天有多少時間、體力和想用的食材…"
      />
      <button type="button" className="primary-btn mt-sm w-full" disabled={busy || !message.trim()} onClick={() => void send()}>
        {busy ? "主廚正在想…" : "送出"}
      </button>
      {reply && (
        <div aria-live="polite" className="mt-md rounded-2xl bg-surface-container-low p-md">
          <strong>{source === "openrouter" ? "AI 主廚建議" : "規則型協助"}</strong>
          <p className="mt-xs text-sm">{reply}</p>
        </div>
      )}
      {error && <p role="alert" className="onboarding-error">{error}</p>}
      <section className="mt-md" aria-label="最近相談紀錄">
        <h3 className="text-sm font-extrabold text-slate-blue">最近相談</h3>
        {history.isLoading?<p className="text-xs text-on-surface-variant">正在載入…</p>:history.data?.length?<div className="mt-sm space-y-sm">{history.data.map((session)=><article key={session.id} className="rounded-2xl bg-surface-container-low p-md text-xs"><div className="flex items-start justify-between gap-sm"><div><strong>{session.title}</strong><small className="block text-on-surface-variant">{session.source==="openrouter"?"AI 主廚建議":"規則型協助"}</small></div><button type="button" className="text-error" onClick={async()=>{await api(`/chef-chat/sessions/${session.id}`,{method:"DELETE"});await history.refetch();}}>刪除</button></div><p className="mt-xs text-on-surface-variant">{session.messages.find((item)=>item.role==="assistant")?.content}</p></article>)}</div>:<p className="mt-xs text-xs text-on-surface-variant">還沒有相談紀錄。</p>}
      </section>
    </Modal>
  );
}
