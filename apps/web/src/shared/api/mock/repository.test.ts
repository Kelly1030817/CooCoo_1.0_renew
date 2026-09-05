import { describe, expect, test } from 'vitest'
import { createSeedState } from '@coocoo/core'
import type { OnboardingProfile } from '@coocoo/contracts'
import { migrateMockState } from './repository'

const completedProfile:OnboardingProfile={status:'complete',currentStep:10,householdServings:1,cookware:[{type:'電磁爐',limitations:[]}],restrictions:[],preferredFlavors:[],inventoryReviewed:true,hasNoInventory:true,dailyMealBudget:300,outsideMealComparisonPrice:150,plannedMealSlots:['dinner'],weeklyHomeCookTarget:3,dreamName:'北海道旅行',dreamTargetAmount:30000,completedAt:'2026-08-28T00:00:00.000Z'}

describe('mock repository schema migration',()=>{
  test('keeps version one state',()=>expect(migrateMockState(createSeedState())?.version).toBe(1))
  test('migrates unversioned state without losing inventory',()=>{const value=migrateMockState({inventory:[createSeedState().inventory[0]]});expect(value?.version).toBe(1);expect(value?.inventory).toHaveLength(1)})
  test('rejects unknown future versions',()=>expect(migrateMockState({version:99})).toBeNull())
  test('backfills a missing dream goal from an existing completed onboarding draft',()=>expect(migrateMockState(createSeedState(),completedProfile)).toMatchObject({activeGoal:{id:'goal-onboarding',name:'北海道旅行',targetAmount:30000},onboardingProfile:completedProfile}))
})
