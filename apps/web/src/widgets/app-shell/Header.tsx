import { EmailSignIn } from "@/shared/auth/EmailSignIn";
import { CatalogAdminModal } from "../../features/recipes/CatalogAdminModal";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppState, stateQueryKey } from "../../entities/app-state/model";
import { api } from "../../shared/api/client";
import { useUi } from "../../app/ui-context";
import { Modal, ModalHeader } from "../../shared/ui/Modal";
import { BrandLogo } from "../../shared/ui/BrandLogo";
import { supabase } from "../../shared/auth/supabase";
import { readOnboardingDraft } from "../../shared/model/onboarding-draft";

import { RotateCcw } from "lucide-react";
import type { AppRoute } from "../../app/routing/routes";

function catalogAdminModalNode(onClose: () => void) {
  return <CatalogAdminModal onClose={onClose} />;
}

export type HeaderProps = {
  enabled?: boolean;
  onNavigate?: (route: AppRoute) => void;
};

export function Header({ enabled = true, onNavigate }: HeaderProps) {
  const { data } = useAppState(enabled);
  const access = useQuery({
    queryKey: ["catalog-access", data?.session.user?.id],
    queryFn: () => api<{ owner: boolean }>("/admin/recipes/access"),
    enabled: Boolean(data?.session.user),
  });
  const ui = useUi();
  const query = useQueryClient();
  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });
  const reset = async () => {
    if (!confirm("確定要重設資料嗎？這將會清除您目前的操作紀錄。")) return;
    await api("/__mock/reset", { method: "POST" });
    await refresh();
    ui.toast("本地資料已成功重設！");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-container-high bg-surface shadow-sm">
      <div className="mx-auto flex min-h-[60px] w-full max-w-[1200px] items-center justify-between px-md py-sm sm:px-lg">
        <BrandLogo onNavigate={onNavigate ? () => onNavigate("today") : undefined} />
        <div className="flex shrink-0 items-center gap-xs sm:gap-sm">
          {import.meta.env.DEV && (
            <button
              onClick={reset}
              aria-label="重設範例資料"
              className="flex items-center justify-center rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high/40"
            >
              <RotateCcw aria-hidden="true" className="size-5" />
            </button>
          )}
          {import.meta.env.DEV && access.data?.owner && (
            <button
              type="button"
              className="text-xs text-on-surface-variant hover:text-primary px-2 py-1 rounded-lg border border-outline-variant/50"
              onClick={() => ui.open(catalogAdminModalNode(ui.close))}
            >
              食譜管理
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export type ProfileModalProps = {
  onClose: () => void;
  onReplayOnboarding: () => void;
  enabled?: boolean;
};

export function ProfileModal({ onClose, onReplayOnboarding, enabled = true }: ProfileModalProps) {
  const { data } = useAppState(enabled);
  const ui = useUi();
  const query = useQueryClient();
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const draft = readOnboardingDraft();
  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    await refresh();
    ui.toast("已登出雲端帳號");
    onClose();
  };

  return (
    <Modal label="我的自煮檔案" onClose={onClose}>
      <ModalHeader title="我的自煮檔案" kicker="CooCoo 主廚個人中心" onClose={onClose} />
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
              onClick={() => setShowEmailSignIn(true)}
              className="text-[11px] font-black text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors"
            >
              Email 登入
            </button>
          )}
        </div>

        {showEmailSignIn && !data?.session.user && <EmailSignIn />}

        {/* Current Chef Profile Overview */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              本週主目標
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded">
              每週 {draft.weeklyGoalTarget || 1}{" "}
              {draft.primaryGoalMetric === "self_cooked_servings" ? "份" : "次"}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="font-black text-stone-900 text-sm">
              {data?.growth.rank.name || "初火學徒"}
            </h4>
            <span className="font-mono font-black text-emerald-800 text-sm">
              {data?.growth.totalExp || 0} EXP
            </span>
          </div>
          <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-amber-200/60">
            <span>預設指引：{draft.guidanceMode === "compact" ? "精簡" : "詳細"}</span>
            <span>份量：{draft.householdServings || 1} 人份</span>
          </div>
        </div>

        {/* Replay five-step setup action card */}
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
            <h4 className="text-xs font-black text-amber-300">三步主廚檔案設定</h4>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            想重新調整自煮目標、料理偏好、廚具適配度或提醒節奏，可以再次檢視三步設定。
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
            <span>重新檢視三步主廚檔案設定 ➔</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export { CookwareModal, type CookwareModalProps } from "@/features/settings/CookwareSettingsModal";
