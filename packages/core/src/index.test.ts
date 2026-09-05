import { describe, expect, test } from 'bun:test'
import {
  applyGoalProgress, calculateAverageEatingOutCost, calculateCurrentSaved,
  calculateEstimatedSaving, calculateGoalProjection, CooCooService,
  applyOnboardingProfile, createBalanceAdjustment, createGoalFromDraft, createMilestones, createSeedState,
  getMilestoneProgress, getRescuePlan, getWeekStart, parseShoppingText,
  recordCookingOutcome, recordMealProgress, suggestHomeCookBudget,
  validateMilestonePercents, type StateRepository,
  calculateIngredientOverlap, calculateInventoryCoverage, completeCookingSession,
  evaluateRecipe, postponeMeal,
  brandSafeRecipes, rankRecipes,
} from './index'
import type { MealPlan, OnboardingProfile, PlannedMeal, RecipePackage } from '@coocoo/contracts'

const draft = { purpose:'travel',name:'日本旅行',targetAmount:30000,currentSavedAmount:12000,targetDate:'2027-04-01',eatingOutMeals:7,eatingOutTotal:1050,homeCookBudget:90,weeklyCookingMeals:5 }
const onboardingProfile:OnboardingProfile={status:'complete',currentStep:10,householdServings:1,cookware:[{type:'電磁爐',limitations:[]}],restrictions:[],preferredFlavors:[],inventoryReviewed:true,hasNoInventory:true,dailyMealBudget:300,outsideMealComparisonPrice:150,plannedMealSlots:['dinner'],weeklyHomeCookTarget:3,dreamName:'冬天去北海道',dreamTargetAmount:30000,completedAt:'2026-08-28T00:00:00.000Z'}

describe('single money goal domain', () => {
  test('calculates editable 60 percent suggestion',()=>{expect(calculateAverageEatingOutCost(1050,7)).toBe(150);expect(suggestHomeCookBudget(150)).toBe(90)})
  test('requires direct baseline with zero meals',()=>expect(calculateAverageEatingOutCost(0,0)).toBeNull())
  test('never reports negative savings',()=>expect(calculateEstimatedSaving(100,120)).toBe(0))
  test('projects meals and weeks',()=>expect(calculateGoalProjection({targetAmount:30000,currentSavedAmount:12000,estimatedSavingPerMeal:100,weeklyCookingMeals:5,now:new Date('2026-07-19T00:00:00Z')})).toMatchObject({mealsNeeded:180,estimatedWeeks:36,estimatedDate:'2027-03-28'}))
  test('short goals use their actual target date',()=>expect(calculateGoalProjection({targetAmount:2100,estimatedSavingPerMeal:100,weeklyCookingMeals:7,targetDate:'2026-08-08',now:new Date('2026-07-19T00:00:00Z')}).requiredWeeklyMeals).toBe(8))
  test('returns invalid target state',()=>expect(calculateGoalProjection({targetAmount:0}).status).toBe('invalid_target'))
  test('returns no saving state',()=>expect(calculateGoalProjection({targetAmount:1000,estimatedSavingPerMeal:0}).status).toBe('no_saving'))
  test('returns no frequency state',()=>expect(calculateGoalProjection({targetAmount:1000,estimatedSavingPerMeal:50,weeklyCookingMeals:0}).status).toBe('no_frequency'))
  test('returns completed state',()=>expect(calculateGoalProjection({targetAmount:1000,currentSavedAmount:1200}).status).toBe('completed'))
  test('creates cumulative milestones',()=>expect(createMilestones(30000).milestones.map(m=>m.targetAmount)).toEqual([7500,18000,30000]))
  test('rejects overlapping milestones',()=>expect(validateMilestonePercents(70,60).valid).toBeFalse())
  test('creates a signed balance adjustment',()=>expect(createBalanceAdjustment([{amount:10000},{amount:2000}],10000).amount).toBe(-2000))
  test('creates one active goal',()=>expect(createGoalFromDraft(draft,{id:'goal_test',now:new Date('2026-07-19T00:00:00Z')})).toMatchObject({valid:true,goal:{id:'goal_test'},cookingPlan:{eatingOutCost:150,estimatedSavingPerMeal:60}}))
  test('rejects missing baseline',()=>expect(createGoalFromDraft({...draft,eatingOutMeals:0,eatingOutTotal:0,directEatingOutCost:0}).valid).toBeFalse())
  test('marks one milestone current',()=>expect(getMilestoneProgress(createMilestones(30000).milestones,12000).map(m=>m.status)).toEqual(['completed','current','upcoming']))
  test('marks all milestones complete',()=>expect(getMilestoneProgress(createMilestones(30000).milestones,32000).every(m=>m.status==='completed')).toBeTrue())
  test('splits extra deposit',()=>expect(recordCookingOutcome([],{completionKey:'one',goalId:'g',estimatedSaving:60,actualDeposit:100},{id:'o'}).amountEvents.map(e=>e.amount)).toEqual([60,40]))
  test('accepts zero deposit',()=>expect(recordCookingOutcome([],{completionKey:'two',goalId:'g',estimatedSaving:60,actualDeposit:0}).accepted).toBeTrue())
  test('rejects duplicate completion',()=>expect(recordCookingOutcome([{completionKey:'same'} as never],{completionKey:'same',goalId:'g'}).reason).toBe('duplicate'))
  test('records habit without unsafe health credit',()=>expect(recordMealProgress({habitProgress:{totalMeals:0,weeklyCompletions:{},events:[]},healthAssets:{healthyAutonomyMeals:0,vegetableMeals:0,lowOilMeals:0,mindfulSeasoningMeals:0,events:[]}},{outcomeId:'o',foodSafe:false,vegetables:true,lowOil:false,mindfulSeasoning:false}).healthAssets.healthyAutonomyMeals).toBe(0))
  test('records healthy autonomy meal',()=>expect(recordMealProgress({habitProgress:{totalMeals:0,weeklyCompletions:{},events:[]},healthAssets:{healthyAutonomyMeals:0,vegetableMeals:0,lowOilMeals:0,mindfulSeasoningMeals:0,events:[]}},{outcomeId:'o',foodSafe:true,vegetables:true,lowOil:true,mindfulSeasoning:false}).healthAssets.healthyAutonomyMeals).toBe(1))
  test('finds monday week key',()=>expect(getWeekStart(new Date('2026-07-19T00:00:00Z'))).toBe('2026-07-13'))
  test('completes and reactivates goal',()=>{const goal=createGoalFromDraft(draft).goal!;const completed=applyGoalProgress(goal,30000).goal;expect(completed.status).toBe('completed');expect(applyGoalProgress(completed,29000).goal.status).toBe('active')})
  test('sums signed events without negative balance',()=>expect(calculateCurrentSaved([{amount:50},{amount:-100}])).toBe(0))
})

describe('onboarding goal connection',()=>{
  test('creates the dream dashboard goal from a completed onboarding profile',()=>{const state=applyOnboardingProfile(createSeedState(),onboardingProfile,{id:'goal-onboarding',now:new Date('2026-08-28T00:00:00.000Z')});expect(state.activeGoal).toMatchObject({id:'goal-onboarding',purpose:'dream',name:'冬天去北海道',targetAmount:30000});expect(state.cookingPlan).toMatchObject({eatingOutCost:150,homeCookBudget:300,weeklyCookingMeals:3});expect(state.onboardingProfile).toEqual(onboardingProfile)})
  test('is idempotent when an active goal already exists',()=>{const first=applyOnboardingProfile(createSeedState(),onboardingProfile,{id:'goal-first'});const second=applyOnboardingProfile(first,{...onboardingProfile,dreamName:'不應覆蓋既有目標'},{id:'goal-second'});expect(second.activeGoal).toMatchObject({id:'goal-first',name:'冬天去北海道'});expect(second.archivedGoals).toHaveLength(0)})
})

describe('inventory, cooking and shopping use cases', () => {
  const repository = (): StateRepository & { value: ReturnType<typeof createSeedState> } => ({ value:createSeedState(), read(){return this.value},write(value){this.value=value},reset(){this.value=createSeedState();return this.value} })
  test('builds rescue options from one item',()=>expect(getRescuePlan(createSeedState().inventory[0]).preserve.packages).toBe(2))
  test('unsafe food cannot be preserved',()=>{const repo=repository();const service=new CooCooService(repo);expect(()=>service.rescue('i1','preserve',false)).toThrow('UNSAFE_ACTION')})
  test('preservation replaces the source inventory item',()=>{const repo=repository();new CooCooService(repo).rescue('i2','preserve',true);expect(repo.value.inventory.some(i=>i.name==='胡蘿蔔冷凍備料包')).toBeTrue()})
  test('parses chinese shopping quantities',()=>expect(parseShoppingText('雞蛋兩盒、番茄3顆').map(i=>i.qty)).toEqual([2,3]))
  test('restock is atomic and clears selected items',()=>{const repo=repository();const result=new CooCooService(repo).restock();expect(result.count).toBe(1);expect(repo.value.shoppingItems.some(i=>i.id==='s3')).toBeFalse();expect(repo.value.inventory.some(i=>i.name==='富士蘋果')).toBeTrue()})
})

const ingredient = (ingredientKey:string, coveredByInventory=false, isPantryStaple=false) => ({
  ingredientKey,name:ingredientKey,quantity:1,unit:'份',isPantryStaple,isVegetable:false,coveredByInventory,
})
const plannedMeal = (id:string, ingredients:ReturnType<typeof ingredient>[], date='2026-08-25', slot:PlannedMeal['slot']='dinner'):PlannedMeal => ({
  id,date,slot,recipeId:`recipe-${id}`,title:id,status:'planned',servings:1,ingredients,estimatedCost:80,totalMinutes:20,cookwareTypes:['電磁爐'],energyLevel:'normal',
})

describe('integrated MVP rules',()=>{
  const recipe:RecipePackage & {estimatedCost:number}={
    id:'pkg-1',recipeId:'r1',title:'番茄蛋',servings:1,prepMinutes:5,totalMinutes:15,cookwareTypes:['電磁爐'],estimatedCost:70,
    ingredients:[ingredient('egg'),ingredient('tomato')],steps:[{id:'step-1',order:1,instruction:'炒熟',voiceText:'炒熟',timerSeconds:null,safetyNote:null}],imageUrl:null,fallbackImageUrl:'/fallback.svg',downloadedAt:null,
  }
  test('hard allergy always excludes a recipe',()=>expect(evaluateRecipe(recipe,{restrictions:[{id:'d1',label:'蛋過敏',kind:'allergy',ingredientKeys:['egg'],isHardLimit:true}],cookwareTypes:['電磁爐'],dailyBudget:100,energyLevel:'normal'})).toMatchObject({eligible:false,reasons:['含有禁用食材：蛋過敏']}))
  test('missing cookware excludes a recipe',()=>expect(evaluateRecipe(recipe,{restrictions:[],cookwareTypes:['微波爐'],dailyBudget:100,energyLevel:'normal'}).eligible).toBeFalse())
  test('low energy means at most 30 minutes, 6 steps and 2 cookware',()=>expect(evaluateRecipe({...recipe,totalMinutes:30,steps:Array.from({length:6},(_,i)=>({...recipe.steps[0],id:`s${i}`,order:i+1}))},{restrictions:[],cookwareTypes:['電磁爐'],dailyBudget:100,energyLevel:'low'})).toMatchObject({eligible:true,lowEnergyMeal:true,quickMeal:false}))
  test('overlap ignores pantry staples and counts unique ingredients shared by meals',()=>{const meals=[plannedMeal('a',[ingredient('tomato'),ingredient('salt',false,true)]),plannedMeal('b',[ingredient('tomato'),ingredient('egg')])];expect(calculateIngredientOverlap(meals)).toBe(0.5)})
  test('inventory coverage stays separate from overlap',()=>expect(calculateInventoryCoverage([plannedMeal('a',[ingredient('tomato',true),ingredient('egg',false)])])).toBe(0.5))
  test('postpones into next open slot and refreshes plan rates',()=>{const plan:MealPlan={id:'p',weekStart:'2026-08-24',meals:[plannedMeal('a',[ingredient('tomato')]),plannedMeal('b',[ingredient('egg')],'2026-08-26','breakfast')],overlapRate:0,inventoryCoverageRate:0,updatedAt:new Date(0).toISOString()};expect(postponeMeal(plan,'a',{kind:'next_slot'}).meals[0]).toMatchObject({date:'2026-08-26',slot:'lunch',status:'planned'})})
  test('one cook can create eaten meals and prepared servings',()=>{const result=completeCookingSession({completedOperationIds:[],servings:[],savingsEvents:[]},{operationId:'op-1',sessionId:'session-1',servingsCooked:2,servingsEaten:1,outsideMealPrice:150,ingredientCost:60,confirmedSavings:90},'2026-08-25T00:00:00.000Z');expect(result.servings.map(item=>item.status)).toEqual(['eaten','prepared_inventory']);expect(result.homeCookedMealsAdded).toBe(1);expect(result.savingsEvents[0].confirmedAmount).toBe(90)})
  test('duplicate offline completion is ignored',()=>expect(completeCookingSession({completedOperationIds:['op-1'],servings:[],savingsEvents:[]},{operationId:'op-1',sessionId:'session-1',servingsCooked:2,servingsEaten:1,outsideMealPrice:150,ingredientCost:60,confirmedSavings:90}).accepted).toBeFalse())
  test('today ranking prioritizes expiring inventory after hard filters',()=>{const ranked=rankRecipes(brandSafeRecipes,{restrictions:[{id:'peanut',label:'花生',kind:'allergy',ingredientKeys:['花生'],isHardLimit:true}],cookwareTypes:['電磁爐'],dailyBudget:100,energyLevel:'normal'},[{ingredientKey:'番茄',daysLeft:1}]);expect(ranked[0].recipe.title).toBe('番茄滑蛋飯')})
})
