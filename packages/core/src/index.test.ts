import { describe, expect, test } from 'bun:test'
import {
  applyGoalProgress, calculateAverageEatingOutCost, calculateCurrentSaved,
  calculateEstimatedSaving, calculateGoalProjection, CooCooService,
  createBalanceAdjustment, createGoalFromDraft, createMilestones, createSeedState,
  getMilestoneProgress, getRescuePlan, getWeekStart, parseShoppingText,
  recordCookingOutcome, recordMealProgress, suggestHomeCookBudget,
  validateMilestonePercents, type StateRepository,
} from './index'

const draft = { purpose:'travel',name:'日本旅行',targetAmount:30000,currentSavedAmount:12000,targetDate:'2027-04-01',eatingOutMeals:7,eatingOutTotal:1050,homeCookBudget:90,weeklyCookingMeals:5 }

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

describe('inventory, cooking and shopping use cases', () => {
  const repository = (): StateRepository & { value: ReturnType<typeof createSeedState> } => ({ value:createSeedState(), read(){return this.value},write(value){this.value=value},reset(){this.value=createSeedState();return this.value} })
  test('builds rescue options from one item',()=>expect(getRescuePlan(createSeedState().inventory[0]).preserve.packages).toBe(2))
  test('unsafe food cannot be preserved',()=>{const repo=repository();const service=new CooCooService(repo);expect(()=>service.rescue('i1','preserve',false)).toThrow('UNSAFE_ACTION')})
  test('preservation replaces the source inventory item',()=>{const repo=repository();new CooCooService(repo).rescue('i2','preserve',true);expect(repo.value.inventory.some(i=>i.name==='胡蘿蔔冷凍備料包')).toBeTrue()})
  test('parses chinese shopping quantities',()=>expect(parseShoppingText('雞蛋兩盒、番茄3顆').map(i=>i.qty)).toEqual([2,3]))
  test('restock is atomic and clears selected items',()=>{const repo=repository();const result=new CooCooService(repo).restock();expect(result.count).toBe(1);expect(repo.value.shoppingItems.some(i=>i.id==='s3')).toBeFalse();expect(repo.value.inventory.some(i=>i.name==='富士蘋果')).toBeTrue()})
})
