import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { stateQueryKey, useAppState } from "@/entities/app-state/model";
import { useAppRoute } from "@/app/routing/useAppRoute";
import { Header } from "@/widgets/app-shell/Header";
import { BottomNav } from "@/widgets/app-shell/BottomNav";
import { OnboardingPage } from "@/pages/onboarding/OnboardingPage";
import { readOnboardingDraft, saveOnboardingDraft } from "@/shared/model/onboarding-draft";
import { startGoogleAuth, supabase } from "@/shared/auth/supabase";
import { AuthRecoveryPanel } from "@/shared/auth/AuthRecoveryPanel";
import { api, json } from "@/shared/api/client";
import type { OnboardingProfile } from "@coocoo/contracts";

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
  kitchen: lazy(() =>
    import("@/pages/kitchen/KitchenPage").then(({ KitchenPage }) => ({ default: KitchenPage })),
  ),
  dream: lazy(() =>
    import("@/pages/roi/RoiPage").then(({ RoiPage }) => ({ default: RoiPage })),
  ),
};
export default function App() {
  const { route, navigate } = useAppRoute();
  const queryClient = useQueryClient();
  const goalRepairAttempted = useRef(false);
  const [onboardingComplete, setOnboardingComplete] = useState(() => readOnboardingDraft().status === "complete");
  const [authStatus, setAuthStatus] = useState<"loading" | "signed-in" | "signed-out">(() => supabase ? "loading" : "signed-out");
  const [reauthBusy, setReauthBusy] = useState(false);
  const [reauthError, setReauthError] = useState("");
  const [checkingCloud,setCheckingCloud]=useState(()=>!onboardingComplete&&Boolean(supabase));
  const [goalSyncError, setGoalSyncError] = useState("");
  useEffect(()=>{if(onboardingComplete||!supabase)return;void supabase.auth.getSession().then(async({data})=>{if(!data.session){setCheckingCloud(false);return}try{const bundle=await api<{profile:{household_servings:number;daily_meal_budget:number;outside_meal_price:number;weekly_home_cook_target:number;onboarding_status:"draft"|"complete";onboarding_step:number;planned_meal_slots:OnboardingProfile["plannedMealSlots"];preferred_flavors:string[]};cookware:Array<{type:string;capacity:string|null;limitations:string[]}>;restrictions:Array<{id:string;label:string;kind:"allergy"|"avoid"|"preference";ingredient_keys:string[];is_hard_limit:boolean}>;goal:{name:string;target_amount:number}|null}>("/onboarding");if(bundle.profile?.onboarding_status==="complete"){const profile:OnboardingProfile={status:"complete",currentStep:10,householdServings:bundle.profile.household_servings,cookware:bundle.cookware.map(item=>({type:item.type,capacity:item.capacity||undefined,limitations:item.limitations||[]})),restrictions:bundle.restrictions.map(item=>({id:item.id,label:item.label,kind:item.kind,ingredientKeys:item.ingredient_keys,isHardLimit:item.is_hard_limit})),preferredFlavors:bundle.profile.preferred_flavors||[],inventoryReviewed:true,hasNoInventory:false,dailyMealBudget:bundle.profile.daily_meal_budget,outsideMealComparisonPrice:bundle.profile.outside_meal_price,plannedMealSlots:bundle.profile.planned_meal_slots,weeklyHomeCookTarget:bundle.profile.weekly_home_cook_target,dreamName:bundle.goal?.name||"我的願望",dreamTargetAmount:bundle.goal?.target_amount||0,completedAt:new Date().toISOString()};saveOnboardingDraft(profile);setOnboardingComplete(true)}}finally{setCheckingCloud(false)}}).catch(()=>setCheckingCloud(false))},[onboardingComplete]);
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
  useEffect(() => {
    const profile = readOnboardingDraft();
    if (!onboardingComplete || !data || data.activeGoal || profile.status !== "complete" || goalRepairAttempted.current) return;
    goalRepairAttempted.current = true;
    const repair = async () => {
      const usesMockApi = import.meta.env.DEV && import.meta.env.VITE_USE_REAL_API !== "true";
      if (!usesMockApi) {
        const session = (await supabase?.auth.getSession())?.data.session;
        if (!session) return;
      }
      await api("/onboarding", json("PUT", profile));
      await queryClient.invalidateQueries({ queryKey: stateQueryKey });
    };
    void repair().catch((reason) => {
      setGoalSyncError(reason instanceof Error ? reason.message : "圓夢目標同步失敗");
    });
  }, [data, onboardingComplete, queryClient]);
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
  const Page = pages[route];
  if(checkingCloud || (onboardingComplete && authStatus === "loading"))return <main className="onboarding-shell"><p className="eyebrow">CooCoo</p><h1 className="text-2xl font-extrabold text-slate-blue">正在找回你的通行證…</h1></main>;
  if(onboardingComplete && supabase && authStatus === "signed-out")return <AuthRecoveryPanel busy={reauthBusy} error={reauthError} onGoogleSignIn={() => { void restartGoogleAuth(); }} />;
  if (!onboardingComplete) return <OnboardingPage onComplete={() => setOnboardingComplete(true)} />;
  return (
    <>
      <Header enabled={stateEnabled} />
      <main className="mx-auto w-full max-w-[1200px] min-w-0 flex-1 px-md py-md transition-all duration-300 md:px-lg md:py-lg">
        {goalSyncError && (
          <div role="alert" className="mb-md rounded-2xl bg-error-container p-md text-sm font-bold text-on-error-container">
            圓夢目標尚未同步：{goalSyncError}
          </div>
        )}
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
            <Page />
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
