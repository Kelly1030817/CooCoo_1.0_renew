import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DietaryRestriction, MealSlot, OnboardingProfile } from "@coocoo/contracts";
import { emptyOnboardingDraft, readOnboardingDraft, saveOnboardingDraft } from "@/shared/model/onboarding-draft";
import { isSupabaseConfigured, readAuthCallbackIssue, requestEmailOtp, startGoogleAuth, supabase, verifyEmailOtp } from "@/shared/auth/supabase";
import { api, json } from "@/shared/api/client";
import { stateQueryKey } from "@/entities/app-state/model";
import { getCustomCookware, KNOWN_COOKWARE_TYPES, setCustomCookwareName } from "./cookware";
import { addPreferredFlavor, removePreferredFlavor } from "./flavors";

const steps = ["相談室", "料理份量", "廚具", "飲食限制", "食材盤點", "餐費預算", "自煮目標", "圓夢目標", "登入同步", "資料總覽"];
const restrictionChoices = ["花生", "堅果", "蛋", "牛奶", "甲殼類", "魚", "麩質", "不吃牛", "全素"];
const mealSlots: { id: MealSlot; label: string }[] = [{ id: "breakfast", label: "早餐" }, { id: "lunch", label: "午餐" }, { id: "dinner", label: "晚餐" }];

export function OnboardingPage({ onComplete }: { onComplete: (profile: OnboardingProfile) => void }) {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState(readOnboardingDraft);
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [finishError, setFinishError] = useState("");
  const step = profile.currentStep;
  const update = (next: Partial<OnboardingProfile>) => setProfile((current) => {
    const value = { ...current, ...next };
    saveOnboardingDraft(value);
    return value;
  });
  const canContinue = useMemo(() => {
    if (step === 3) return profile.cookware.some((item) => item.type.trim().length > 0);
    if (step === 5) return profile.inventoryReviewed;
    if (step === 6) return profile.dailyMealBudget > 0 && profile.outsideMealComparisonPrice > 0 && profile.plannedMealSlots.length > 0;
    if (step === 8) return profile.dreamName.trim().length > 0 && profile.dreamTargetAmount > 0;
    if (step === 9) return authVerified;
    return true;
  }, [authVerified, profile, step]);
  const next = () => update({ currentStep: Math.min(10, step + 1) });
  const finish = async () => {
    const complete = { ...profile, cookware: profile.cookware.filter((item) => item.type.trim()).map((item) => ({ ...item, type: item.type.trim() })), status: "complete" as const, completedAt: new Date().toISOString() };
    try {
      await api("/onboarding", json("PUT", complete));
      saveOnboardingDraft(complete);
      await queryClient.invalidateQueries({ queryKey: stateQueryKey });
      onComplete(complete);
    } catch (reason) {
      setFinishError(reason instanceof Error ? reason.message : "設定同步失敗");
    }
  };
  return <main className="onboarding-shell">
    <div className="onboarding-progress" aria-label={`首次設定第 ${step} 步，共 10 步`}>
      <span>{String(step).padStart(2, "0")} / 10</span><div><i style={{ width: `${step * 10}%` }} /></div><strong>{steps[step - 1]}</strong>
    </div>
    <section className="consultation-card">
      <div className="chef-mark" aria-hidden="true">C</div>
      <div className="consultation-copy">
        <p className="eyebrow">主廚相談室 · {steps[step - 1]}</p>
        <StepContent profile={profile} update={update} email={email} setEmail={setEmail} codeSent={codeSent} setCodeSent={setCodeSent} authVerified={authVerified} setAuthVerified={setAuthVerified} />
      </div>
    </section>
    {finishError && <p role="alert" className="offline-error">{finishError}。本機草稿仍在，尚未標記完成。</p>}
    <div className="onboarding-actions">
      {step > 1 && <button className="secondary-btn" onClick={() => update({ currentStep: step - 1 })}>上一步</button>}
      {step < 10 ? <button className="primary-btn" disabled={!canContinue} onClick={next}>繼續</button> : <button className="primary-btn stamp-button" onClick={finish}>蓋章，開始自煮</button>}
    </div>
    <button className="start-over" onClick={() => { saveOnboardingDraft(emptyOnboardingDraft); setProfile(emptyOnboardingDraft); }}>清除這份草稿</button>
  </main>;
}

function StepContent({ profile, update, email, setEmail, codeSent, setCodeSent, authVerified, setAuthVerified }: { profile: OnboardingProfile; update: (value: Partial<OnboardingProfile>) => void; email: string; setEmail: (value: string) => void; codeSent: boolean; setCodeSent: (value: boolean) => void; authVerified: boolean; setAuthVerified: (value: boolean) => void }) {
  const step = profile.currentStep;
  if (step === 1) return <><h1>讓我陪你，把「今天吃什麼」變得容易一點。</h1><p>從逛市場到走進小廚房，CooCoo 會記得你的預算、廚具和不能吃的東西，也把每一餐省下來的錢送往你的願望。</p><div className="speech-note">這次設定約 3–5 分鐘，中途關閉也能接著填。</div></>;
  if (step === 2) return <><h1>你通常一次煮幾人份？</h1><p>每道餐仍可個別調整。多煮的餐份會放進熟食庫存，不會先算成已吃的自煮餐。</p><Counter value={profile.householdServings} onChange={(householdServings) => update({ householdServings })} /></>;
  if (step === 3) return <CookwareStep profile={profile} update={update} />;
  if (step === 4) return <DietaryStep profile={profile} update={update} />;
  if (step === 5) return <><h1>先看看家裡已經有什麼。</h1><p>正式完成後可以掃發票或用說的新增；現在也可以明確選擇空冰箱。</p><button className={`inventory-empty ${profile.hasNoInventory ? "selected" : ""}`} onClick={() => update({ inventoryReviewed: true, hasNoInventory: true })}><span>冰箱目前沒有食材</span><small>從第一份採買清單開始</small></button><button className={`inventory-empty ${profile.inventoryReviewed && !profile.hasNoInventory ? "selected" : ""}`} onClick={() => update({ inventoryReviewed: true, hasNoInventory: false })}><span>我有食材，稍後盤點</span><small>設定完成後進入冰箱新增</small></button></>;
  if (step === 6) return <><h1>一天總共想花多少餐費？</h1><p>我們會依你要規劃的餐期提出分配建議，你仍可調整每餐。</p><MoneyInput value={profile.dailyMealBudget} onChange={(dailyMealBudget) => update({ dailyMealBudget })} /><ChoiceGrid choices={mealSlots.map((item) => item.label)} selected={mealSlots.filter((item) => profile.plannedMealSlots.includes(item.id)).map((item) => item.label)} onToggle={(label) => { const id = mealSlots.find((item) => item.label === label)!.id; update({ plannedMealSlots: profile.plannedMealSlots.includes(id) ? profile.plannedMealSlots.filter((item) => item !== id) : [...profile.plannedMealSlots, id] }); }} /><div className="budget-suggestion">系統建議：每餐約 NT$ {Math.floor(profile.dailyMealBudget / Math.max(1, profile.plannedMealSlots.length))}</div><label className="field-label">你通常一餐外食花多少？<MoneyInput value={profile.outsideMealComparisonPrice} onChange={(outsideMealComparisonPrice) => update({ outsideMealComparisonPrice })} /></label></>;
  if (step === 7) return <><h1>這週想從幾餐自煮開始？</h1><p>先讓目標小到真的做得到。臨時不煮也能順延，不會算你失敗。</p><Counter value={profile.weeklyHomeCookTarget} max={21} onChange={(weeklyHomeCookTarget) => update({ weeklyHomeCookTarget })} /><strong className="counter-caption">每週預計自煮 {profile.weeklyHomeCookTarget} 餐</strong></>;
  if (step === 8) return <><h1>每一餐省下來，要送往哪個願望？</h1><label className="field-label">願望名稱<input className="field" value={profile.dreamName} onChange={(event) => update({ dreamName: event.target.value })} placeholder="例如：冬天去北海道" /></label><label className="field-label">目標金額<MoneyInput value={profile.dreamTargetAmount} onChange={(dreamTargetAmount) => update({ dreamTargetAmount })} /></label></>;
  if (step === 9) return <AuthStep email={email} setEmail={setEmail} codeSent={codeSent} setCodeSent={setCodeSent} verified={authVerified} setVerified={setAuthVerified} />;
  return <><h1>你的 CooCoo 通行證準備好了。</h1><p>確認後蓋下第一枚章。之後可以在帳號設定修改這些資料。</p><div className="passport"><span>COOCOO DREAM PASSPORT</span><h2>{profile.dreamName}</h2><dl><div><dt>每週自煮</dt><dd>{profile.weeklyHomeCookTarget} 餐</dd></div><div><dt>每日餐費</dt><dd>NT$ {profile.dailyMealBudget}</dd></div><div><dt>常用份量</dt><dd>{profile.householdServings} 人份</dd></div><div><dt>不能吃</dt><dd>{profile.restrictions.map((item) => item.label).join("、") || "無"}</dd></div></dl><div className="passport-stamp">READY</div></div></>;
}

function DietaryStep({ profile, update }: { profile: OnboardingProfile; update: (value: Partial<OnboardingProfile>) => void }) {
  const [flavorInput, setFlavorInput] = useState("");

  const handleAddFlavor = () => {
    if (!flavorInput.trim()) return;
    update({ preferredFlavors: addPreferredFlavor(profile.preferredFlavors, flavorInput) });
    setFlavorInput("");
  };

  const handleRemoveFlavor = (target: string) => {
    update({ preferredFlavors: removePreferredFlavor(profile.preferredFlavors, target) });
  };

  return (
    <>
      <h1>哪些食材一定不能出現？</h1>
      <p>過敏與禁食會當成硬限制；口味偏好則只影響排序。</p>
      <ChoiceGrid
        choices={restrictionChoices}
        selected={profile.restrictions.map((item) => item.label)}
        onToggle={(label) =>
          update({
            restrictions: toggle(
              profile.restrictions,
              label,
              (value): DietaryRestriction => ({
                id: `restriction-${value}`,
                label: value,
                kind: value.startsWith("不吃") || value === "全素" ? "avoid" : "allergy",
                ingredientKeys: [value],
                isHardLimit: true,
              })
            ),
          })
        }
      />
      <div className="flavor-group">
        <label className="field-label" htmlFor="flavor-input">
          喜歡的口味
        </label>
        <div className="flavor-input-row">
          <input
            id="flavor-input"
            className="field flavor-input-field"
            value={flavorInput}
            onChange={(e) => setFlavorInput(e.target.value)}
            placeholder="例如：清爽（輸入後點 ＋）"
          />
          <button
            type="button"
            className="flavor-add-btn"
            onClick={handleAddFlavor}
            disabled={!flavorInput.trim()}
            aria-label="新增口味"
          >
            ＋
          </button>
        </div>
        {profile.preferredFlavors.length > 0 && (
          <div className="flavor-tags">
            {profile.preferredFlavors.map((flavor) => (
              <span key={flavor} className="flavor-tag">
                {flavor}
                <button
                  type="button"
                  className="flavor-tag-remove"
                  onClick={() => handleRemoveFlavor(flavor)}
                  aria-label={`移除 ${flavor}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CookwareStep({ profile, update }: { profile: OnboardingProfile; update: (value: Partial<OnboardingProfile>) => void }) {
  const existingCustom = getCustomCookware(profile.cookware);
  const [showCustom, setShowCustom] = useState(Boolean(existingCustom));
  const selected = profile.cookware.map((item) => item.type);
  if (showCustom) selected.push("其他");
  const choices = [...KNOWN_COOKWARE_TYPES, "其他"];
  const toggleCookware = (type: string) => {
    if (type === "其他") {
      if (showCustom) update({ cookware: setCustomCookwareName(profile.cookware, "") });
      setShowCustom((current) => !current);
      return;
    }
    update({ cookware: toggle(profile.cookware, type, (value) => ({ type: value, limitations: [] })) });
  };
  return <><h1>你的小廚房有哪些裝備？</h1><p>至少選一樣。找不到的廚具可以自行輸入，CooCoo 會把名稱交給後端模型，保守判斷它適合的料理方式。</p><ChoiceGrid choices={choices} selected={selected} onToggle={toggleCookware} />{showCustom ? <label className="field-label custom-cookware-field">其他廚具名稱<input className="field" maxLength={40} autoFocus value={existingCustom?.type ?? ""} onChange={(event) => update({ cookware: setCustomCookwareName(profile.cookware, event.target.value) })} placeholder="例如：多功能快煮鍋、卡式爐" /><small>請輸入產品類型，不要輸入操作指令；模型不確定的功能不會擅自假設。</small></label> : null}</>;
}

function ChoiceGrid({ choices, selected, onToggle }: { choices: string[]; selected: string[]; onToggle: (value: string) => void }) { return <div className="choice-grid">{choices.map((choice) => <button key={choice} className={selected.includes(choice) ? "selected" : ""} onClick={() => onToggle(choice)} aria-pressed={selected.includes(choice)}>{choice}<span>{selected.includes(choice) ? "✓" : "+"}</span></button>)}</div>; }
function Counter({ value, onChange, max = 12 }: { value: number; onChange: (value: number) => void; max?: number }) { return <div className="counter"><button aria-label="減少" onClick={() => onChange(Math.max(1, value - 1))}>−</button><strong>{value}</strong><button aria-label="增加" onClick={() => onChange(Math.min(max, value + 1))}>＋</button></div>; }
function MoneyInput({ value, onChange }: { value: number; onChange: (value: number) => void }) { return <div className="money-input"><span>NT$</span><input inputMode="numeric" value={value || ""} onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} /></div>; }
function AuthStep({ email, setEmail, codeSent, setCodeSent, verified, setVerified }: { email: string; setEmail: (value: string) => void; codeSent: boolean; setCodeSent: (value: boolean) => void; verified: boolean; setVerified: (value: boolean) => void }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [callbackIssue] = useState(() => readAuthCallbackIssue(window.location.hash));
  const previewAuth = import.meta.env.DEV && import.meta.env.VITE_USE_REAL_API !== "true";
  useEffect(() => {
    if (!supabase || previewAuth) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setVerified(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setVerified(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [previewAuth, setVerified]);
  const request = async () => { setBusy(true); setError(""); try { if (previewAuth) setCodeSent(true); else { await requestEmailOtp(email); setCodeSent(true); } } catch (reason) { setError(reason instanceof Error ? reason.message : "無法寄出驗證碼"); } finally { setBusy(false); } };
  const verify = async () => { setBusy(true); setError(""); try { if (previewAuth && token === "123456") setVerified(true); else { await verifyEmailOtp(email, token); setVerified(true); } } catch (reason) { setError(reason instanceof Error ? reason.message : "驗證碼不正確"); } finally { setBusy(false); } };
  const google = async () => { setBusy(true); setError(""); try { if (previewAuth) { setVerified(true); setBusy(false); } else await startGoogleAuth(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Google 登入未完成"); setBusy(false); } };
  return <><h1>登入，讓資料跟著你走。</h1><p>封閉測試只接受邀請名單。現在的本機草稿會在驗證完成後同步到你的帳號。</p>{callbackIssue && <p role="alert" className="offline-error">{callbackIssue.message}</p>}<label className="field-label">受邀 Email<input className="field" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setVerified(false); }} placeholder="you@example.com" /></label><button className="otp-button" disabled={busy || !email.includes("@")} onClick={request}>{codeSent ? "重新寄送登入驗證信" : "寄送登入驗證信"}</button>{codeSent && previewAuth && <div className="otp-verify"><input className="field" inputMode="numeric" maxLength={6} value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))} placeholder="六位數驗證碼" /><button disabled={busy || token.length !== 6} onClick={verify}>{verified ? "已驗證" : "驗證"}</button></div>}{codeSent && !previewAuth && <small className="integration-note">請開啟最新驗證信中的登入連結；回到 CooCoo 後會自動完成登入。每封連結只能使用一次。</small>}<button className="google-button" disabled={busy || (!isSupabaseConfigured && !previewAuth)} onClick={google}>使用 Google 繼續</button>{error && <small className="offline-error">{error}</small>}<small className="integration-note">{previewAuth ? "本機開發預覽請輸入 123456；production build 不提供模擬登入。" : isSupabaseConfigured ? "Beta 階段使用 Supabase 預設登入連結；正式寄件設定完成後再切換六位數 OTP。" : "尚未設定 Supabase 環境變數，因此正式登入已停用。"}</small></>;
}
function toggle<T>(items: T[], key: string, create: (key: string) => T) { const exists = items.findIndex((item) => (item as { type?: string; label?: string }).type === key || (item as { label?: string }).label === key); return exists >= 0 ? items.filter((_, index) => index !== exists) : [...items, create(key)]; }
