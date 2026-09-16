import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Providers } from "./app/providers";
import { registerServiceWorker } from "./shared/offline/recipe-packages";
import { syncOfflineOperations } from "./shared/offline/sync";

declare global {
  interface Window {
    __COOCOO_E2E_INVALID_STATE__?: boolean;
  }
}

async function enableMocking() {
  if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK_API !== "true") return;
  if (import.meta.env.VITE_USE_REAL_API === "true") return;
  const { worker } = await import("./shared/api/mock/browser");
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  if (import.meta.env.DEV && window.__COOCOO_E2E_INVALID_STATE__) {
    const { http, HttpResponse } = await import("msw");
    worker.use(http.get("/api/v1/state", () => HttpResponse.json({ data: { version: 1 } })));
  }
}

void enableMocking().then(() => {
  if (import.meta.env.PROD) void registerServiceWorker();
  void syncOfflineOperations();
  window.addEventListener("online", () => {
    void syncOfflineOperations();
  });
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
});
