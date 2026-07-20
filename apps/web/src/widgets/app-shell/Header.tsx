import { useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api, json } from "@/shared/api/client";
import { UiContext } from "@/app/ui-context";
import { Modal, ModalHeader } from "@/shared/ui/Modal";

export function Header() {
  const { data } = useAppState();
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
            onClick={() => ui.open(<CookwareModal onClose={ui.close} />)}
            aria-label="廚房裝備設定"
            className="flex items-center justify-center rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high/40"
          >
            <span className="material-symbols-outlined text-xl">skillet</span>
          </button>
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
          {data?.session.user ? (
            <button
              onClick={async () => {
                await api("/auth/logout", { method: "POST" });
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
              <span className="hidden sm:inline">登入</span>
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
  return (
    <Modal label="登入雲端" onClose={onClose}>
      <ModalHeader
        title="登入 CooCoo"
        kicker="未來將串接 Supabase Auth"
        onClose={onClose}
      />
      <p className="mb-md text-xs leading-5 text-on-surface-variant">
        第一階段以模擬帳號驗證完整登入與資料隔離介面，不會傳送密碼。
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          await api(
            "/auth/login",
            json("POST", { email: String(form.get("email")) }),
          );
          onDone();
        }}
      >
        <label className="text-xs font-bold text-on-surface-variant">
          Email
          <input
            className="field"
            name="email"
            type="email"
            defaultValue="kelly@example.com"
            required
          />
        </label>
        <button className="primary-btn mt-lg w-full">登入雲端</button>
      </form>
    </Modal>
  );
}
function CookwareModal({ onClose }: { onClose: () => void }) {
  const { data } = useAppState();
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
