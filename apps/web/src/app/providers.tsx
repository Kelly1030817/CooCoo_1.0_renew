import { QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { queryClient } from "./query-client";
import { UiContext, type ToastKind } from "./ui-context";
import { startAuthSessionSync } from "../shared/auth/session";
import { cn } from "../shared/lib/cn";

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function armToastDismiss(dismiss: () => void, ms = 3000) {
  if (toastTimer !== undefined) clearTimeout(toastTimer);
  toastTimer = setTimeout(dismiss, ms);
  return toastTimer;
}

export type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [modal, setModal] = useState<ReactNode>(null);
  const [notice, setNotice] = useState<{ message: string; type: ToastKind } | null>(null);
  const close = useCallback(() => setModal(null), []);
  const toast = useCallback((message: string, type: ToastKind = "success") => {
    setNotice({ message, type });
    armToastDismiss(() => setNotice(null));
  }, []);
  useEffect(() => startAuthSessionSync(toast), [toast]);
  const value = useMemo(() => ({ toast, open: setModal, close }), [toast, close]);
  return (
    <QueryClientProvider client={queryClient}>
      <UiContext.Provider value={value}>
        {children}
        {modal}
        {notice && (
          <div
            role="status"
            className={cn(
              "toast-in fixed top-20 left-1/2 z-[120] -translate-x-1/2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg",
              notice.type === "warning"
                ? "bg-rust-orange"
                : notice.type === "error"
                  ? "bg-error"
                  : "bg-secondary",
            )}
          >
            <span className="material-symbols-outlined mr-2 align-middle text-xl">
              {notice.type === "success" ? "check_circle" : "report"}
            </span>
            {notice.message}
          </div>
        )}
      </UiContext.Provider>
    </QueryClientProvider>
  );
}
