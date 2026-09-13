import type { OnboardingProfile } from "@coocoo/contracts";

export function isOnboardingStepValid(
  step: number,
  profile: OnboardingProfile,
) {
  return step === 1
    ? profile.habitBarriers.length > 0
    : step === 2
      ? profile.cookware.length > 0
      : step === 3
        ? profile.plannedMealSlots.length > 0
        : step === 4
          ? true
          : profile.weeklyGoalTarget > 0;
}

export function completeOnboardingProfile(profile: OnboardingProfile, completedAt: string): OnboardingProfile {
  return {
    ...profile,
    status: "complete",
    currentStep: 5,
    inventoryReviewed: false,
    hasNoInventory: false,
    completedAt,
  };
}
