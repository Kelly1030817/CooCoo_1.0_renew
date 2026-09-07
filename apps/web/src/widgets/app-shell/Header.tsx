import { CatalogAdminModal } from "@/features/recipes/CatalogAdminModal";
import { useContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api } from "@/shared/api/client";
import { UiContext } from "@/app/ui-context";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { supabase, startGoogleAuth } from "@/shared/auth/supabase";
import { readOnboardingDraft } from "@/shared/model/onboarding-draft";

export function Header({ enabled = true }: { enabled?: boolean }) {
  const { data } = useAppState(enabled);
  const access=useQuery({queryKey:["catalog-access",data?.session.user?.id],queryFn:()=>api<{owner:boolean}>("/admin/recipes/access"),enabled:Boolean(data?.session.user)});
  const ui = useContext(UiContext);
  const query = useQueryClient();
  const refresh = () => query.invalidateQueries({ queryKey: stateQueryKey });
  const reset = async () => {
    if (!confirm("確定要重設資料嗎？這將會清除您目前的操作紀錄。")) return;
    await api("/__mock/reset", { method: "POST" });
    await refresh();
    ui.toast("本地資料已成功重設！");
  };
  const auth = () =>
    ui.open(
      <AuthModal
        onClose={ui.close}
        onDone={async () => {
          ui.close();
          await refresh();
        }}
      />,
    );
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
          <button
            onClick={() => ui.open(<CookwareModal enabled={enabled} onClose={ui.close} />)}
            aria-label="廚房裝備設定"
            className="flex items-center justify-center rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high/40"
          >
            <span className="material-symbols-outlined text-xl">skillet</span>
          </button>
          {import.meta.env.DEV && <button
            onClick={reset}
            aria-label="重設範例資料"
            className="flex items-center justify-center rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high/40"
          >
            <span className="material-symbols-outlined text-xl">
              restart_alt
            </span>
          </button>}
          {access.data?.owner && <button className="text-xs" onClick={()=>ui.open(<CatalogAdminModal onClose={ui.close}/>)}>食譜管理</button>}
          <div className="h-8 w-px bg-outline-variant/40" />
          {data?.session.user ? (
            <button
              onClick={async () => {
                await supabase?.auth.signOut();
                await refresh();
                ui.toast("已登出");
              }}
              className="flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-xs font-extrabold text-secondary"
            >
              <span className="material-symbols-outlined text-base">
                person
              </span>
              {data.session.user.displayName}
            </button>
          ) : (
            <button
              onClick={auth}
              aria-label="登入雲端"
              className="flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container px-2.5 py-1.5 text-xs font-extrabold"
            >
              <span className="material-symbols-outlined text-lg text-secondary">
                vpn_key
              </span>
              <span className="hidden sm:inline">帳號</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function AuthModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <Modal label="登入雲端" onClose={onClose}>
      <ModalHeader
        title="登入 CooCoo"
        kicker="Supabase Auth · 封閉測試"
        onClose={onClose}
      />
      <p className="mb-md text-xs leading-5 text-on-surface-variant">登入已整合在必經首次設定中；正式版只接受邀請名單內的 Email OTP 或 Google 帳號。</p>
      <div className="rounded-2xl bg-surface-container-low p-md text-xs text-on-surface-variant"><strong className="block text-slate-blue">{readOnboardingDraft().dreamName || "尚未設定願望"}</strong><span>每週自煮 {readOnboardingDraft().weeklyHomeCookTarget} 餐 · 每日餐費 NT$ {readOnboardingDraft().dailyMealBudget}</span></div>
      {error && <p role="alert" className="offline-error my-sm text-xs text-error">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={handleGoogleSignIn}
        className="google-button mt-md w-full flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high py-2.5 text-xs font-bold text-slate-blue hover:bg-surface-container disabled:opacity-50"
      >
        {busy ? "正在前往 Google…" : "使用 Google 帳號登入"}
      </button>
      <button onClick={onDone} className="secondary-btn mt-sm w-full">完成</button>
    </Modal>
  );
}

function CookwareModal({ onClose, enabled = true }: { onClose: () => void; enabled?: boolean }) {
  const { data } = useAppState(enabled);
  return (
    <Modal label="廚房裝備設定" onClose={onClose}>
      <ModalHeader title="我的廚房裝備" onClose={onClose} />
      <div className="space-y-sm">
        {data?.cookware.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-surface-container-low p-md"
          >
            <span className="material-symbols-outlined text-secondary">
              skillet
            </span>
            <strong className="ml-2 text-sm text-slate-blue">
              {item.name}
            </strong>
            <p className="mt-1 text-[10px] text-on-surface-variant">
              {item.brand} {item.model} · {item.capacity || `${item.wattage}W`}
            </p>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="primary-btn mt-lg w-full">
        完成設定
      </button>
    </Modal>
  );
}
