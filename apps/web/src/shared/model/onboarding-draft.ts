import type { OnboardingProfile } from "@coocoo/contracts";

export const ONBOARDING_DRAFT_STORAGE_KEY = "coocoo:onboarding-draft:v2";

export const emptyOnboardingDraft: OnboardingProfile = {
  status: "draft",
  currentStep: 1,
  cookingExperience: "beginner",
  currentWeeklyCookingFrequency: 0,
  habitBarriers: ["no_ideas"],
  guidanceMode: "detailed",
  householdServings: 1,
  cookware: [],
  restrictions: [],
  preferredFlavors: [],
  availableMinutes: 30,
  inventoryReviewed: false,
  hasNoInventory: false,
  plannedMealSlots: ["dinner"],
  primaryGoalMetric: "cooking_sessions",
  weeklyGoalTarget: 1,
  reminders: {
    expiringIngredients: true,
    plannedMeals: true,
    weeklyRhythm: true,
    pushEnabled: false,
    quietHoursStart: "21:00",
    quietHoursEnd: "09:00",
    weeklyLimit: 3,
  },
  completedAt: null,
};

export function readOnboardingDraft(): OnboardingProfile {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) return emptyOnboardingDraft;
    const parsed = JSON.parse(raw) as Partial<OnboardingProfile> & { version?: number };
    if (parsed.version !== 2) return emptyOnboardingDraft;
    return { ...emptyOnboardingDraft, ...parsed };
  } catch {
    return emptyOnboardingDraft;
  }
}

export function saveOnboardingDraft(profile: OnboardingProfile) {
  localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify({ version: 2, ...profile }));
}

export function hasSavedOnboardingDraft(): boolean {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { version?: number };
    return Boolean(parsed && parsed.version === 2);
  } catch {
    return false;
  }
}
