import type { AppState } from "@coocoo/contracts";
import { createSeedState, type StateRepository } from "@coocoo/core";

const KEY = "coocoo.mock-db.v1";
const nodeStorage = new Map<string, string>();
const storage = () =>
  typeof localStorage === "undefined"
    ? {
        getItem: (key: string) => nodeStorage.get(key) ?? null,
        setItem: (key: string, value: string) => nodeStorage.set(key, value),
      }
    : localStorage;
export function migrateMockState(value: unknown): AppState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AppState> & { version?: number };
  if (candidate.version === 1)
    return { ...createSeedState(), ...candidate, version: 1 } as AppState;
  if (candidate.version === 0 || candidate.version === undefined) {
    const seed = createSeedState();
    return {
      ...seed,
      ...candidate,
      version: 1,
      session: candidate.session || seed.session,
    } as AppState;
  }
  return null;
}
export class BrowserStateRepository implements StateRepository {
  read(): AppState {
    try {
      const parsed = migrateMockState(
        JSON.parse(storage().getItem(KEY) || "null"),
      );
      if (parsed) {
        this.write(parsed);
        return parsed;
      }
    } catch {
      /* use seed */
    }
    return this.reset();
  }
  write(value: AppState) {
    storage().setItem(KEY, JSON.stringify(value));
  }
  reset() {
    const value = createSeedState();
    this.write(value);
    return value;
  }
}
