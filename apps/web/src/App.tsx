import { lazy, Suspense, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { stateQueryKey, useAppState } from "@/entities/app-state/model";
import { useAppRoute } from "@/app/routing/useAppRoute";
import { Header } from "@/widgets/app-shell/Header";
import { BottomNav } from "@/widgets/app-shell/BottomNav";
import { OnboardingPage } from "@/pages/onboarding/OnboardingPage";
import { readOnboardingDraft } from "@/shared/model/onboarding-draft";
import { startGoogleAuth, supabase } from "@/shared/auth/supabase";
import { AuthRecoveryPanel } from "@/shared/auth/AuthRecoveryPanel";
import { UiContext } from "@/app/ui-context";

const pages = {
  today: lazy(() =>
    import("@/pages/today/TodayPage").then(({ TodayPage }) => ({ default: TodayPage })),
  ),
  shopping: lazy(() =>
    import("@/pages/shopping/ShoppingPage").then(({ ShoppingPage }) => ({ default: ShoppingPage })),
  ),
  fridge: lazy(() =>
    import("@/pages/fridge/FridgePage").then(({ FridgePage }) => ({ default: FridgePage })),
  ),
  recipes: lazy(() =>
    import("@/pages/recipes/RecipesPage").then(({ RecipesPage }) => ({ default: RecipesPage })),
  ),
  me: lazy(() =>
    import("@/pages/me/MePage").then(({ MePage }) => ({ default: MePage })),
  ),
};
export default function App() {
  const { route, navigate } = useAppRoute();
  const queryClient = useQueryClient();
  const ui = useContext(UiContext);
  const [onboardingComplete, setOnboardingComplete] = useState(() => readOnboardingDraft().status === "complete");
  const [authStatus, setAuthStatus] = useState<"loading" | "signed-in" | "signed-out">(() => supabase ? "loading" : "signed-out");
  const [reauthBusy, setReauthBusy] = useState(false);
  const [reauthError, setReauthError] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const applySession = (hasSession: boolean) => {
      if (!active) return;
      setAuthStatus(hasSession ? "signed-in" : "signed-out");
      if (hasSession) void queryClient.invalidateQueries({ queryKey: stateQueryKey });
    };
    void supabase.auth.getSession().then(({ data }) => applySession(Boolean(data.session)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applySession(Boolean(session)));
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);
  const stateEnabled = onboardingComplete && (!supabase || authStatus === "signed-in");
  const { data, isLoading, error } = useAppState(stateEnabled);
  const restartGoogleAuth = async () => {
    setReauthBusy(true);
    setReauthError("");
    try {
      await startGoogleAuth();
    } catch (reason) {
      setReauthBusy(false);
      setReauthError(reason instanceof Error ? reason.message : "Google 登入暫時無法開始，請稍後再試。");
    }
  };
  const Page = route !== "onboarding" ? pages[route] : null;
  if(onboardingComplete && authStatus === "loading")return <main className="onboarding-shell"><p className="eyebrow">CooCoo</p><h1 className="text-2xl font-extrabold text-slate-blue">正在找回你的主廚檔案…</h1></main>;
  if(onboardingComplete && supabase && authStatus === "signed-out")return <AuthRecoveryPanel busy={reauthBusy} error={reauthError} onGoogleSignIn={() => { void restartGoogleAuth(); }} />;

  const localDraft = readOnboardingDraft();
  const isReplaying = route === "onboarding" && (onboardingComplete || localDraft.status === "complete" || localDraft.currentStep === 1);

  if (!onboardingComplete || route === "onboarding")
    return (
      <OnboardingPage
        key={route === "onboarding" ? `onboarding-${isReplaying ? "replay-1" : localDraft.currentStep}` : "onboarding-initial"}
        initialStep={isReplaying ? 1 : undefined}
        canExit={onboardingComplete}
        onExit={() => {
          navigate("today");
          ui.toast("設定草稿已安全暫存；完成五步後才會成立主廚檔案。");
        }}
        onComplete={() => {
          navigate("me");
          setOnboardingComplete(true);
        }}
      />
    );
  return (
    <>
      <Header enabled={stateEnabled} onNavigate={navigate} />
      <main className="mx-auto w-full max-w-[1200px] min-w-0 flex-1 px-md py-md transition-all duration-300 md:px-lg md:py-lg">
        {isLoading ? (
          <div className="py-xl text-center text-sm font-bold text-on-surface-variant">
            載入 CooCoo 中…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl bg-error-container p-lg text-sm font-bold text-on-error-container"
          >
            資料載入失敗：{error.message}
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="py-xl text-center text-sm font-bold text-on-surface-variant">
                正在打開頁面…
              </div>
            }
          >
            {Page && <Page />}
          </Suspense>
        )}
      </main>
      <BottomNav
        active={route}
        onNavigate={navigate}
        urgent={data?.inventory.filter((i) => i.daysLeft <= 1).length || 0}
        shopping={data?.shoppingItems.filter((i) => !i.checked).length || 0}
      />
    </>
  );
}
