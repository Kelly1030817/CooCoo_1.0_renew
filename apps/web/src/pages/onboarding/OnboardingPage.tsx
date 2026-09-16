import { useEffect, useMemo, useState } from "react";
import { FormProvider } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OnboardingProfile } from "@coocoo/contracts";
import { api, json } from "@/shared/api/client";
import { stateQueryKey } from "@/entities/app-state/model";
import { saveOnboardingDraft } from "@/shared/model/onboarding-draft";
import { queryClient } from "@/app/query-client";
import { authSessionQueryKey, useAuthSession } from "@/shared/auth/session";
import { onboardingRedirectTo, startGoogleAuth, supabase } from "@/shared/auth/supabase";
import { ChefAvatar, type ChefMood } from "@/widgets/onboarding/ChefAvatar";
import { OnboardingStep1 } from "@/widgets/onboarding/OnboardingStep1";
import { OnboardingStep2 } from "@/widgets/onboarding/OnboardingStep2";
import { OnboardingStep3 } from "@/widgets/onboarding/OnboardingStep3";
import { useOnboardingDraft } from "@/widgets/onboarding/useOnboardingDraft";
import { useOnboardingStep } from "@/widgets/onboarding/useOnboardingStep";
import { completeOnboardingProfile, isOnboardingStepValid } from "./validation";

const stepTitles = ["口味與飲食安全", "餐桌與廚具", "登入與通行證"];

export type OnboardingPageProps = {
  onComplete: () => void;
  onExit?: () => void;
  canExit?: boolean;
  initialStep?: number;
};

export function OnboardingPage({
  onComplete,
  onExit,
  canExit = false,
  initialStep,
}: OnboardingPageProps) {
  const query = useQueryClient();
  const draft = useOnboardingDraft({ initialStep });
  const { form, profile, update } = draft;
  const step = profile.currentStep;
  useOnboardingStep(step);
  const { status: authStatus, callbackIssue } = useAuthSession();
  const [confirming, setConfirming] = useState(false);
  const [mood, setMood] = useState<ChefMood>("listen");
  const [nodding, setNodding] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [sealDropped, setSealDropped] = useState(false);
  const [error, setError] = useState("");
  const cheer = (nextMood: ChefMood) => {
    setMood(nextMood);
    setNodding(false);
    requestAnimationFrame(() => setNodding(true));
  };
  const valid = useMemo(() => isOnboardingStepValid(step, profile), [profile, step]);

  useEffect(() => {
    if (callbackIssue) setError(callbackIssue);
  }, [callbackIssue]);

  useEffect(() => {
    if (!stamped) return undefined;
    const timer = window.setTimeout(() => setSealDropped(true), 1450);
    return () => window.clearTimeout(timer);
  }, [stamped]);

  const mutation = useMutation({
    mutationFn: async (complete: OnboardingProfile) => {
      await api("/onboarding", json("PUT", complete));
      return complete;
    },
    onSuccess: async (complete) => {
      saveOnboardingDraft(complete);
      await query.invalidateQueries({ queryKey: stateQueryKey });
      onComplete();
    },
    onError: (reason) => {
      setError(reason instanceof Error ? reason.message : "設定未能儲存，請稍後再試。");
    },
  });
  const busy = confirming || mutation.isPending;

  const confirmSignedIn = async () => {
    if (!supabase || authStatus === "signed-in") return true;
    setConfirming(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session) {
        queryClient.setQueryData(authSessionQueryKey, null);
        setError("主廚設定已保存在草稿；請先完成登入，再按一次蓋章。");
        return false;
      }
      queryClient.setQueryData(authSessionQueryKey, data.session);
      return true;
    } catch {
      setError("暫時無法確認登入狀態，請檢查網路後再按一次蓋章。");
      return false;
    } finally {
      setConfirming(false);
    }
  };

  const stampOrFinish = async () => {
    if (!stamped) {
      if (!(await confirmSignedIn())) return;
      setStamped(true);
      cheer("sealed");
      return;
    }
    setError("");
    await form.handleSubmit(
      (values) => {
        mutation.mutate(completeOnboardingProfile(values, new Date().toISOString()));
      },
      () => {
        setError("請完成本步必要資料");
      },
    )();
  };

  return (
    <FormProvider {...form}>
      <main className="onboarding-shell">
        <section className="onboarding-device flex min-h-screen flex-col">
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
                <OnboardingStep1
                  profile={profile}
                  flavorInput={draft.flavorInput}
                  restrictionInput={draft.restrictionInput}
                  onUpdate={update}
                  onFlavorInputChange={draft.setFlavorInput}
                  onAddFlavor={() => {
                    draft.addFlavor();
                  }}
                  onToggleHardRestriction={(option) => {
                    cheer("care");
                    draft.toggleHardRestriction(option);
                  }}
                  onRestrictionInputChange={draft.setRestrictionInput}
                  onAddRestriction={() => {
                    if (draft.addRestriction()) cheer("care");
                  }}
                />
              )}
              {step === 2 && (
                <OnboardingStep2
                  profile={profile}
                  cookwareOptions={draft.cookwareOptions}
                  customCookware={draft.customCookware}
                  onUpdate={update}
                  onToggleCookware={(value) => {
                    cheer("applause");
                    draft.toggleCookware(value);
                  }}
                  onCustomCookwareChange={draft.setCustomCookware}
                  onAddCustomCookware={() => {
                    cheer("applause");
                    draft.addCustomCookware();
                  }}
                  onToggleBarrier={(value) => {
                    cheer("listen");
                    draft.toggleBarrier(value);
                  }}
                />
              )}
              {step === 3 && (
                <OnboardingStep3
                  profile={profile}
                  authStatus={authStatus}
                  supabaseConfigured={Boolean(supabase)}
                  step={step}
                  stamped={stamped}
                  sealDropped={sealDropped}
                  onGoogleSignIn={(currentStep) => {
                    void startGoogleAuth(onboardingRedirectTo(currentStep));
                  }}
                />
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
                  : () => {
                      cheer(step === 1 ? "applause" : "care");
                      update({ currentStep: Math.min(3, step + 1) });
                    }
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
    </FormProvider>
  );
}
