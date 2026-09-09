import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DietaryRestriction, MealSlot, OnboardingProfile } from "@coocoo/contracts";
import { emptyOnboardingDraft, readOnboardingDraft, saveOnboardingDraft } from "@/shared/model/onboarding-draft";
import { isSupabaseConfigured, readAuthCallbackIssue, requestEmailOtp, startGoogleAuth, supabase, verifyEmailOtp } from "@/shared/auth/supabase";
import { api, json } from "@/shared/api/client";
import { stateQueryKey } from "@/entities/app-state/model";
import { getCustomCookware, KNOWN_COOKWARE_TYPES, setCustomCookwareName } from "./cookware";
import { addPreferredFlavor, removePreferredFlavor } from "./flavors";
import { ChefAvatar, type ChefMood } from "./ChefAvatar";
import { EquipmentRadar } from "./EquipmentRadar";
import { PassportTicket } from "./PassportTicket";
import "./OnboardingPage.css";

const stepTitles = [
  "相談室開場",
  "料理份量",
  "小廚房裝備",
  "飲食限制與口味",
  "食材盤點",
  "餐費預算與餐期",
  "自煮目標",
  "圓夢目標",
  "登入同步",
  "圓夢通行證蓋章",
];

const restrictionChoices = ["花生", "堅果", "蛋", "牛奶", "甲殼類", "魚", "麩質", "不吃牛", "全素"];
const mealSlots: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "早餐" },
  { id: "lunch", label: "午餐" },
  { id: "dinner", label: "晚餐" },
];

export function OnboardingPage({
  onComplete,
  initialStep,
  canExit = false,
  onExit,
}: {
  onComplete: (profile: OnboardingProfile) => void;
  initialStep?: number;
  canExit?: boolean;
  onExit?: () => void;
}) {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<OnboardingProfile>(() => {
    const draft = readOnboardingDraft();
    if (initialStep !== undefined) {
      return { ...draft, currentStep: initialStep, status: "draft" };
    }
    return draft;
  });
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [isStamped, setIsStamped] = useState(false);
  const [isSealDropped, setIsSealDropped] = useState(false);
  const [isSignatureFinished, setIsSignatureFinished] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  // Living Chef state
  const [chefMood, setChefMood] = useState<ChefMood>("listen");
  const [isNodding, setIsNodding] = useState(false);
  const nodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Anti-restart on mutation tracking
  const lastRenderedStepRef = useRef<number>(profile.currentStep);
  const [animClass, setAnimClass] = useState("step-slide-down");

  const step = profile.currentStep;

  const triggerChefReaction = (mood: ChefMood) => {
    setChefMood(mood);
    setIsNodding(true);
    if (nodTimerRef.current) clearTimeout(nodTimerRef.current);
    nodTimerRef.current = setTimeout(() => setIsNodding(false), 550);
  };

  const update = (next: Partial<OnboardingProfile>) => {
    setProfile((current) => {
      const value = { ...current, ...next };
      saveOnboardingDraft(value);
      return value;
    });
  };

  const goToStep = (targetStep: number) => {
    const nextStep = Math.max(1, Math.min(10, targetStep));
    if (nextStep !== lastRenderedStepRef.current) {
      lastRenderedStepRef.current = nextStep;
      setAnimClass("step-slide-down");
    } else {
      setAnimClass("");
    }
    update({ currentStep: nextStep });
  };

  const canContinue = useMemo(() => {
    if (step === 3) return profile.cookware.some((item) => item.type.trim().length > 0);
    if (step === 5) return profile.inventoryReviewed;
    if (step === 6) {
      return (
        profile.dailyMealBudget > 0 &&
        profile.outsideMealComparisonPrice > 0 &&
        profile.plannedMealSlots.length > 0
      );
    }
    if (step === 8) return profile.dreamName.trim().length > 0 && profile.dreamTargetAmount > 0;
    if (step === 9) return authVerified;
    return true;
  }, [authVerified, profile, step]);

  const handleNext = () => {
    if (step < 10) {
      goToStep(step + 1);
    } else {
      if (!isStamped) {
        setIsStamped(true);
        triggerChefReaction("listen");

        // Phase 1: Signature writes "CooCoo" (0s ~ 1.05s)
        // Phase 2: Golden underline sweeps below (1.05s ~ 1.47s)
        // Phase 3: Forcefully slam down seal stamp after signature and underline finish (1.5s)
        setTimeout(() => {
          setIsSealDropped(true);
          triggerChefReaction("sealed");
          if (typeof window !== "undefined" && window.navigator?.vibrate) {
            window.navigator.vibrate([35, 55, 30]);
          }
        }, 1500);

        // Phase 4: Signature & Stamp complete, unlock next action (2.1s)
        setTimeout(() => {
          setIsSignatureFinished(true);
        }, 2100);
      } else if (isSignatureFinished && !isFlying) {
        handleFlightTransition();
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      goToStep(step - 1);
    }
  };

  const handleFlightTransition = () => {
    setIsFlying(true);
    setTimeout(() => {
      void finish();
    }, 720);
  };

  const finish = async () => {
    const complete: OnboardingProfile = {
      ...profile,
      cookware: profile.cookware
        .filter((item) => item.type.trim())
        .map((item) => ({ ...item, type: item.type.trim() })),
      status: "complete",
      completedAt: new Date().toISOString(),
    };
    try {
      await api("/onboarding", json("PUT", complete));
      saveOnboardingDraft(complete);
      await queryClient.invalidateQueries({ queryKey: stateQueryKey });
      onComplete(complete);
    } catch (reason) {
      setIsFlying(false);
      setFinishError(reason instanceof Error ? reason.message : "設定同步失敗");
    }
  };

  return (
    <main className="onboarding-shell">
      <div className="onboarding-card-wrapper">
        {/* Sticky Top Header */}
        <div className="onboarding-header-nav px-4 pt-3 pb-2.5">
          <div className="flex items-center justify-between gap-3">
            <ChefAvatar
              mood={chefMood}
              isNodding={isNodding}
              onClick={() => triggerChefReaction("listen")}
            />
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono font-black text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                {String(step).padStart(2, "0")} / 10
              </div>
              {canExit && onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  aria-label="回到主頁"
                  className="spring-btn text-[11px] font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>回到主頁</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-[10px] text-stone-500 font-bold mt-1 mb-2">
            {canExit ? "主廚相談室十步設定" : "首次設定"} · {String(step).padStart(2, "0")} {stepTitles[step - 1]}
          </div>

          <div
            className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={10}
            aria-label={`首次設定第 ${step} 步，共 10 步`}
          >
            <div
              className="bg-amber-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${step * 10}%` }}
            />
          </div>
        </div>

        {/* Step Content Area */}
        <div className="step-content-area text-left flight-viewport">
          <div className={animClass}>
            <StepContent
              step={step}
              profile={profile}
              update={update}
              goToStep={goToStep}
              triggerChefReaction={triggerChefReaction}
              email={email}
              setEmail={setEmail}
              codeSent={codeSent}
              setCodeSent={setCodeSent}
              authVerified={authVerified}
              setAuthVerified={setAuthVerified}
              isStamped={isStamped}
              isSealDropped={isSealDropped}
              isFlying={isFlying}
            />
          </div>
        </div>

        {finishError && (
          <div role="alert" className="offline-error mx-4 mb-2">
            {finishError.replace(/[。.]+$/, "")}。本機草稿仍在，尚未標記完成。
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="onboarding-bottom-actions">
          <button
            type="button"
            disabled={step === 1 || isFlying}
            onClick={handlePrev}
            className="spring-btn text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none px-3.5 py-2.5 rounded-xl flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>上一步</span>
          </button>

          <span className="text-[10px] text-stone-400 font-medium hidden sm:inline">
            草稿本機安全暫存中
          </span>

          <button
            type="button"
            disabled={!canContinue || (step === 10 && isStamped && !isSignatureFinished) || isFlying}
            onClick={handleNext}
            className={`spring-btn text-xs font-black py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-all ${
              step === 10 && isSignatureFinished
                ? "bg-stone-900 hover:bg-black text-amber-300 active:scale-95 shadow-md"
                : "bg-amber-600 hover:bg-amber-700 active:scale-95 text-white disabled:opacity-40 disabled:pointer-events-none"
            }`}
          >
            <span>
              {step === 10
                ? !isStamped
                  ? "蓋章，開始自煮"
                  : !isSignatureFinished
                    ? isSealDropped
                      ? "認證圓章蓋印確認中…"
                      : "主廚 CooCoo 親筆見證中…"
                    : "啟程！送入圓夢看板 ➔"
                : "繼續"}
            </span>
            {step < 10 && (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="start-over mt-4 block mx-auto text-[11px] text-stone-400 underline hover:text-stone-600"
        onClick={() => {
          saveOnboardingDraft(emptyOnboardingDraft);
          setProfile(emptyOnboardingDraft);
          setIsStamped(false);
          setIsSealDropped(false);
          setIsSignatureFinished(false);
          goToStep(1);
        }}
      >
        清除這份草稿，從頭開始
      </button>
    </main>
  );
}

function StepContent({
  step,
  profile,
  update,
  goToStep,
  triggerChefReaction,
  email,
  setEmail,
  codeSent,
  setCodeSent,
  authVerified,
  setAuthVerified,
  isStamped,
  isSealDropped = isStamped,
  isFlying = false,
}: {
  step: number;
  profile: OnboardingProfile;
  update: (value: Partial<OnboardingProfile>) => void;
  goToStep: (targetStep: number) => void;
  triggerChefReaction: (mood: ChefMood) => void;
  email: string;
  setEmail: (value: string) => void;
  codeSent: boolean;
  setCodeSent: (value: boolean) => void;
  authVerified: boolean;
  setAuthVerified: (value: boolean) => void;
  isStamped: boolean;
  isSealDropped?: boolean;
  isFlying?: boolean;
}) {
  if (step === 1) {
    return (
      <div className="space-y-3.5">
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
              <path d="M15 2v19" />
              <path d="M5 2v4a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2" />
              <path d="M8 2v19" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="font-black text-amber-950 text-sm">
              下班辛苦了！我是你的專屬主廚 CooCoo。
            </div>
            <p className="text-stone-600 leading-relaxed font-medium text-xs">
              讓我陪你把「今天吃什麼」變得容易一點。從逛市場到走進小廚房，我會記得你的預算、廚具和不能吃的東西，也把每一餐省下來的錢送往你的願望。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-800 text-xs">
            <svg
              className="w-4 h-4 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>設定時間約 3–5 分鐘</span>
          </div>
          <p className="text-stone-500 text-[11px] leading-relaxed">
            中途如果關閉不用緊張，本機草稿隨時自動暫存，回到首頁即可無縫接著填。
          </p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-3.5">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-stone-900">你通常一次煮幾人份？</h2>
          <p className="text-stone-500 text-[11px]">
            每道餐仍可個別調整。多煮的餐份會放進熟食庫存，不會先算成已吃的自煮餐。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <span className="font-bold text-stone-800 text-xs">常用份量</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="減少份量"
              onClick={() => {
                update({ householdServings: Math.max(1, profile.householdServings - 1) });
                triggerChefReaction("listen");
              }}
              className="spring-btn w-8 h-8 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 font-bold flex items-center justify-center text-sm"
            >
              −
            </button>
            <span className="font-mono font-black text-lg text-stone-900 w-8 text-center">
              {profile.householdServings}
            </span>
            <button
              type="button"
              aria-label="增加份量"
              onClick={() => {
                update({ householdServings: Math.min(12, profile.householdServings + 1) });
                triggerChefReaction("applause");
              }}
              className="spring-btn w-8 h-8 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 font-bold flex items-center justify-center text-sm"
            >
              ＋
            </button>
            <span className="text-xs text-stone-500 font-medium">人份</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-[11px] text-amber-950 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-700 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            主廚 CooCoo 點評：
            {profile.householdServings === 1
              ? "單身小資族很適合一次煮 2 份，多的一份放入「熟食庫存」，隔天帶便當省時省力！"
              : "煮多份量食材消耗最快，食材重疊率高，最容易拉高省錢效益！"}
          </span>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <CookwareStep
        profile={profile}
        update={update}
        triggerChefReaction={triggerChefReaction}
      />
    );
  }

  if (step === 4) {
    return (
      <DietaryStep
        profile={profile}
        update={update}
        triggerChefReaction={triggerChefReaction}
      />
    );
  }

  if (step === 5) {
    return (
      <div className="space-y-3.5">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-stone-900">先看看家裡已經有什麼。</h2>
          <p className="text-stone-500 text-[11px]">
            正式完成後可以掃發票或手動新增；現在也可以明確選擇空冰箱。
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              update({ inventoryReviewed: true, hasNoInventory: true });
              triggerChefReaction("applause");
            }}
            className={`spring-btn w-full p-3.5 rounded-2xl border text-left transition-all ${
              profile.inventoryReviewed && profile.hasNoInventory
                ? "border-amber-600 bg-amber-50/80 shadow-xs"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <div className="font-black text-xs text-stone-900 flex items-center justify-between">
              <span>冰箱目前沒有食材</span>
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  profile.inventoryReviewed && profile.hasNoInventory
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "border-stone-300"
                }`}
              >
                {profile.inventoryReviewed && profile.hasNoInventory && (
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </span>
            </div>
            <p className="text-stone-500 text-[11px] mt-0.5">從第一份採買清單開始，零剩食包袱</p>
          </button>

          <button
            type="button"
            onClick={() => {
              update({ inventoryReviewed: true, hasNoInventory: false });
              triggerChefReaction("applause");
            }}
            className={`spring-btn w-full p-3.5 rounded-2xl border text-left transition-all ${
              profile.inventoryReviewed && !profile.hasNoInventory
                ? "border-amber-600 bg-amber-50/80 shadow-xs"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <div className="font-black text-xs text-stone-900 flex items-center justify-between">
              <span>我有食材，稍後盤點</span>
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  profile.inventoryReviewed && !profile.hasNoInventory
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "border-stone-300"
                }`}
              >
                {profile.inventoryReviewed && !profile.hasNoInventory && (
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </span>
            </div>
            <p className="text-stone-500 text-[11px] mt-0.5">設定完成後進入冰箱手動或拍照新增</p>
          </button>
        </div>
      </div>
    );
  }

  if (step === 6) {
    const slotsCount = Math.max(1, profile.plannedMealSlots.length);
    const perMealSuggest = Math.floor(profile.dailyMealBudget / slotsCount);

    return (
      <div className="space-y-3.5">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-stone-900">一天總共想花多少餐費？</h2>
          <p className="text-stone-500 text-[11px]">
            我們會依你要規劃的餐期提出分配建議，你仍可調整每餐。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs space-y-3">
          <div>
            <label className="block font-bold text-stone-700 text-[11px] mb-1">
              每日總餐費預算
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2">
              <span className="font-bold text-stone-400 text-xs">NT$</span>
              <input
                type="number"
                step={10}
                min={0}
                inputMode="numeric"
                value={profile.dailyMealBudget || ""}
                onChange={(e) => update({ dailyMealBudget: Math.max(0, Number(e.target.value)) })}
                className="font-mono font-black text-stone-900 text-sm w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 text-[11px] mb-1">
              規劃自煮的餐期（可複選）
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {mealSlots.map((slot) => {
                const active = profile.plannedMealSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      const nextSlots = active
                        ? profile.plannedMealSlots.filter((id) => id !== slot.id)
                        : [...profile.plannedMealSlots, slot.id];
                      if (nextSlots.length > 0) {
                        update({ plannedMealSlots: nextSlots });
                        triggerChefReaction("listen");
                      }
                    }}
                    className={`spring-btn py-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      active
                        ? "border-amber-600 bg-amber-50 text-amber-950 font-black"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    <span>{slot.label}</span> {active && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex justify-between items-center text-[11px] text-amber-950 font-bold">
            <span>系統建議每餐分配：</span>
            <span className="font-mono font-black text-amber-900">
              約 NT$ {perMealSuggest} / 餐
            </span>
          </div>

          <div>
            <label className="block font-bold text-stone-700 text-[11px] mb-1">
              你通常一餐外食花多少？
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2">
              <span className="font-bold text-stone-400 text-xs">NT$</span>
              <input
                type="number"
                step={10}
                min={0}
                inputMode="numeric"
                value={profile.outsideMealComparisonPrice || ""}
                onChange={(e) =>
                  update({ outsideMealComparisonPrice: Math.max(0, Number(e.target.value)) })
                }
                className="font-mono font-black text-stone-900 text-sm w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="space-y-3.5">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-stone-900">這週想從幾餐自煮開始？</h2>
          <p className="text-stone-500 text-[11px]">
            先讓目標小到真的做得到。臨時不煮也能順延，不會算你失敗。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="減少餐數"
              onClick={() => {
                update({
                  weeklyHomeCookTarget: Math.max(1, profile.weeklyHomeCookTarget - 1),
                });
                triggerChefReaction("listen");
              }}
              className="spring-btn w-10 h-10 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 font-bold flex items-center justify-center text-base"
            >
              −
            </button>
            <span className="font-mono font-black text-3xl text-stone-900 w-12 text-center">
              {profile.weeklyHomeCookTarget}
            </span>
            <button
              type="button"
              aria-label="增加餐數"
              onClick={() => {
                update({
                  weeklyHomeCookTarget: Math.min(21, profile.weeklyHomeCookTarget + 1),
                });
                triggerChefReaction("applause");
              }}
              className="spring-btn w-10 h-10 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 font-bold flex items-center justify-center text-base"
            >
              ＋
            </button>
          </div>
          <strong className="text-amber-900 font-black text-xs">
            每週預計自煮 {profile.weeklyHomeCookTarget} 餐（上限 21 餐）
          </strong>
        </div>

        <div className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1">
          <svg
            className="w-3.5 h-3.5 text-amber-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>自由增減每週目標餐數，臨時不煮自動順延無壓力</span>
        </div>
      </div>
    );
  }

  if (step === 8) {
    const perMealSave = Math.max(0, profile.outsideMealComparisonPrice - 80);
    const weeklySave = profile.weeklyHomeCookTarget * perMealSave;
    const targetWeeks = Math.max(1, Math.ceil(profile.dreamTargetAmount / Math.max(1, weeklySave)));

    return (
      <div className="space-y-3.5">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-stone-900">每一餐省下來，要送往哪個願望？</h2>
          <p className="text-stone-500 text-[11px]">把每一筆外食差額轉化為真實夢想動力。</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
          <div>
            <label className="block font-bold text-stone-700 text-[11px] mb-1">願望名稱</label>
            <input
              type="text"
              value={profile.dreamName}
              onChange={(e) => update({ dreamName: e.target.value })}
              placeholder="例如：冬天去北海道看初雪"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 text-[11px] mb-1">
              目標金額 (TWD)
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2">
              <span className="font-bold text-stone-400 text-xs">NT$</span>
              <input
                type="number"
                step="1000"
                inputMode="numeric"
                value={profile.dreamTargetAmount || ""}
                onChange={(e) =>
                  update({ dreamTargetAmount: Math.max(0, Number(e.target.value)) })
                }
                className="font-mono font-black text-stone-900 text-sm w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-emerald-950">
              <span>即時外送替代試算：</span>
              <span className="font-mono text-emerald-800">每週存 NT$ {weeklySave}</span>
            </div>
            <p className="text-[10px] text-emerald-800/80 leading-relaxed">
              少吃高價外送 ➔ 約{" "}
              <strong className="font-black text-emerald-900 font-mono">{targetWeeks} 週</strong> (
              {Math.ceil(targetWeeks / 4.3)} 個月) 就能實現！
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 9) {
    return (
      <AuthStep
        profile={profile}
        email={email}
        setEmail={setEmail}
        codeSent={codeSent}
        setCodeSent={setCodeSent}
        verified={authVerified}
        setVerified={setAuthVerified}
        goToStep={goToStep}
        triggerChefReaction={triggerChefReaction}
      />
    );
  }

  // Step 10: Passport & Stamp
  return (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <h2 className="text-sm font-black text-stone-900">你的 CooCoo 通行證準備好了。</h2>
        <p className="text-stone-500 text-[11px]">
          確認後蓋下第一枚章。之後可以在帳號設定隨時修改這些資料。
        </p>
      </div>

      <PassportTicket
        profile={profile}
        isStamped={isStamped}
        isSealDropped={isSealDropped}
        isFlying={isFlying}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-amber-700 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>
          {isSealDropped
            ? "立約見證完成！點選下方按鈕，通行證將啟程飛入圓夢看板。"
            : isStamped
              ? "主廚 CooCoo 親筆見證中，即將落印立約…"
              : "請核對以上檔案無誤後，點擊下方「蓋章，開始自煮」完成神聖立約。"}
        </span>
      </div>
    </div>
  );
}

function CookwareStep({
  profile,
  update,
  triggerChefReaction,
}: {
  profile: OnboardingProfile;
  update: (value: Partial<OnboardingProfile>) => void;
  triggerChefReaction: (mood: ChefMood) => void;
}) {
  const existingCustom = getCustomCookware(profile.cookware);
  const [showCustom, setShowCustom] = useState(Boolean(existingCustom));
  const selectedTypes = profile.cookware.map((c) => c.type);

  const toggleCookware = (type: string) => {
    if (selectedTypes.includes(type)) {
      update({ cookware: profile.cookware.filter((c) => c.type !== type) });
      triggerChefReaction("listen");
    } else {
      update({ cookware: [...profile.cookware, { type, limitations: [] }] });
      triggerChefReaction("applause");
    }
  };

  const toggleCustom = () => {
    if (showCustom) {
      update({ cookware: setCustomCookwareName(profile.cookware, "") });
      setShowCustom(false);
      triggerChefReaction("listen");
    } else {
      setShowCustom(true);
      triggerChefReaction("applause");
    }
  };

  const totalApplianceCount = profile.cookware.length + (showCustom && existingCustom ? 1 : 0);

  return (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <h2 className="text-sm font-black text-stone-900">你的小廚房有哪些裝備？</h2>
        <p className="text-stone-500 text-[11px]">
          至少選一樣。找不到的廚具可以自行輸入，CooCoo 會保守判斷適合的料理方式。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {KNOWN_COOKWARE_TYPES.map((type) => {
          const checked = selectedTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleCookware(type)}
              className={`spring-btn p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                checked
                  ? "border-amber-600 bg-amber-50/70 text-amber-950 shadow-2xs"
                  : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
              }`}
            >
              <span className="font-bold text-xs">{type}</span>
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  checked ? "bg-amber-600 border-amber-600 text-white" : "border-stone-300"
                }`}
              >
                {checked && (
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={toggleCustom}
          className={`spring-btn p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
            showCustom
              ? "border-amber-600 bg-amber-50/70 text-amber-950 shadow-2xs"
              : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
          }`}
        >
          <span className="font-bold text-xs">其他廚具</span>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              showCustom ? "bg-amber-600 border-amber-600 text-white" : "border-stone-300"
            }`}
          >
            {showCustom && (
              <svg
                className="w-2.5 h-2.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12 5 5L20 7" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {showCustom && (
        <div className="bg-white rounded-2xl p-3.5 border border-amber-300 shadow-xs space-y-1.5">
          <label className="block font-bold text-stone-800 text-[11px]">
            其他廚具名稱（上限 40 字）
          </label>
          <input
            type="text"
            maxLength={40}
            autoFocus
            value={existingCustom?.type ?? ""}
            onChange={(e) => update({ cookware: setCustomCookwareName(profile.cookware, e.target.value) })}
            placeholder="例如：多功能快煮鍋、卡式爐"
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-600"
          />
          <p className="text-[10px] text-stone-400">
            請輸入產品類型，不要輸入操作指令；模型不確定的功能不會擅自假設。
          </p>
        </div>
      )}

      {/* Dynamic Unlocked Radar */}
      <EquipmentRadar cookwareCount={totalApplianceCount} />
    </div>
  );
}

function DietaryStep({
  profile,
  update,
  triggerChefReaction,
}: {
  profile: OnboardingProfile;
  update: (value: Partial<OnboardingProfile>) => void;
  triggerChefReaction: (mood: ChefMood) => void;
}) {
  const [flavorInput, setFlavorInput] = useState("");

  const handleToggleRestriction = (label: string) => {
    const exists = profile.restrictions.some((r) => r.label === label);
    if (exists) {
      update({ restrictions: profile.restrictions.filter((r) => r.label !== label) });
      triggerChefReaction("listen");
    } else {
      const newRestriction: DietaryRestriction = {
        id: `restriction-${label}`,
        label,
        kind: label.startsWith("不吃") || label === "全素" ? "avoid" : "allergy",
        ingredientKeys: [label],
        isHardLimit: true,
      };
      update({ restrictions: [...profile.restrictions, newRestriction] });
      triggerChefReaction("care");
    }
  };

  const handleAddFlavor = () => {
    if (!flavorInput.trim()) return;
    update({ preferredFlavors: addPreferredFlavor(profile.preferredFlavors, flavorInput) });
    setFlavorInput("");
    triggerChefReaction("applause");
  };

  const handleRemoveFlavor = (flavor: string) => {
    update({ preferredFlavors: removePreferredFlavor(profile.preferredFlavors, flavor) });
  };

  return (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <h2 className="text-sm font-black text-stone-900">哪些食材一定不能出現？</h2>
        <p className="text-stone-500 text-[11px]">
          過敏與禁食會當成硬限制（絕不放寬）；口味偏好則只影響排序。
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-red-900 flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>過敏與飲食禁忌（硬限制）</span>
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {restrictionChoices.map((item) => {
            const selected = profile.restrictions.some((r) => r.label === item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleToggleRestriction(item)}
                className={`spring-btn py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                  selected
                    ? "border-red-600 bg-red-50 text-red-900"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span>{item}</span> {selected && <span className="text-red-700 font-black">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs space-y-2">
        <label className="block font-bold text-stone-800 text-[11px]" htmlFor="flavor-input">
          喜歡的口味偏好（選填，輸入後按 ＋）
        </label>
        <div className="flex gap-1.5">
          <input
            id="flavor-input"
            type="text"
            value={flavorInput}
            onChange={(e) => setFlavorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddFlavor();
              }
            }}
            placeholder="例如：清爽、香麻、少油"
            className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-600"
          />
          <button
            type="button"
            disabled={!flavorInput.trim()}
            onClick={handleAddFlavor}
            className="spring-btn bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-black px-3.5 rounded-xl text-xs flex items-center justify-center"
            aria-label="新增口味"
          >
            ＋
          </button>
        </div>

        {profile.preferredFlavors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.preferredFlavors.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFlavor(tag)}
                  className="text-amber-700 hover:text-amber-950 font-black ml-0.5"
                  aria-label={`移除 ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuthStep({
  profile,
  email,
  setEmail,
  codeSent,
  setCodeSent,
  verified,
  setVerified,
  goToStep,
  triggerChefReaction,
}: {
  profile: OnboardingProfile;
  email: string;
  setEmail: (value: string) => void;
  codeSent: boolean;
  setCodeSent: (value: boolean) => void;
  verified: boolean;
  setVerified: (value: boolean) => void;
  goToStep: (targetStep: number) => void;
  triggerChefReaction: (mood: ChefMood) => void;
}) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [callbackIssue] = useState(() => readAuthCallbackIssue(window.location.hash));
  const previewAuth = import.meta.env.DEV && import.meta.env.VITE_USE_REAL_API !== "true";

  useEffect(() => {
    if (!supabase || previewAuth) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        setVerified(true);
        triggerChefReaction("applause");
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setVerified(true);
        triggerChefReaction("applause");
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [previewAuth, setVerified, triggerChefReaction]);

  const request = async () => {
    setBusy(true);
    setError("");
    try {
      if (previewAuth) {
        setCodeSent(true);
      } else {
        await requestEmailOtp(email, `${window.location.origin}/onboarding`);
        setCodeSent(true);
      }
      triggerChefReaction("applause");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "無法寄出驗證碼");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    try {
      if (previewAuth && token === "123456") {
        setVerified(true);
        triggerChefReaction("applause");
        setTimeout(() => {
          goToStep(10);
        }, 300);
      } else {
        await verifyEmailOtp(email, token);
        setVerified(true);
        triggerChefReaction("applause");
        setTimeout(() => {
          goToStep(10);
        }, 300);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "驗證碼不正確");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError("");
    try {
      // 1. Advance draft to Step 10 before initiating OAuth redirect
      saveOnboardingDraft({
        ...profile,
        currentStep: 10,
        status: "draft",
      });

      if (previewAuth) {
        setVerified(true);
        setBusy(false);
        triggerChefReaction("applause");
        setTimeout(() => {
          goToStep(10);
        }, 300);
      } else {
        await startGoogleAuth(`${window.location.origin}/onboarding`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Google 登入未完成");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <h2 className="text-sm font-black text-stone-900">登入，讓資料跟著你走。</h2>
        <p className="text-stone-500 text-[11px]">
          封閉測試只接受邀請名單。現在的本機草稿會在驗證完成後同步到你的帳號。
        </p>
      </div>

      {callbackIssue && (
        <p role="alert" className="offline-error">
          {callbackIssue.message}
        </p>
      )}

      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <div>
          <label className="block font-bold text-stone-700 text-[11px] mb-1">受邀 Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setVerified(false);
            }}
            placeholder="you@example.com"
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-600"
          />
        </div>

        <button
          type="button"
          disabled={busy || !email.includes("@")}
          onClick={request}
          className="spring-btn w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <svg
            className="w-3.5 h-3.5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <span>{codeSent ? "重新寄送登入驗證信" : "寄送登入驗證信"}</span>
        </button>

        {codeSent && (
          <div className="space-y-2">
            <div className="flex gap-2 items-center pt-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                placeholder={previewAuth ? "六位數驗證碼 (預設: 123456)" : "輸入信件中的六位數驗證碼"}
                className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-600"
              />
              <button
                type="button"
                disabled={busy || token.length !== 6}
                onClick={verify}
                className="spring-btn bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-bold px-3.5 py-2 rounded-xl text-xs"
              >
                {verified ? "已驗證" : "驗證"}
              </button>
            </div>
            {!previewAuth && (
              <p className="text-[10px] text-stone-500 leading-relaxed">
                或直接開啟驗證信中的登入連結，回到 CooCoo 將自動完成登入。
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={busy || (!isSupabaseConfigured && !previewAuth)}
          onClick={google}
          className="spring-btn w-full bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold py-2.5 rounded-xl text-xs shadow-2xs flex items-center justify-center gap-2"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
          <span>使用 Google 繼續</span>
        </button>

        {error && <p className="text-[11px] text-red-600 font-bold">{error}</p>}

        <p className="text-[10px] text-stone-400 text-center leading-relaxed">
          {verified ? (
            <span className="text-emerald-700 font-bold">✓ 已通過驗證，可同步至雲端</span>
          ) : previewAuth ? (
            "本機預覽請輸入 123456；正式版使用 Supabase Auth 封閉測試名單。"
          ) : isSupabaseConfigured ? (
            "Beta 階段使用 Supabase 登入連結；正式寄件完成後啟用 OTP。"
          ) : (
            "尚未設定 Supabase 環境變數，正式登入暫停用。"
          )}
        </p>
      </div>
    </div>
  );
}
