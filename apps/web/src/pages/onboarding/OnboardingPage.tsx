import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { HabitBarrier, OnboardingProfile } from "@coocoo/contracts";
import { api, json } from "@/shared/api/client";
import { stateQueryKey } from "@/entities/app-state/model";
import {
  emptyOnboardingDraft,
  readOnboardingDraft,
  saveOnboardingDraft,
} from "@/shared/model/onboarding-draft";
import { startGoogleAuth, supabase } from "@/shared/auth/supabase";
import { ChefAvatar, type ChefMood } from "./ChefAvatar";
import { PassportTicket } from "./PassportTicket";
import { completeOnboardingProfile, isOnboardingStepValid } from "./validation";
import {
  addCustomRestriction,
  hasRestriction,
  restrictionQuickOptions,
  toggleRestriction,
} from "./restrictions";
import "./OnboardingPage.css";

interface ChoiceProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}

interface StepCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

const barriers: Array<[HabitBarrier, string]> = [
  ["no_ideas", "常常沒想法"],
  ["low_energy", "下班沒力氣"],
  ["no_time", "時間不固定"],
  ["ingredients_waste", "食材容易放壞"],
  ["cleanup", "不想收拾"],
];
const cookwareOptions = ["電磁爐", "瓦斯爐", "電鍋", "快煮鍋", "氣炸鍋", "微波爐"];
const stepTitles = ["口味與飲食安全", "餐桌與廚具", "登入與通行證"];

function Tick() {
  return (
    <span className="choice-tick" aria-hidden="true">
      ✓
    </span>
  );
}

function Choice({ selected, onClick, children, danger = false }: ChoiceProps) {
  let className = "onboarding-choice";

  if (selected) {
    className += " selected";
  }
  if (danger) {
    className += " danger";
  }
  return (
    <button type="button" {...{ className, onClick }}>
      <span>{children}</span>
      <Tick />
    </button>
  );
}

function StepCard({ title, description, children, className = "" }: StepCardProps) {
  return (
    <section className={`onboarding-step-card ${className}`}>
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function OnboardingPage({
  onComplete,
  onExit,
  canExit = false,
  initialStep,
}: {
  onComplete: () => void;
  onExit?: () => void;
  canExit?: boolean;
  initialStep?: number;
}) {
  const query = useQueryClient();
  const saved = readOnboardingDraft();
  const startingStep = Math.min(3, Math.max(1, initialStep ?? saved.currentStep));
  const [profile, setProfile] = useState<OnboardingProfile>({
    ...emptyOnboardingDraft,
    ...saved,
    currentStep: startingStep,
  });
  const [customCookware, setCustomCookware] = useState("");
  const [restrictionInput, setRestrictionInput] = useState("");
  const [flavorInput, setFlavorInput] = useState("");
  const [authStatus, setAuthStatus] = useState<"checking" | "signed-in" | "signed-out">(() =>
    supabase ? "checking" : "signed-in",
  );
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<ChefMood>("listen");
  const [nodding, setNodding] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [sealDropped, setSealDropped] = useState(false);
  const [error, setError] = useState("");
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
  const valid = useMemo(() => isOnboardingStepValid(step, profile), [profile, step]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setAuthStatus(data.session ? "signed-in" : "signed-out");
      })
      .catch(() => {
        if (active) setAuthStatus("signed-out");
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthStatus(session ? "signed-in" : "signed-out");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!stamped) return undefined;
    const timer = window.setTimeout(() => setSealDropped(true), 1450);
    return () => window.clearTimeout(timer);
  }, [stamped]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      const complete = completeOnboardingProfile(profile, new Date().toISOString());
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
    update({
      habitBarriers: profile.habitBarriers.includes(value)
        ? profile.habitBarriers.filter((item) => item !== value)
        : [...profile.habitBarriers, value],
    });
  };
  const toggleCookware = (value: string) => {
    cheer("applause");
    update({
      cookware: profile.cookware.some((item) => item.type === value)
        ? profile.cookware.filter((item) => item.type !== value)
        : [
            ...profile.cookware,
            {
              type: value,
              limitations: [],
            },
          ],
    });
  };
  const addCustomCookware = () => {
    const value = customCookware.trim();
    if (!value || profile.cookware.some((item) => item.type === value)) return;
    toggleCookware(value);
    setCustomCookware("");
  };
  const toggleHardRestriction = (option: (typeof restrictionQuickOptions)[number]) => {
    cheer("care");
    update({ restrictions: toggleRestriction(profile.restrictions, option) });
  };
  const addRestriction = () => {
    const next = addCustomRestriction(profile.restrictions, restrictionInput);
    if (next === profile.restrictions) return;
    cheer("care");
    update({ restrictions: next });
    setRestrictionInput("");
  };
  const addFlavor = () => {
    const value = flavorInput.trim();
    if (!value || profile.preferredFlavors.includes(value)) return;
    update({ preferredFlavors: [...profile.preferredFlavors, value] });
    setFlavorInput("");
  };
  const next = () => {
    cheer(step === 1 ? "applause" : step === 2 ? "care" : "listen");
    update({ currentStep: Math.min(3, step + 1) });
  };
  const confirmSignedIn = async () => {
    if (!supabase || authStatus === "signed-in") return true;
    setBusy(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session) {
        setAuthStatus("signed-out");
        setError("主廚設定已保存在草稿；請先完成登入，再按一次蓋章。");
        return false;
      }
      setAuthStatus("signed-in");
      return true;
    } catch {
      setError("暫時無法確認登入狀態，請檢查網路後再按一次蓋章。");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const stampOrFinish = async () => {
    if (!stamped) {
      if (!(await confirmSignedIn())) return;
      setStamped(true);
      cheer("sealed");
      return;
    }
    await finish();
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-device">
        <header className="onboarding-topbar">
          <ChefAvatar mood={mood} isNodding={nodding} onClick={() => cheer(mood)} />
          <div className="onboarding-top-actions">
            {canExit && (
              <button type="button" onClick={onExit}>
                稍後繼續
              </button>
            )}
            <span>{String(step).padStart(2, "0")} / 03</span>
          </div>
          <p>
            首次設定 · {String(step).padStart(2, "0")} {stepTitles[step - 1]}
          </p>
        </header>
        <div
          className="onboarding-progress"
          role="progressbar"
          aria-label={`第 ${step} 步，共 3 步`}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
        >
          <span style={{ width: `${(step * 100) / 3}%` }} />
        </div>

        <div className="onboarding-content">
          <div className={`onboarding-stack onboarding-step-${step} step-slide-down`} key={step}>
            {step === 1 && (
              <>
                <div className="chef-open">
                  <span className="chef-open-icon material-symbols-outlined" aria-hidden="true">
                    restaurant
                  </span>
                  <div>
                    <strong>Hi！我是你的專屬主廚 CooCoo。</strong>
                    <p>
                      沒有標準答案，我們只想讓第一次推薦更可行。你的回答會決定我怎麼挑菜、怎麼排餐。
                    </p>
                  </div>
                </div>
                <StepCard title="平常可用時間">
                  <div className="slider-row">
                    <input
                      name="available-minutes"
                      type="range"
                      min="5"
                      max="180"
                      step="5"
                      value={profile.availableMinutes}
                      onChange={(event) => update({ availableMinutes: Number(event.target.value) })}
                    />
                    <strong>{profile.availableMinutes} 分鐘</strong>
                  </div>
                </StepCard>
                <StepCard title="常用餐期">
                  <div className="choices three">
                    {(
                      [
                        ["breakfast", "早餐"],
                        ["lunch", "午餐"],
                        ["dinner", "晚餐"],
                      ] as const
                    ).map(([value, label]) => (
                      <Choice
                        key={value}
                        selected={profile.plannedMealSlots.includes(value)}
                        onClick={() =>
                          update({
                            plannedMealSlots: profile.plannedMealSlots.includes(value)
                              ? profile.plannedMealSlots.filter((item) => item !== value)
                              : [...profile.plannedMealSlots, value],
                          })
                        }
                      >
                        {label}
                      </Choice>
                    ))}
                  </div>
                </StepCard>
                <StepCard title="喜歡的口味">
                  <div className="tag-input">
                    <input
                      value={flavorInput}
                      placeholder="例如：清爽、台式、微辣"
                      onChange={(event) => setFlavorInput(event.target.value)}
                    />
                    <button type="button" disabled={!flavorInput.trim()} onClick={addFlavor}>
                      ＋
                    </button>
                  </div>
                  <div className="tag-list">
                    {profile.preferredFlavors.map((flavor) => (
                      <span className="tag" key={flavor}>
                        {flavor}
                        <button
                          type="button"
                          aria-label={`移除 ${flavor}`}
                          onClick={() =>
                            update({
                              preferredFlavors: profile.preferredFlavors.filter(
                                (item) => item !== flavor,
                              ),
                            })
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </StepCard>
                <StepCard
                  title="過敏原或絕對不吃"
                  description="可多選常見過敏原，其他項目也能自行新增；全部都會成為硬限制。"
                >
                  <div className="restriction-chip-grid" aria-label="常見過敏原快選">
                    {restrictionQuickOptions.map((option) => {
                      const selected = hasRestriction(profile.restrictions, option);
                      return (
                        <button
                          type="button"
                          className={`restriction-chip ${selected ? "selected" : ""}`}
                          aria-pressed={selected}
                          key={option.id}
                          onClick={() => toggleHardRestriction(option)}
                        >
                          <span>{option.label}</span>
                          <i aria-hidden="true">✓</i>
                        </button>
                      );
                    })}
                  </div>
                  <div className="tag-input restriction-input">
                    <input
                      name="dietary-restrictions"
                      maxLength={24}
                      placeholder="其他不能吃，例如：香菜"
                      value={restrictionInput}
                      onChange={(event) => setRestrictionInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addRestriction();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!restrictionInput.trim()}
                      aria-label="新增其他不能吃的食物"
                      onClick={addRestriction}
                    >
                      ＋
                    </button>
                  </div>
                  <div className="tag-list">
                    {profile.restrictions
                      .filter(
                        (item) =>
                          !restrictionQuickOptions.some(
                            (option) => option.id === item.id || option.label === item.label,
                          ),
                      )
                      .map((item) => (
                        <span className="tag" key={item.id}>
                          {item.label}
                          <button
                            type="button"
                            aria-label={`移除 ${item.label}`}
                            onClick={() =>
                              update({
                                restrictions: profile.restrictions.filter(
                                  (restriction) => restriction.id !== item.id,
                                ),
                              })
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                  <p className="safety-note">
                    硬限制會寫入 dietary_restrictions，所有推薦與 AI 調整都必須遵守。
                  </p>
                </StepCard>
              </>
            )}

            {step === 2 && (
              <>
                <div className="chef-open">
                  <span className="chef-open-icon material-symbols-outlined" aria-hidden="true">
                    skillet
                  </span>
                  <div>
                    <strong>我先確認你真的能用什麼來煮。</strong>
                    <p>份量、廚具與日常卡點會直接影響我能推薦哪些料理。</p>
                  </div>
                </div>
                <StepCard className="step2-household" title="通常幾人吃？">
                  <div className="onboarding-counter">
                    <span>人份</span>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          update({ householdServings: Math.max(1, profile.householdServings - 1) })
                        }
                      >
                        −
                      </button>
                      <strong>{profile.householdServings}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          update({ householdServings: Math.min(12, profile.householdServings + 1) })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </StepCard>
                <StepCard
                  className="step2-cookware"
                  title="可用廚具"
                  description="至少選一項；其他廚具也能自行新增。"
                >
                  <div className="choices">
                    {cookwareOptions.map((value) => (
                      <Choice
                        key={value}
                        selected={profile.cookware.some((item) => item.type === value)}
                        onClick={() => toggleCookware(value)}
                      >
                        {value}
                      </Choice>
                    ))}
                  </div>
                  <div className="tag-input">
                    <input
                      name="custom-cookware"
                      maxLength={24}
                      placeholder="例如：卡式爐、蒸烤箱"
                      value={customCookware}
                      onChange={(event) => setCustomCookware(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomCookware();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!customCookware.trim()}
                      onClick={addCustomCookware}
                    >
                      ＋
                    </button>
                  </div>
                  <div className="tag-list">
                    {profile.cookware
                      .filter((item) => !cookwareOptions.includes(item.type))
                      .map((item) => (
                        <span className="tag" key={item.type}>
                          {item.type}
                          <button
                            type="button"
                            aria-label={`移除 ${item.type}`}
                            onClick={() => toggleCookware(item.type)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                </StepCard>
                <StepCard title="最常卡在哪裡？" description="可多選。這會決定我第一則提醒的方式。">
                  <div className="choices">
                    {barriers.map(([value, label]) => (
                      <Choice
                        key={value}
                        selected={profile.habitBarriers.includes(value)}
                        onClick={() => toggleBarrier(value)}
                      >
                        {label}
                      </Choice>
                    ))}
                  </div>
                </StepCard>
              </>
            )}

            {step === 3 && (
              <>
                <div className="chef-open">
                  <span className="chef-open-icon material-symbols-outlined" aria-hidden="true">
                    military_tech
                  </span>
                  <div>
                    <strong>最後一步，登入並成立你的主廚檔案。</strong>
                    <p>同步設定後蓋章啟程；這一步不會建立、清空或修改冰箱庫存。</p>
                  </div>
                </div>
                <StepCard
                  title="登入並同步主廚檔案"
                  description="設定會跟著帳號，不會只留在這台裝置。"
                >
                  {supabase && authStatus === "checking" && (
                    <p className="safety-note">正在確認登入狀態…</p>
                  )}
                  {supabase && authStatus === "signed-out" && (
                    <button
                      type="button"
                      className="wide-action"
                      onClick={() => void startGoogleAuth()}
                    >
                      <span>使用 Google 登入</span>
                      <span>›</span>
                    </button>
                  )}
                  {authStatus === "signed-in" && (
                    <p className="safety-note safe">
                      {supabase
                        ? "登入完成，主廚設定可以安全同步。"
                        : "本機 Preview 使用測試資料；正式環境會先要求登入。"}
                    </p>
                  )}
                </StepCard>
                <p className="safety-note safe">
                  食材與保存期限請在完成設定後，前往「冰箱」頁新增或管理。
                </p>
                <PassportTicket
                  profile={{ ...profile, weeklyGoalTarget: 1 }}
                  isStamped={stamped}
                  isSealDropped={sealDropped}
                />
              </>
            )}
            {error && (
              <p role="alert" className="onboarding-error">
                {error}
              </p>
            )}
          </div>
        </div>

        <footer className="onboarding-actions">
          <button
            type="button"
            className="ghost"
            disabled={step === 1}
            onClick={() => {
              setMood("listen");
              update({ currentStep: Math.max(1, step - 1) });
            }}
          >
            ‹ 上一步
          </button>
          <small>
            {valid
              ? step === 3 && authStatus !== "signed-in"
                ? "蓋章時會確認登入"
                : "資料會先保存在草稿"
              : "請完成本步必要資料"}
          </small>
          <button
            type="button"
            className={`primary ${step === 3 && stamped ? "ready" : ""}`}
            disabled={!valid || busy || (step === 3 && stamped && !sealDropped)}
            onClick={
              step === 3
                ? () => {
                    void stampOrFinish();
                  }
                : next
            }
          >
            {busy
              ? step === 3 && stamped
                ? "儲存中…"
                : "確認中…"
              : step === 3
                ? stamped
                  ? "啟程！進入今日"
                  : "蓋章，成立主廚檔案"
                : "繼續 ›"}
          </button>
        </footer>
      </section>
    </main>
  );
}
