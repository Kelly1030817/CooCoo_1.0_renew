import { useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { HabitBarrier, OnboardingProfile } from "@coocoo/contracts";
import { dateInTimeZone } from "@coocoo/core";
import { api, json } from "@/shared/api/client";
import { stateQueryKey } from "@/entities/app-state/model";
import { emptyOnboardingDraft, readOnboardingDraft, saveOnboardingDraft } from "@/shared/model/onboarding-draft";
import { startGoogleAuth, supabase } from "@/shared/auth/supabase";
import { UiContext } from "@/app/ui-context";
import { InvoiceModal } from "@/features/shopping/ShoppingModals";
import { ChefAvatar, type ChefMood } from "./ChefAvatar";
import { PassportTicket } from "./PassportTicket";
import { suggestWeeklyGoalTarget } from "./weekly-goal";
import "./OnboardingPage.css";

const barriers: Array<[HabitBarrier, string]> = [
  ["no_ideas", "常常沒想法"], ["low_energy", "下班沒力氣"], ["no_time", "時間不固定"],
  ["ingredients_waste", "食材容易放壞"], ["cleanup", "不想收拾"],
];
const cookwareOptions = ["電磁爐", "瓦斯爐", "電鍋", "快煮鍋", "氣炸鍋", "微波爐"];
const stepTitles = ["節奏與卡點", "餐桌與廚具", "口味與餐期", "登入與冰箱", "主廚檔案"];

function Tick() {
  return <span className="choice-tick" aria-hidden="true">✓</span>;
}

function Choice({ selected, onClick, children, danger = false }: { selected: boolean; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return <button type="button" className={`onboarding-choice ${selected ? "selected" : ""} ${danger ? "danger" : ""}`} onClick={onClick}><span>{children}</span><Tick /></button>;
}

function StepCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="onboarding-step-card"><header><h2>{title}</h2>{description && <p>{description}</p>}</header>{children}</section>;
}

function Counter({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return <div className="onboarding-counter"><span>{unit}</span><div><button type="button" onClick={() => onChange(Math.max(min, value - 1))}>−</button><strong>{value}</strong><button type="button" onClick={() => onChange(Math.min(max, value + 1))}>+</button></div></div>;
}

export function OnboardingPage({ onComplete, onExit, canExit = false, initialStep }: { onComplete: () => void; onExit?: () => void; canExit?: boolean; initialStep?: number }) {
  const query = useQueryClient();
  const ui = useContext(UiContext);
  const saved = readOnboardingDraft();
  const [profile, setProfile] = useState<OnboardingProfile>({ ...emptyOnboardingDraft, ...saved, currentStep: initialStep ?? saved.currentStep });
  const [inventory, setInventory] = useState({ name: "", quantity: 1, unit: "份", chamber: "cold", expiresOn: "" });
  const [customCookware, setCustomCookware] = useState("");
  const [flavorInput, setFlavorInput] = useState("");
  const [ocrInventoryConfirmed, setOcrInventoryConfirmed] = useState(false);
  const [authVerified, setAuthVerified] = useState(() => !supabase);
  const [goalTargetEdited, setGoalTargetEdited] = useState(() => Boolean(saved.weeklyGoalTarget && saved.weeklyGoalTarget !== emptyOnboardingDraft.weeklyGoalTarget));
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<ChefMood>("listen");
  const [nodding, setNodding] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [sealDropped, setSealDropped] = useState(false);
  const [error, setError] = useState("");
  const suggestedTarget = suggestWeeklyGoalTarget(profile.currentWeeklyCookingFrequency);
  const step = profile.currentStep;

  const update = (patch: Partial<OnboardingProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveOnboardingDraft(next);
  };
  const cheer = (nextMood: ChefMood) => {
    setMood(nextMood);
    setNodding(false);
    requestAnimationFrame(() => setNodding(true));
  };
  const valid = useMemo(() => step === 1
    ? profile.habitBarriers.length > 0
    : step === 2
      ? profile.cookware.length > 0
      : step === 3
        ? profile.plannedMealSlots.length > 0
        : step === 4
          ? authVerified && (profile.hasNoInventory || ocrInventoryConfirmed || Boolean(inventory.name.trim() && inventory.expiresOn))
          : profile.weeklyGoalTarget > 0,
  [authVerified, inventory, ocrInventoryConfirmed, profile, step]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) setAuthVerified(Boolean(data.session)); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setAuthVerified(Boolean(session)); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!stamped) return;
    const timer = window.setTimeout(() => setSealDropped(true), 1450);
    return () => window.clearTimeout(timer);
  }, [stamped]);

  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      if (!profile.hasNoInventory && !ocrInventoryConfirmed) {
        const today = dateInTimeZone(new Date()) ?? new Date().toISOString().slice(0, 10);
        const expiryTime = new Date(`${inventory.expiresOn}T00:00:00+08:00`).getTime();
        const todayTime = new Date(`${today}T00:00:00+08:00`).getTime();
        await api("/inventory", json("POST", {
          ingredientKey: inventory.name.trim(), name: inventory.name.trim(), qty: inventory.quantity,
          unit: inventory.unit, chamber: inventory.chamber, expiresOn: inventory.expiresOn,
          daysLeft: Math.max(0, Math.ceil((expiryTime - todayTime) / 86_400_000)),
          lastConfirmedAt: new Date().toISOString(), image: "/favicon.svg", addedDate: today,
          estimatedValue: 0, storageProtocol: "先進先出，使用前再次確認。", boxSize: "M",
        }));
      }
      const complete = { ...profile, status: "complete" as const, currentStep: 5, inventoryReviewed: true, completedAt: new Date().toISOString() };
      await api("/onboarding", json("PUT", complete));
      saveOnboardingDraft(complete);
      await query.invalidateQueries({ queryKey: stateQueryKey });
      onComplete();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "設定未能儲存，請稍後再試。");
    } finally {
      setBusy(false);
    }
  };

  const toggleBarrier = (value: HabitBarrier) => {
    cheer("listen");
    update({ habitBarriers: profile.habitBarriers.includes(value) ? profile.habitBarriers.filter((item) => item !== value) : [...profile.habitBarriers, value] });
  };
  const toggleCookware = (value: string) => {
    cheer("applause");
    update({ cookware: profile.cookware.some((item) => item.type === value) ? profile.cookware.filter((item) => item.type !== value) : [...profile.cookware, { type: value, limitations: [] }] });
  };
  const addCustomCookware = () => {
    const value = customCookware.trim();
    if (!value || profile.cookware.some((item) => item.type === value)) return;
    toggleCookware(value);
    setCustomCookware("");
  };
  const addFlavor = () => {
    const value = flavorInput.trim();
    if (!value || profile.preferredFlavors.includes(value)) return;
    update({ preferredFlavors: [...profile.preferredFlavors, value] });
    setFlavorInput("");
  };
  const next = () => {
    cheer(step === 1 ? "applause" : step === 2 ? "care" : "listen");
    update({ currentStep: Math.min(5, step + 1), ...(step === 4 && !goalTargetEdited ? { weeklyGoalTarget: suggestedTarget } : {}) });
  };
  const stampOrFinish = () => {
    if (!stamped) {
      setStamped(true);
      cheer("sealed");
      return;
    }
    void finish();
  };

  return <main className="onboarding-shell">
    <section className="onboarding-device">
      <header className="onboarding-topbar">
        <ChefAvatar mood={mood} isNodding={nodding} onClick={() => cheer(mood)} />
        <div className="onboarding-top-actions">
          {canExit && <button type="button" onClick={onExit}>稍後繼續</button>}
          <span>{String(step).padStart(2, "0")} / 05</span>
        </div>
        <p>首次設定 · {String(step).padStart(2, "0")} {stepTitles[step - 1]}</p>
      </header>
      <div className="onboarding-progress" role="progressbar" aria-label={`第 ${step} 步，共 5 步`} aria-valuemin={1} aria-valuemax={5} aria-valuenow={step}><span style={{ width: `${step * 20}%` }} /></div>

      <div className="onboarding-content"><div className="onboarding-stack step-slide-down" key={step}>
        {step === 1 && <>
          <div className="chef-open"><span className="chef-open-icon material-symbols-outlined" aria-hidden="true">restaurant</span><div><strong>下班辛苦了！我是你的專屬主廚 CooCoo。</strong><p>沒有標準答案，我們只想讓第一次推薦更可行。你的回答會決定我怎麼挑菜、怎麼排餐。</p></div></div>
          <StepCard title="目前料理熟練度"><div className="choices one">{([['beginner','剛開始'],['comfortable','能完成幾道家常菜'],['advanced','熟悉料理與調整']] as const).map(([value,label]) => <Choice key={value} selected={profile.cookingExperience === value} onClick={() => update({ cookingExperience: value })}>{label}</Choice>)}</div></StepCard>
          <StepCard title="目前每週料理幾次？" description="用來推估第一步可行的週目標，不用勉強。"><Counter value={profile.currentWeeklyCookingFrequency} min={0} max={21} unit="次 / 週" onChange={(value) => update({ currentWeeklyCookingFrequency: value })} /></StepCard>
          <StepCard title="最常卡在哪裡？" description="可多選。這會決定我第一則提醒的方式。"><div className="choices">{barriers.map(([value,label]) => <Choice key={value} selected={profile.habitBarriers.includes(value)} onClick={() => toggleBarrier(value)}>{label}</Choice>)}</div></StepCard>
        </>}

        {step === 2 && <>
          <div className="chef-open"><span className="chef-open-icon material-symbols-outlined" aria-hidden="true">skillet</span><div><strong>我先確認你真的能用什麼來煮。</strong><p>過敏與絕對不吃是最高防線，推薦與 AI 都不能放寬。</p></div></div>
          <StepCard title="通常幾人吃？"><Counter value={profile.householdServings} min={1} max={12} unit="人份" onChange={(value) => update({ householdServings: value })} /></StepCard>
          <StepCard title="可用廚具" description="至少選一項；其他廚具也能自行新增。"><div className="choices">{cookwareOptions.map((value) => <Choice key={value} selected={profile.cookware.some((item) => item.type === value)} onClick={() => toggleCookware(value)}>{value}</Choice>)}</div><div className="tag-input"><input name="custom-cookware" maxLength={24} placeholder="例如：卡式爐、蒸烤箱" value={customCookware} onChange={(event) => setCustomCookware(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomCookware(); } }} /><button type="button" disabled={!customCookware.trim()} onClick={addCustomCookware}>＋</button></div><div className="tag-list">{profile.cookware.filter((item) => !cookwareOptions.includes(item.type)).map((item) => <span className="tag" key={item.type}>{item.type}<button type="button" aria-label={`移除 ${item.type}`} onClick={() => toggleCookware(item.type)}>×</button></span>)}</div></StepCard>
          <StepCard title="過敏或絕對不吃" description="用逗號分隔；這些項目會存成後端硬限制。"><input className="text-field" name="dietary-restrictions" value={profile.restrictions.map((item) => item.label).join("、")} placeholder="例如：花生、蝦…" onChange={(event) => { cheer("care"); update({ restrictions: event.target.value.split(/[、,，]/).map((value) => value.trim()).filter(Boolean).map((label, index) => ({ id: `restriction-${index}`, label, kind: "allergy" as const, ingredientKeys: [label], isHardLimit: true })) }); }} /><p className="safety-note">硬限制會寫入 dietary_restrictions，所有推薦與 AI 調整都必須遵守。</p></StepCard>
        </>}

        {step === 3 && <>
          <div className="chef-open"><span className="chef-open-icon material-symbols-outlined" aria-hidden="true">schedule</span><div><strong>料理要跟得上生活，才會長久。</strong><p>口味是偏好，餐期與時間則會直接影響今日推薦。</p></div></div>
          <StepCard title="喜歡的口味"><div className="tag-input"><input value={flavorInput} placeholder="例如：清爽、台式、微辣" onChange={(event) => setFlavorInput(event.target.value)} /><button type="button" disabled={!flavorInput.trim()} onClick={addFlavor}>＋</button></div><div className="tag-list">{profile.preferredFlavors.map((flavor) => <span className="tag" key={flavor}>{flavor}<button type="button" aria-label={`移除 ${flavor}`} onClick={() => update({ preferredFlavors: profile.preferredFlavors.filter((item) => item !== flavor) })}>×</button></span>)}</div></StepCard>
          <StepCard title="平常可用時間"><div className="slider-row"><input name="available-minutes" type="range" min="5" max="180" step="5" value={profile.availableMinutes} onChange={(event) => update({ availableMinutes: Number(event.target.value) })} /><strong>{profile.availableMinutes} 分鐘</strong></div></StepCard>
          <StepCard title="常用餐期"><div className="choices three">{([['breakfast','早餐'],['lunch','午餐'],['dinner','晚餐']] as const).map(([value,label]) => <Choice key={value} selected={profile.plannedMealSlots.includes(value)} onClick={() => update({ plannedMealSlots: profile.plannedMealSlots.includes(value) ? profile.plannedMealSlots.filter((item) => item !== value) : [...profile.plannedMealSlots, value] })}>{label}</Choice>)}</div></StepCard>
          <StepCard title="料理時預設指引"><div className="choices">{([['detailed','詳細陪做','逐步提示與時間提醒'],['compact','精簡步驟','熟悉後只看關鍵步驟']] as const).map(([value,label,sub]) => <Choice key={value} selected={profile.guidanceMode === value} onClick={() => update({ guidanceMode: value })}>{label}<small>{sub}</small></Choice>)}</div></StepCard>
        </>}

        {step === 4 && <>
          <div className="chef-open"><span className="chef-open-icon material-symbols-outlined" aria-hidden="true">kitchen</span><div><strong>登入後，我才能安全保存你的精確冰箱。</strong><p>OCR 只建立待確認草稿；逐項確認後才會真的入庫。</p></div></div>
          <StepCard title="登入後，建立精確冰箱" description="資料會跟著帳號，不會只留在這台裝置。">{supabase && !authVerified && <button type="button" className="wide-action" onClick={() => void startGoogleAuth()}>使用 Google 登入 <span>›</span></button>}{authVerified && <p className="safety-note safe">{supabase ? "登入完成，現在可以建立會跟著帳號的精確冰箱。" : "本機 Preview 使用測試資料；正式環境會先要求登入。"}</p>}<button type="button" className="wide-action secondary" onClick={() => ui.open(<InvoiceModal onClose={ui.close} onConfirmed={() => setOcrInventoryConfirmed(true)} />)}>用發票 OCR 建立冰箱 <small>逐項確認後才入庫</small></button></StepCard>
          <StepCard title="目前冰箱狀態"><div className="choices"><Choice selected={!profile.hasNoInventory} onClick={() => update({ hasNoInventory: false })}>手動新增一項</Choice><Choice selected={profile.hasNoInventory} onClick={() => update({ hasNoInventory: true })}>確認目前空箱</Choice></div></StepCard>
          {!profile.hasNoInventory && <StepCard title="新增一項精確食材"><div className="inventory-grid"><label className="full">食材名稱<input value={inventory.name} onChange={(event) => setInventory({ ...inventory, name: event.target.value })} /></label><label>數量<input type="number" min="0.01" step="0.01" value={inventory.quantity} onChange={(event) => setInventory({ ...inventory, quantity: Number(event.target.value) })} /></label><label>單位<input value={inventory.unit} onChange={(event) => setInventory({ ...inventory, unit: event.target.value })} /></label><label>位置<select value={inventory.chamber} onChange={(event) => setInventory({ ...inventory, chamber: event.target.value })}><option value="cold">冷藏</option><option value="frozen">冷凍</option><option value="pantry">常溫</option></select></label><label>期限<input type="date" value={inventory.expiresOn} onChange={(event) => setInventory({ ...inventory, expiresOn: event.target.value })} /></label></div></StepCard>}
          <p className="safety-note">{ocrInventoryConfirmed ? "發票品項已確認入庫，可以繼續。" : "OCR 只會在你逐項確認數量、單位、位置與期限後入庫。"}</p>
        </>}

        {step === 5 && <>
          <div className="chef-open"><span className="chef-open-icon material-symbols-outlined" aria-hidden="true">military_tech</span><div><strong>最後一步，把可行的節奏寫進主廚檔案。</strong><p>未達標不扣 EXP、不歸零；目標之後仍能隨生活調整。</p></div></div>
          <StepCard title="本週主指標"><div className="choices"><Choice selected={profile.primaryGoalMetric === "cooking_sessions"} onClick={() => update({ primaryGoalMetric: "cooking_sessions" })}>料理次數</Choice><Choice selected={profile.primaryGoalMetric === "self_cooked_servings"} onClick={() => update({ primaryGoalMetric: "self_cooked_servings" })}>自煮餐份</Choice></div></StepCard>
          <StepCard title="本週目標" description={`依目前每週 ${profile.currentWeeklyCookingFrequency} 次，建議先多一次：${suggestedTarget}。`}><Counter value={profile.weeklyGoalTarget} min={1} max={21} unit={profile.primaryGoalMetric === "cooking_sessions" ? "次 / 週" : "份 / 週"} onChange={(value) => { setGoalTargetEdited(true); update({ weeklyGoalTarget: value }); }} /></StepCard>
          <StepCard title="每週最多三則智慧提醒">{([['expiringIngredients','即期食材'],['plannedMeals','已安排料理'],['weeklyRhythm','本週節奏']] as const).map(([key,label]) => <label className="check-row" key={key}><input type="checkbox" checked={profile.reminders[key]} onChange={(event) => update({ reminders: { ...profile.reminders, [key]: event.target.checked } })} />{label}</label>)}<p className="helper">21:00–09:00 不推播；Push 權限會在首次料理完成後才詢問。</p></StepCard>
          <PassportTicket profile={profile} isStamped={stamped} isSealDropped={sealDropped} />
        </>}
        {error && <p role="alert" className="onboarding-error">{error}</p>}
      </div></div>

      <footer className="onboarding-actions"><button type="button" className="ghost" disabled={step === 1} onClick={() => { setMood("listen"); update({ currentStep: Math.max(1, step - 1) }); }}>‹ 上一步</button><small>{valid ? "資料會先保存在草稿" : "請完成本步必要資料"}</small><button type="button" className={`primary ${step === 5 && stamped ? "ready" : ""}`} disabled={!valid || busy || (step === 5 && stamped && !sealDropped)} onClick={step === 5 ? stampOrFinish : next}>{busy ? "儲存中…" : step === 5 ? stamped ? "啟程！進入今日" : "蓋章，成立主廚檔案" : "繼續 ›"}</button></footer>
    </section>
  </main>;
}
