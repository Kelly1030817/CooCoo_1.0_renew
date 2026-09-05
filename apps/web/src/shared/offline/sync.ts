import { api, json } from "@/shared/api/client";
import { pendingOperations, removeOperation } from "./recipe-packages";

let syncPromise: Promise<number> | null = null;
export function syncOfflineOperations() {
  if (!navigator.onLine) return Promise.resolve(0);
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    let synced = 0;
    for (const operation of await pendingOperations()) {
      try {
        if (operation.kind === "cooking_complete") await api("/cooking/outcomes", json("POST", operation.payload));
        await removeOperation(operation.id);
        synced += 1;
      } catch (error) {
        if (error instanceof TypeError) break;
        const apiError = error as { body?: { error?: { code?: string } } };
        if (apiError.body?.error?.code === "duplicate") { await removeOperation(operation.id); synced += 1; }
        else break;
      }
    }
    return synced;
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}
