import { describe,expect,test } from 'bun:test';
import { brandSafeRecipes } from '@coocoo/core';
import type { IngredientPrice } from '@coocoo/contracts';
import { recommend, evaluatePurchase } from './recommendations';
import { inspectRecipe } from './quality';
import { catalogRate,usageCost,jobFailureUpdate } from './worker';
import { reviewedSeedRecipes } from './seed';
const now=new Date('2026-09-05T12:00:00Z');
const recipe=()=>({...structuredClone(brandSafeRecipes[0]),ingredients:[{ingredientKey:'蛋',name:'雞蛋',quantity:2,unit:'顆',isPantryStaple:false,isVegetable:false,coveredByInventory:false},{ingredientKey:'油',name:'油',quantity:5,unit:'ml',isPantryStaple:true,isVegetable:false,coveredByInventory:false}]});
const context={weekStart:'2026-08-31',weeklyTarget:3,mealSlots:['dinner'] as const,servings:1,restrictions:[],cookwareTypes:['電磁爐'],perMealBudget:200,inventory:[{ingredientKey:'蛋',quantity:2,unit:'顆',daysLeft:2}]};
const prices:IngredientPrice[]=[{id:'oil',ingredientKey:'油',name:'油',packageQuantity:500,unit:'ml',price:120,source:'reference receipt',observedAt:now.toISOString()}];
describe('quantity and purchase recommendations',()=>{
 test('pantry stock is required and whole-package price determines affordability',()=>{
  expect(recommend([recipe()],context,{mode:'inventory_only',purchaseBudget:100},prices,[],now).eligible).toHaveLength(0);
  expect(recommend([recipe()],context,{mode:'small_purchase',purchaseBudget:100},prices,[],now).eligible).toHaveLength(0);
  const r=recommend([recipe()],context,{mode:'small_purchase',purchaseBudget:120},prices,[],now).eligible[0];expect(r.estimatedPurchaseCost).toBe(120);expect(r.missing[0].purchaseQuantity).toBe(500);
 });
 test('unit conversion, duplicate batches, unknown and expired stock are explicit',()=>{
  const r=recipe();r.ingredients=[{...r.ingredients[0],ingredientKey:'雞肉',name:'雞肉',unit:'克',quantity:120}];
  expect(evaluatePurchase(r,[{ingredientKey:'雞肉',quantity:.06,unit:'kg',daysLeft:1},{ingredientKey:'雞肉',quantity:60,unit:'g',daysLeft:2}],[],now).missing).toHaveLength(0);
  expect(evaluatePurchase(recipe(),[{ingredientKey:'蛋',quantity:2,unit:'盒',daysLeft:1}],[],now).issues.length).toBeGreaterThan(0);
  expect(evaluatePurchase(recipe(),[{ingredientKey:'蛋',quantity:20,unit:'顆',daysLeft:-1}],[],now).missing).toHaveLength(2);
 });
 test('unknown prices do not pass budget filters and stale/future prices are rejected',()=>{
  for(const observedAt of ['2026-01-01T00:00:00Z','2027-01-01T00:00:00Z']){const r=recommend([recipe()],context,{mode:'small_purchase',purchaseBudget:1000},[{...prices[0],observedAt}],[],now);expect(r.eligible).toHaveLength(0);expect(r.needsConfirmation).toHaveLength(1);}
 });
 test('hard restrictions, servings and repetition cannot be silently relaxed',()=>{
  const r=recipe();const stock=[...context.inventory,{ingredientKey:'油',quantity:50,unit:'ml',daysLeft:20}];
  expect(recommend([r],{...context,inventory:stock,servings:2},{mode:'inventory_only',purchaseBudget:100},[],[],now).eligible).toHaveLength(0);
  expect(recommend([r],{...context,inventory:stock},{mode:'inventory_only',purchaseBudget:100},[],[r.title],now).eligible).toHaveLength(0);
  expect(recommend([r],{...context,inventory:stock},{mode:'inventory_only',purchaseBudget:100,allowRepeat:true},[],[r.title],now).eligible).toHaveLength(1);
  expect(recommend([r],{...context,inventory:stock,restrictions:[{id:'r',kind:'allergy',label:'蛋',ingredientKeys:['蛋'],isHardLimit:true}]},{mode:'small_purchase',purchaseBudget:1000,allowRepeat:true},prices,[],now).eligible).toHaveLength(0);
 });
 test('three missing kinds cannot enter the pending-confirmation list',()=>{const r=recipe();r.ingredients.push({...r.ingredients[0],ingredientKey:'豆腐',name:'豆腐'});const result=recommend([r],{...context,inventory:[]},{mode:'small_purchase',purchaseBudget:1000},[],[],now);expect(result.eligible.length+result.needsConfirmation.length).toBe(0);});
 test('reviewed seed lists oil and the rule still rejects a recipe that omits it',()=>{expect(inspectRecipe(brandSafeRecipes[0],[]).pass).toBe(true);const incomplete=structuredClone(brandSafeRecipes[0]);incomplete.ingredients=incomplete.ingredients.filter(item=>item.ingredientKey!=='油');expect(inspectRecipe(incomplete,[]).reasons).toContain('UNLISTED_SEASONING:油');});
 test('fee estimate uses the pinned OpenRouter rate and conservative exchange rate',()=>{expect(usageCost(20000,10000,catalogRate())).toBeCloseTo(.21);});
 test('budget exhaustion defers to next month without consuming an attempt',()=>{expect(jobFailureUpdate('CATALOG_BUDGET_EXHAUSTED',2,new Date('2026-09-06T00:00:00Z'))).toEqual({budgetExhausted:true,update:{status:'deferred',error:'CATALOG_BUDGET_EXHAUSTED',lease_until:null,next_attempt_at:'2026-10-01T00:00:00.000Z',attempts:1}});});
 test('curated seed is complete, unique and passes the deterministic gate',()=>{const seeds=reviewedSeedRecipes();expect(seeds).toHaveLength(3);expect(new Set(seeds.map(seed=>seed.fingerprint)).size).toBe(3);expect(seeds.every(seed=>seed.review.pass&&seed.recipe.source==='catalog')).toBe(true);});
});
