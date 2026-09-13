import type { OnboardingProfile } from "@coocoo/contracts";

export function isOnboardingStepValid(
  step: number,
  profile: OnboardingProfile,
  inventory: { name: string; expiresOn: string },
  ocrInventoryConfirmed: boolean,
) {
  return step === 1
    ? profile.habitBarriers.length > 0
    : step === 2
      ? profile.cookware.length > 0
      : step === 3
        ? profile.plannedMealSlots.length > 0
        : step === 4
          ? profile.hasNoInventory || ocrInventoryConfirmed || Boolean(inventory.name.trim() && inventory.expiresOn)
          : profile.weeklyGoalTarget > 0;
}
