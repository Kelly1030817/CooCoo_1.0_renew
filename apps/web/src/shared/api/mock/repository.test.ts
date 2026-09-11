import { describe, expect, test } from "vitest";
import { createSeedState } from "@coocoo/core";
import type { OnboardingProfile } from "@coocoo/contracts";
import { migrateMockState } from "./repository";

const profile:OnboardingProfile={status:"complete",currentStep:5,cookingExperience:"beginner",currentWeeklyCookingFrequency:1,habitBarriers:["no_ideas"],guidanceMode:"detailed",householdServings:1,cookware:[{type:"電磁爐",limitations:[]}],restrictions:[],preferredFlavors:[],availableMinutes:30,inventoryReviewed:true,hasNoInventory:true,plannedMealSlots:["dinner"],primaryGoalMetric:"cooking_sessions",weeklyGoalTarget:3,reminders:{expiringIngredients:true,plannedMeals:true,weeklyRhythm:true,pushEnabled:false,quietHoursStart:"21:00",quietHoursEnd:"09:00",weeklyLimit:3},completedAt:"2026-09-11T00:00:00.000Z"};

describe("mock repository v2",()=>{
  test("keeps version two state",()=>expect(migrateMockState(createSeedState())?.version).toBe(2));
  test("does not import unversioned or v1 state because there are no legacy users",()=>{expect(migrateMockState({inventory:[]})).toBeNull();expect(migrateMockState({...createSeedState(),version:1})).toBeNull();});
  test("rejects unknown future versions",()=>expect(migrateMockState({version:99})).toBeNull());
  test("applies a completed five-step profile to the weekly goal",()=>expect(migrateMockState(createSeedState(),profile)).toMatchObject({weeklyGoal:{metric:"cooking_sessions",target:3},onboardingProfile:profile}));
});
