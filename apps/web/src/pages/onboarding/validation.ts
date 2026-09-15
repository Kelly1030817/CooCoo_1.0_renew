import type { OnboardingProfile } from "@coocoo/contracts";

export function isOnboardingStepValid(step: number, profile: OnboardingProfile) {
  return step === 1
    ? profile.plannedMealSlots.length > 0
    : step === 2
      ? profile.cookware.length > 0 && profile.habitBarriers.length > 0
      : true;
}

export function completeOnboardingProfile(
  profile: OnboardingProfile,
  completedAt: string,
): OnboardingProfile {
  return {
    ...profile,
    status: "complete",
    currentStep: 3,
    cookingExperience: "beginner",
    guidanceMode: "detailed",
    primaryGoalMetric: "cooking_sessions",
    currentWeeklyCookingFrequency: 0,
    weeklyGoalTarget: 1,
    inventoryReviewed: false,
    hasNoInventory: false,
    completedAt,
  };
}
