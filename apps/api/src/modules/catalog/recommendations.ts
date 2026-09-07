import type { IngredientPrice, RecipePackage, RecipeRecommendation, RecipeRecommendationRequest, RecipeRecommendations } from '@coocoo/contracts';
import { evaluateRecipe } from '@coocoo/core';
import type { MealPlanningContext, Stock } from '../meal-plans/meal-planning';

export const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase('zh-TW');
const units: Record<string, [string, number]> = { g:['g',1], 克:['g',1], 公克:['g',1], kg:['g',1000], 公斤:['g',1000], ml:['ml',1], 毫升:['ml',1], l:['ml',1000], 公升:['ml',1000], 個:['piece',1], 顆:['piece',1] };
export function measure(quantity: number, unit: string) { const [base,factor]=units[normalize(unit)] || [normalize(unit),1];return {quantity:quantity*factor,unit:base,factor}; }
export function sameIngredient(a: { ingredientKey: string; name?: string }, b: { ingredientKey: string; name?: string }) {
  return [a.ingredientKey,a.name||''].filter(Boolean).map(normalize).some(key=>[b.ingredientKey,b.name||''].filter(Boolean).map(normalize).includes(key));
}
export function recipeFingerprint(recipe: RecipePackage) { return recipe.ingredients.map(i=>normalize(i.ingredientKey)).sort().join('|')+'::'+recipe.cookwareTypes.map(normalize).sort().join('|')+'::'+recipe.steps.map(s=>normalize(s.instruction).replace(/[\s，。、]/g,'')).join('|'); }
export function evaluatePurchase(recipe: RecipePackage, inventory: Stock[], prices: IngredientPrice[], now: Date): RecipeRecommendation {
  const remaining=inventory.filter(i=>i.daysLeft>=0).map(i=>({...i,...measure(i.quantity??0,i.unit||'')}));
  const missing: RecipeRecommendation['missing']=[];const issues:string[]=[];
  for(const ingredient of recipe.ingredients){
    const need=measure(ingredient.quantity,ingredient.unit);let quantity=need.quantity;
    const matches=remaining.filter(s=>sameIngredient(s,ingredient));
    for(const stock of matches.filter(s=>s.unit===need.unit)){const used=Math.min(quantity,stock.quantity);quantity-=used;stock.quantity-=used;}
    ingredient.coveredByInventory=quantity<=1e-8;
    if(quantity<=1e-8)continue;
    if(matches.some(s=>s.unit!==need.unit&&s.quantity>0))issues.push(`${ingredient.name}庫存單位待確認`);
    const options=prices.filter(p=>sameIngredient(p,ingredient)&&measure(p.packageQuantity,p.unit).unit===need.unit&&Date.parse(p.observedAt)<=now.getTime()&&now.getTime()-Date.parse(p.observedAt)<=30*86400000);
    const priced=options.map(price=>{const pack=measure(price.packageQuantity,price.unit);const count=Math.ceil((quantity-1e-8)/pack.quantity);return {price,count,cost:count*price.price};}).sort((a,b)=>a.cost-b.cost||a.price.id.localeCompare(b.price.id))[0];
    missing.push({ingredientKey:ingredient.ingredientKey,name:ingredient.name,quantity:quantity/need.factor,unit:ingredient.unit,packages:priced?.count??null,purchaseQuantity:priced?measure(priced.price.packageQuantity,priced.price.unit).quantity*priced.count/need.factor:null,estimatedCost:priced?.cost??null,priceId:priced?.price.id??null,priceObservedAt:priced?.price.observedAt??null});
  }
  const estimatedPurchaseCost=missing.every(i=>i.estimatedCost!==null)?missing.reduce((sum,i)=>sum+i.estimatedCost!,0):null;
  return {recipe,missing,estimatedPurchaseCost,budgetStatus:estimatedPurchaseCost===null||issues.length?'unknown':'within_budget',issues};
}
export function recommend(recipes: RecipePackage[], context: MealPlanningContext, request: RecipeRecommendationRequest, prices: IngredientPrice[], excludedTitles: string[]=[], now=new Date()): RecipeRecommendations {
  const eligible:RecipeRecommendation[]=[];const needsConfirmation:RecipeRecommendation[]=[];
  const seen=new Set<string>();
  for(const source of recipes){
    const title=normalize(source.title);if(seen.has(title)||(!request.allowRepeat&&excludedTitles.map(normalize).includes(title)))continue;
    const factor=context.servings/source.servings;
    const recipe={...structuredClone(source),servings:context.servings,estimatedCost:Math.ceil(source.estimatedCost*factor),ingredients:source.ingredients.map(i=>({...i,quantity:i.quantity*factor}))};
    if(!evaluateRecipe(recipe,{restrictions:context.restrictions,cookwareTypes:context.cookwareTypes,dailyBudget:context.perMealBudget*context.servings,energyLevel:request.energy||'normal'}).eligible)continue;
    const result=evaluatePurchase(recipe,context.inventory,prices,now);
    if(request.mode==='inventory_only'&&result.missing.length)continue;
    if(request.mode==='small_purchase'&&(new Set(result.missing.map(i=>normalize(i.ingredientKey))).size>2||(result.estimatedPurchaseCost!==null&&result.estimatedPurchaseCost>request.purchaseBudget)))continue;
    seen.add(title);(result.budgetStatus==='unknown'?needsConfirmation:eligible).push(result);
  }
  const score=(r:RecipeRecommendation)=>r.recipe.ingredients.reduce((sum,i)=>sum+(context.inventory.some(s=>s.daysLeft>=0&&s.daysLeft<=3&&sameIngredient(i,s))?100:0),0)-(r.estimatedPurchaseCost??0);
  eligible.sort((a,b)=>score(b)-score(a)||a.recipe.title.localeCompare(b.recipe.title));
  return {mode:request.mode,eligible,needsConfirmation,notice:eligible.length?'依已發布食譜、庫存與限制推薦；補買價格為估算。':'目前沒有可確認符合條件的新菜色。可確認庫存、切換模式或主動選擇重複菜色。'};
}
