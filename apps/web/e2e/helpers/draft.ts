import type { Page } from "@playwright/test";

export const ONBOARDING_DRAFT_STORAGE_KEY = "coocoo:onboarding-draft:v2";

export const completedOnboardingDraft = {
  version: 2,
  status: "complete",
  currentStep: 3,
  cookingExperience: "beginner",
  currentWeeklyCookingFrequency: 0,
  habitBarriers: ["no_ideas"],
  guidanceMode: "detailed",
  householdServings: 1,
  cookware: [{ type: "電磁爐", limitations: [] }],
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
  completedAt: "2026-09-15T00:00:00.000Z",
};

export async function seedCompletedOnboarding(page: Page) {
  await page.addInitScript(
    ({ key, draft }) => {
      window.localStorage.setItem(key, JSON.stringify(draft));
    },
    { key: ONBOARDING_DRAFT_STORAGE_KEY, draft: completedOnboardingDraft },
  );
}

export async function preparePage(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
}
