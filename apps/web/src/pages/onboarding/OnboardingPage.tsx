import { useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { HabitBarrier, OnboardingProfile } from "@coocoo/contracts";
import { api, json } from "@/shared/api/client";
import { stateQueryKey } from "@/entities/app-state/model";
import { emptyOnboardingDraft, readOnboardingDraft, saveOnboardingDraft } from "@/shared/model/onboarding-draft";
import { startGoogleAuth, supabase } from "@/shared/auth/supabase";
import { UiContext } from "@/app/ui-context";
import { InvoiceModal } from "@/features/shopping/ShoppingModals";
import { suggestWeeklyGoalTarget } from "./weekly-goal";
import "./OnboardingPage.css";

const barriers: Array<[HabitBarrier, string]> = [["no_ideas", "常常沒想法"], ["low_energy", "下班沒力氣"], ["no_time", "時間不固定"], ["ingredients_waste", "食材容易放壞"], ["cleanup", "不想收拾"]];
const cookwareOptions = ["電磁爐", "瓦斯爐", "電鍋", "快煮鍋", "氣炸鍋", "微波爐"];

export function OnboardingPage({ onComplete, onExit, canExit = false, initialStep }: { onComplete: () => void; onExit?: () => void; canExit?: boolean; initialStep?: number }) {
  const query = useQueryClient();
  const ui = useContext(UiContext);
  const saved = readOnboardingDraft();
  const [profile, setProfile] = useState<OnboardingProfile>({ ...emptyOnboardingDraft, ...saved, currentStep: initialStep ?? saved.currentStep });
  const [inventory, setInventory] = useState({ name: "", quantity: 1, unit: "份", chamber: "cold", expiresOn: "" });
  const [customCookware, setCustomCookware] = useState("");
  const [ocrInventoryConfirmed, setOcrInventoryConfirmed] = useState(false);
  const [authVerified, setAuthVerified] = useState(() => !supabase);
  const [goalTargetEdited,setGoalTargetEdited]=useState(()=>Boolean(saved.weeklyGoalTarget&&saved.weeklyGoalTarget!==emptyOnboardingDraft.weeklyGoalTarget));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const suggestedTarget = suggestWeeklyGoalTarget(profile.currentWeeklyCookingFrequency);
  const step = profile.currentStep;
  const update = (patch: Partial<OnboardingProfile>) => { const next = { ...profile, ...patch }; setProfile(next); saveOnboardingDraft(next); };
  const valid = useMemo(() => step === 1 ? profile.habitBarriers.length > 0 : step === 2 ? profile.cookware.length > 0 : step === 3 ? profile.plannedMealSlots.length > 0 : step === 4 ? authVerified && (profile.hasNoInventory || ocrInventoryConfirmed || Boolean(inventory.name.trim() && inventory.expiresOn)) : profile.weeklyGoalTarget > 0, [authVerified, inventory, ocrInventoryConfirmed, profile, step]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthVerified(Boolean(data.session));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthVerified(Boolean(session));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const finish = async () => {
    setBusy(true); setError("");
    try {
      if (!profile.hasNoInventory && !ocrInventoryConfirmed) await api("/inventory", json("POST", { ingredientKey: inventory.name.trim(), name: inventory.name.trim(), qty: inventory.quantity, unit: inventory.unit, chamber: inventory.chamber, expiresOn: inventory.expiresOn, daysLeft: Math.max(0, Math.ceil((new Date(`${inventory.expiresOn}T00:00:00`).getTime() - Date.now()) / 86_400_000)), lastConfirmedAt: new Date().toISOString(), image: "/favicon.svg", addedDate: new Date().toISOString().slice(0, 10), estimatedValue: 0, storageProtocol: "先進先出，使用前再次確認。", boxSize: "M" }));
      const complete = { ...profile, status: "complete" as const, currentStep: 5, inventoryReviewed: true, completedAt: new Date().toISOString() };
      await api("/onboarding", json("PUT", complete)); saveOnboardingDraft(complete); await query.invalidateQueries({ queryKey: stateQueryKey }); onComplete();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "設定未能儲存，請稍後再試。"); } finally { setBusy(false); }
  };
  const toggleBarrier = (value: HabitBarrier) => update({ habitBarriers: profile.habitBarriers.includes(value) ? profile.habitBarriers.filter((item) => item !== value) : [...profile.habitBarriers, value] });
  const toggleCookware = (value: string) => update({ cookware: profile.cookware.some((item) => item.type === value) ? profile.cookware.filter((item) => item.type !== value) : [...profile.cookware, { type: value, limitations: [] }] });
  const toggleCustomCookware = (value: string) => update({ cookware: profile.cookware.some((item) => item.type === value) ? profile.cookware.filter((item) => item.type !== value) : [...profile.cookware, { type: value, limitations: [] }] });
  const next = () => update({ currentStep: Math.min(5, step + 1), ...(step===4&&!goalTargetEdited?{weeklyGoalTarget:suggestedTarget}:{}) });

  return <main className="onboarding-shell">
    <header className="onboarding-topbar"><div><p className="eyebrow">CooCoo 1.0</p><strong>陪你從冰箱裡，煮出自己的生活節奏。</strong></div>{canExit && <button onClick={onExit}>稍後繼續</button>}</header>
    <div className="onboarding-progress" role="progressbar" aria-label={`第 ${step} 步，共 5 步`} aria-valuemin={1} aria-valuemax={5} aria-valuenow={step}><span style={{ width: `${step * 20}%` }} /></div>
    <section className="onboarding-card"><p className="eyebrow">STEP {step} / 5</p>
      {step === 1 && <><h1>先認識你的自煮節奏</h1><p>沒有標準答案，我們只想讓第一次推薦更可行。</p><label>目前料理熟練度<select name="cooking-experience" autoComplete="off" value={profile.cookingExperience} onChange={(e) => update({ cookingExperience: e.target.value as OnboardingProfile["cookingExperience"] })}><option value="beginner">剛開始</option><option value="comfortable">能完成幾道家常菜</option><option value="advanced">熟悉料理與調整</option></select></label><label>目前每週料理幾次？<input name="weekly-cooking-frequency" autoComplete="off" type="number" min="0" max="21" value={profile.currentWeeklyCookingFrequency} onChange={(e) => update({ currentWeeklyCookingFrequency: Number(e.target.value) })} /></label><fieldset><legend>最常卡在哪裡？</legend><div className="choice-grid">{barriers.map(([value, label]) => <button type="button" className={profile.habitBarriers.includes(value) ? "selected" : ""} onClick={() => toggleBarrier(value)} key={value}>{label}</button>)}</div></fieldset></>}
      {step === 2 && <><h1>你的餐桌與廚具</h1><label>通常幾人吃？<input name="household-servings" autoComplete="off" type="number" min="1" max="12" value={profile.householdServings} onChange={(e) => update({ householdServings: Number(e.target.value) })} /></label><fieldset><legend>可用廚具（至少一項）</legend><div className="choice-grid">{cookwareOptions.map((value) => <button type="button" className={profile.cookware.some((item) => item.type === value) ? "selected" : ""} onClick={() => toggleCookware(value)} key={value}>{value}</button>)}</div><label className="custom-cookware">其他廚具（選填，Enter 新增）<div className="custom-cookware-input"><input name="custom-cookware" autoComplete="off" maxLength={24} placeholder="例如：卡式爐、蒸烤箱" value={customCookware} onChange={(e) => setCustomCookware(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const value = customCookware.trim(); if (!value) return; toggleCustomCookware(value); setCustomCookware(""); } }} /><button type="button" disabled={!customCookware.trim()} onClick={() => { const value = customCookware.trim(); toggleCustomCookware(value); setCustomCookware(""); }}>新增</button></div><div className="selected-cookware">{profile.cookware.filter((item) => !cookwareOptions.includes(item.type)).map((item) => <button type="button" className="selected" key={item.type} onClick={() => toggleCookware(item.type)}>{item.type}</button>)}</div></label></fieldset><label>過敏或絕對不吃（逗號分隔）<input name="dietary-restrictions" autoComplete="off" placeholder="例如：花生、蝦…" onBlur={(e) => update({ restrictions: e.target.value.split(/[,，]/).map((value) => value.trim()).filter(Boolean).map((label, index) => ({ id: `restriction-${index}`, label, kind: "allergy" as const, ingredientKeys: [label], isHardLimit: true })) })} /></label></>}
      {step === 3 && <><h1>什麼樣的料理才跟得上生活？</h1><label>喜歡的口味<input name="preferred-flavors" autoComplete="off" value={profile.preferredFlavors.join("、")} placeholder="清爽、台式、微辣…" onChange={(e) => update({ preferredFlavors: e.target.value.split(/[、,，]/).map((value) => value.trim()).filter(Boolean) })} /></label><label>平常可用時間：{profile.availableMinutes} 分鐘<input name="available-minutes" type="range" min="5" max="180" step="5" value={profile.availableMinutes} onChange={(e) => update({ availableMinutes: Number(e.target.value) })} /></label><fieldset><legend>常用餐期</legend><div className="choice-grid">{([['breakfast','早餐'],['lunch','午餐'],['dinner','晚餐']] as const).map(([value,label]) => <button type="button" key={value} className={profile.plannedMealSlots.includes(value) ? "selected" : ""} onClick={() => update({ plannedMealSlots: profile.plannedMealSlots.includes(value) ? profile.plannedMealSlots.filter((item) => item !== value) : [...profile.plannedMealSlots, value] })}>{label}</button>)}</div></fieldset><fieldset><legend>料理時預設指引</legend><div className="choice-grid"><button type="button" className={profile.guidanceMode === "detailed" ? "selected" : ""} onClick={() => update({ guidanceMode: "detailed" })}>詳細陪做</button><button type="button" className={profile.guidanceMode === "compact" ? "selected" : ""} onClick={() => update({ guidanceMode: "compact" })}>精簡步驟</button></div></fieldset></>}
      {step === 4 && <><h1>登入後，建立精確冰箱</h1><p>資料會跟著帳號。發票 OCR 只建立待確認草稿，不會假裝辨識成功。</p>{supabase && !authVerified && <button type="button" className="primary-btn" onClick={() => void startGoogleAuth()}>使用 Google 登入</button>}{authVerified && <p className="onboarding-note">{supabase ? "登入完成，現在可以建立會跟著帳號的精確冰箱。" : "本機 Preview 使用測試資料；正式環境會先要求登入。"}</p>}<button type="button" className="secondary-btn" onClick={() => ui.open(<InvoiceModal onClose={ui.close} onConfirmed={() => setOcrInventoryConfirmed(true)} />)}>用發票 OCR 建立冰箱</button><fieldset><legend>目前冰箱狀態</legend><div className="choice-grid"><button type="button" className={!profile.hasNoInventory ? "selected" : ""} onClick={() => update({ hasNoInventory: false })}>手動新增一項</button><button type="button" className={profile.hasNoInventory ? "selected" : ""} onClick={() => update({ hasNoInventory: true })}>確認目前空箱</button></div></fieldset>{!profile.hasNoInventory && <div className="inventory-grid"><label>食材名稱<input name="inventory-name" autoComplete="off" value={inventory.name} onChange={(e) => setInventory({ ...inventory, name: e.target.value })} /></label><label>數量<input name="inventory-quantity" autoComplete="off" type="number" min="0.01" step="0.01" value={inventory.quantity} onChange={(e) => setInventory({ ...inventory, quantity: Number(e.target.value) })} /></label><label>單位<input name="inventory-unit" autoComplete="off" value={inventory.unit} onChange={(e) => setInventory({ ...inventory, unit: e.target.value })} /></label><label>位置<select name="inventory-chamber" autoComplete="off" value={inventory.chamber} onChange={(e) => setInventory({ ...inventory, chamber: e.target.value })}><option value="cold">冷藏</option><option value="frozen">冷凍</option><option value="pantry">常溫</option></select></label><label>期限<input name="inventory-expiry" autoComplete="off" type="date" value={inventory.expiresOn} onChange={(e) => setInventory({ ...inventory, expiresOn: e.target.value })} /></label></div>}<p className="onboarding-note">{ocrInventoryConfirmed ? "發票品項已確認入庫，可以繼續。" : "OCR 只會在你逐項確認數量、單位、位置與期限後入庫。"}</p></>}
      {step === 5 && <><h1>成立你的主廚檔案</h1><p>依目前每週 {profile.currentWeeklyCookingFrequency} 次，建議先多一次：{suggestedTarget}。</p><fieldset><legend>本週主指標</legend><div className="choice-grid"><button type="button" className={profile.primaryGoalMetric === "cooking_sessions" ? "selected" : ""} onClick={() => update({ primaryGoalMetric: "cooking_sessions" })}>料理次數</button><button type="button" className={profile.primaryGoalMetric === "self_cooked_servings" ? "selected" : ""} onClick={() => update({ primaryGoalMetric: "self_cooked_servings" })}>自煮餐份</button></div></fieldset><label>本週目標<input name="weekly-goal-target" autoComplete="off" type="number" min="1" max="21" value={profile.weeklyGoalTarget} onChange={(e) => {setGoalTargetEdited(true);update({ weeklyGoalTarget: Number(e.target.value) });}} /></label><fieldset><legend>每週最多三則智慧提醒</legend>{([['expiringIngredients','即期食材'],['plannedMeals','已安排料理'],['weeklyRhythm','本週節奏']] as const).map(([key,label]) => <label className="check-row" key={key}><input name={`reminder-${key}`} type="checkbox" checked={profile.reminders[key]} onChange={(e) => update({ reminders: { ...profile.reminders, [key]: e.target.checked } })} />{label}</label>)}<small>21:00–09:00 不推播；Push 權限會在首次料理完成後再詢問。</small></fieldset></>}
      {error && <p role="alert" className="onboarding-error">{error}</p>}<footer className="onboarding-actions">{step > 1 && <button type="button" onClick={() => update({ currentStep: step - 1 })}>上一步</button>}<button type="button" className="primary-btn" disabled={!valid || busy} onClick={step === 5 ? () => void finish() : next}>{busy ? "儲存中…" : step === 5 ? "成立主廚檔案" : "繼續"}</button></footer>
    </section>
  </main>;
}
