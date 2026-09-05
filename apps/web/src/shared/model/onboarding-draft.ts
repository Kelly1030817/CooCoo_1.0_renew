import type { OnboardingProfile } from "@coocoo/contracts";

export const ONBOARDING_DRAFT_STORAGE_KEY = "coocoo:onboarding-draft:v1";

export const emptyOnboardingDraft: OnboardingProfile = {
  status: "draft",
  currentStep: 1,
  householdServings: 1,
  cookware: [],
  restrictions: [],
  preferredFlavors: [],
  inventoryReviewed: false,
  hasNoInventory: false,
  dailyMealBudget: 300,
  outsideMealComparisonPrice: 150,
  plannedMealSlots: ["dinner"],
  weeklyHomeCookTarget: 3,
  dreamName: "",
  dreamTargetAmount: 0,
  completedAt: null,
};

export function readOnboardingDraft(): OnboardingProfile {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) return emptyOnboardingDraft;
    const parsed = JSON.parse(raw) as Partial<OnboardingProfile> & { version?: number };
    if (parsed.version !== 1) return emptyOnboardingDraft;
    return { ...emptyOnboardingDraft, ...parsed };
  } catch {
    return emptyOnboardingDraft;
  }
}

export function saveOnboardingDraft(profile: OnboardingProfile) {
  localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, ...profile }));
}
