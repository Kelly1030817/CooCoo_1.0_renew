import { useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api } from "@/shared/api/client";
import { UiContext } from "@/app/ui-context";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { supabase, startGoogleAuth } from "@/shared/auth/supabase";
import { readOnboardingDraft, saveOnboardingDraft } from "@/shared/model/onboarding-draft";

import type { AppRoute } from "@/app/routing/routes";
import { useAppRoute } from "@/app/routing/useAppRoute";

export function Header({
  enabled = true,
  onNavigate,
}: {
  enabled?: boolean;
  onNavigate?: (route: AppRoute) => void;
}) {
  const { data } = useAppState(enabled);
  const { navigate: routeNavigate } = useAppRoute();
  const navigate = onNavigate || routeNavigate;
  const ui = useContext(UiContext);
  const query = useQueryClient();
  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });
  const reset = async () => {
    if (!confirm("確定要重設資料嗎？這將會清除您目前的操作紀錄。")) return;
    await api("/__mock/reset", { method: "POST" });
    await refresh();
    ui.toast("本地資料已成功重設！");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-surface-container-high bg-surface shadow-sm">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-md py-sm sm:px-lg">
        <div className="flex min-w-0 items-center gap-sm sm:gap-md">
          <span className="material-symbols-outlined text-3xl text-primary">
            kitchen
          </span>
          <h1 className="whitespace-nowrap text-base font-extrabold tracking-wide text-primary sm:text-xl">
            CooCoo 煮煮
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-xs sm:gap-sm">
          {import.meta.env.DEV && (
            <>
              <button
                onClick={reset}
                aria-label="重設範例資料"
                className="flex items-center justify-center rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high/40"
              >
                <span className="material-symbols-outlined text-xl">
                  restart_alt
                </span>
              </button>
              <div className="h-8 w-px bg-outline-variant/40" />
            </>
          )}

          {/* 我的 (Profile & Consultation Replay) SVG Button */}
          <button
            onClick={() =>
              ui.open(
                <ProfileModal
                  onClose={ui.close}
                  onReplayOnboarding={() => {
                    ui.close();
                    saveOnboardingDraft({
                      ...readOnboardingDraft(),
                      currentStep: 1,
                      status: "draft",
                    });
                    navigate("onboarding");
                  }}
                  enabled={enabled}
                />,
              )
            }
            aria-label="我的自煮檔案與相談室"
            className="flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50/90 hover:bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-2xs transition-all active:scale-95 group"
          >
            <svg
              className="w-4 h-4 text-amber-800 shrink-0 group-hover:scale-105 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{data?.session.user ? data.session.user.displayName : "我的"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function ProfileModal({
  onClose,
  onReplayOnboarding,
  enabled = true,
}: {
  onClose: () => void;
  onReplayOnboarding: () => void;
  enabled?: boolean;
}) {
  const { data } = useAppState(enabled);
  const ui = useContext(UiContext);
  const query = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const draft = readOnboardingDraft();
  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError("");
    try {
      await startGoogleAuth();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Google 登入啟動失敗");
    }
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    await refresh();
    ui.toast("已登出雲端帳號");
    onClose();
  };

  return (
    <Modal label="我的自煮檔案" onClose={onClose}>
      <ModalHeader
        title="我的自煮檔案"
        kicker="CooCoo 主廚個人中心"
        onClose={onClose}
      />
      <div className="space-y-3.5 text-left text-xs">
        {/* User Account Status */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold">
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <span className="font-black text-stone-900 block text-xs">
                {data?.session.user ? data.session.user.displayName : "本機訪客模式"}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {data?.session.user ? data.session.user.email : "資料暫存於此瀏覽器"}
              </span>
            </div>
          </div>
          {data?.session.user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[11px] font-bold text-stone-500 hover:text-red-700 bg-white border border-stone-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              登出
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={handleGoogleSignIn}
              className="text-[11px] font-black text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors"
            >
              {busy ? "登入中…" : "登入雲端"}
            </button>
          )}
        </div>

        {error && <p role="alert" className="offline-error text-xs text-error">{error}</p>}

        {/* Current Dream Goal Overview */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">圓夢計畫目標</span>
            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded">
              每週自煮 {draft.weeklyHomeCookTarget || 3} 餐
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="font-black text-stone-900 text-sm">
              {draft.dreamName || "自煮圓夢願望"}
            </h4>
            <span className="font-mono font-black text-emerald-800 text-sm">
              NT$ {(draft.dreamTargetAmount || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-amber-200/60">
            <span>每日餐費預算：NT$ {draft.dailyMealBudget || 240}</span>
            <span>份量：{draft.householdServings || 1} 人份</span>
          </div>
        </div>

        {/* Replay 10-Step Consultation Action Card */}
        <div className="bg-stone-900 text-white rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-amber-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <h4 className="text-xs font-black text-amber-300">主廚相談室十步設定</h4>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            想重新調整自煮目標、重測廚具適配度，或再次體驗現代工坊圓章蓋印與 3D 破空起飛？
          </p>
          <button
            type="button"
            onClick={onReplayOnboarding}
            className="spring-btn w-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
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
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>重新體驗主廚相談室十步設定 ➔</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

