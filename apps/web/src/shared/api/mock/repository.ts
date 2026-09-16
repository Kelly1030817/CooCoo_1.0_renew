import type { AppState, OnboardingProfile } from "@coocoo/contracts";
import { applyOnboardingProfile, createSeedState, type StateRepository } from "@coocoo/core";
import { ONBOARDING_DRAFT_STORAGE_KEY } from "../../model/onboarding-draft";

const KEY = "coocoo.mock-db.v2";
const nodeStorage = new Map<string, string>();
const storage = () =>
  typeof localStorage === "undefined"
    ? {
        getItem: (key: string) => nodeStorage.get(key) ?? null,
        setItem: (key: string, value: string) => nodeStorage.set(key, value),
      }
    : localStorage;

function isOnboardingProfile(value: unknown): value is OnboardingProfile {
  if (typeof value !== "object" || value === null) return false;
  return (
    "status" in value &&
    value.status === "complete" &&
    "currentStep" in value &&
    typeof value.currentStep === "number" &&
    value.currentStep >= 3 &&
    "weeklyGoalTarget" in value &&
    Boolean(value.weeklyGoalTarget)
  );
}

function completedOnboardingProfile(value: unknown): OnboardingProfile | null {
  return isOnboardingProfile(value) ? value : null;
}

function isAppState(value: unknown): value is AppState {
  return typeof value === "object" && value !== null && "version" in value;
}

export function migrateMockState(value: unknown, onboardingValue?: unknown): AppState | null {
  if (!isAppState(value)) return null;
  if (value.version !== 2) return null;
  let migrated: AppState = { ...createSeedState(), ...value, version: 2 };
  const profile = completedOnboardingProfile(onboardingValue);
  if (!profile || migrated.onboardingProfile?.status === "complete") return migrated;
  const completedAt = profile.completedAt ? new Date(profile.completedAt) : new Date(0);
  return applyOnboardingProfile(migrated, profile, {
    id: "week-onboarding",
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
