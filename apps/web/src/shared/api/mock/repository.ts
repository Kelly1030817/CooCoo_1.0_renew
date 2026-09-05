import type { AppState, OnboardingProfile } from "@coocoo/contracts";
import { applyOnboardingProfile, createSeedState, type StateRepository } from "@coocoo/core";
import { ONBOARDING_DRAFT_STORAGE_KEY } from "../../model/onboarding-draft";

const KEY = "coocoo.mock-db.v1";
const nodeStorage = new Map<string, string>();
const storage = () =>
  typeof localStorage === "undefined"
    ? {
        getItem: (key: string) => nodeStorage.get(key) ?? null,
        setItem: (key: string, value: string) => nodeStorage.set(key, value),
      }
    : localStorage;
function completedOnboardingProfile(value: unknown): OnboardingProfile | null {
  if (!value || typeof value !== "object") return null;
  const profile = value as Partial<OnboardingProfile>;
  if (profile.status !== "complete" || !profile.dreamName?.trim() || !profile.dreamTargetAmount) return null;
  return profile as OnboardingProfile;
}

export function migrateMockState(value: unknown, onboardingValue?: unknown): AppState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AppState>;
  const version = (value as { version?: number }).version;
  let migrated: AppState | null = null;
  if (version === 1) migrated = { ...createSeedState(), ...candidate, version: 1 } as AppState;
  if (version === 0 || version === undefined) {
    const seed = createSeedState();
    migrated = {
      ...seed,
      ...candidate,
      version: 1,
      session: candidate.session || seed.session,
    } as AppState;
  }
  if (!migrated) return null;
  const profile = completedOnboardingProfile(onboardingValue);
  if (!profile || migrated.activeGoal) return migrated;
  const completedAt = profile.completedAt ? new Date(profile.completedAt) : new Date(0);
  return applyOnboardingProfile(migrated, profile, {
    id: "goal-onboarding",
    now: Number.isNaN(completedAt.getTime()) ? new Date(0) : completedAt,
  });
}
export class BrowserStateRepository implements StateRepository {
  read(): AppState {
    try {
      const parsed = migrateMockState(
        JSON.parse(storage().getItem(KEY) || "null"),
        JSON.parse(storage().getItem(ONBOARDING_DRAFT_STORAGE_KEY) || "null"),
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
