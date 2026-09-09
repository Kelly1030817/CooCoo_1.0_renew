import { useState, useEffect, useCallback } from "react";

const PREP_TRAY_STORAGE_KEY = "coocoo_prep_tray_ids_v1";

function readStoredIds(): string[] {
  try {
    const raw = localStorage.getItem(PREP_TRAY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]): void {
  try {
    localStorage.setItem(PREP_TRAY_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("coocoo_prep_tray_updated"));
  } catch {
    // Storage might be unavailable
  }
}

export function usePrepTray() {
  const [prepIds, setPrepIds] = useState<string[]>(readStoredIds);

  useEffect(() => {
    const sync = () => setPrepIds(readStoredIds());
    window.addEventListener("coocoo_prep_tray_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("coocoo_prep_tray_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addToTray = useCallback((id: string) => {
    setPrepIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeStoredIds(next);
      return next;
    });
  }, []);

  const removeFromTray = useCallback((id: string) => {
    setPrepIds((prev) => {
      const next = prev.filter((item) => item !== id);
      writeStoredIds(next);
      return next;
    });
  }, []);

  const toggleInTray = useCallback((id: string) => {
    setPrepIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      writeStoredIds(next);
      return next;
    });
  }, []);

  const addMultipleToTray = useCallback((ids: string[]) => {
    setPrepIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      writeStoredIds(next);
      return next;
    });
  }, []);

  const clearTray = useCallback(() => {
    writeStoredIds([]);
    setPrepIds([]);
  }, []);

  const isInTray = useCallback((id: string) => prepIds.includes(id), [prepIds]);

  return {
    prepIds,
    addToTray,
    removeFromTray,
    toggleInTray,
    addMultipleToTray,
    clearTray,
    isInTray,
  };
}
