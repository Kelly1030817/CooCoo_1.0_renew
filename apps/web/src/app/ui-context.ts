import { createContext, useContext, type ReactNode } from "react";

export type ToastKind = "success" | "warning" | "error";

export type UiContextValue = {
  toast: (message: string, type?: ToastKind) => void;
  open: (content: ReactNode) => void;
  close: () => void;
};

export const UiContext = createContext<UiContextValue | undefined>(undefined);

export function useUi(): UiContextValue {
  const ui = useContext(UiContext);
  if (!ui) {
    throw new Error("useUi must be used within Providers");
  }
  return ui;
}
