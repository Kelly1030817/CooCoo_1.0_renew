import type { DietaryRestriction, InventoryItem, MealTask, MealTaskCreate, RecipePackage, RecipeSearchItem } from "@coocoo/contracts";
import { sameIngredient } from "./ingredient";

const normalize=(value:string)=>value.trim().toLocaleLowerCase("zh-TW");

export function searchRecipes(recipes:RecipePackage[],inventory:InventoryItem[],query:string,keywords:string[]=[],favorites=new Set<string>()):RecipeSearchItem[]{
  const wanted=[...keywords,query].flatMap((value)=>value.split(/[\s,，、]+/)).map(normalize).filter(Boolean);
  return recipes.map((recipe)=>{const haystack=[recipe.title,...recipe.ingredients.flatMap((item)=>[item.name,item.ingredientKey])].map(normalize);const matched=wanted.filter((word)=>haystack.some((value)=>value.includes(word)));const available=recipe.ingredients.filter((item)=>!item.isPantryStaple&&inventory.some((stock)=>stock.qty>0&&sameIngredient(stock,item))).length;const required=recipe.ingredients.filter((item)=>!item.isPantryStaple).length;return{recipe,missing:[],estimatedPurchaseCost:null,budgetStatus:"unknown" as const,issues:[],matchedKeywords:matched,match:wanted.length===0||matched.length===wanted.length?"all" as const:matched.length?"partial" as const:"none" as const,favorite:favorites.has(recipe.recipeId),_coverage:required?available/required:1};}).filter((item)=>wanted.length===0||item.match!=="none").sort((a,b)=>(b.match==="all"?2:1)-(a.match==="all"?2:1)||b._coverage-a._coverage).map(({_coverage,...item})=>item);
}

export function assertRecipeSafety(recipe:RecipePackage,restrictions:DietaryRestriction[]){
  const blocked=restrictions.filter((restriction)=>restriction.isHardLimit&&[restriction.label,...restriction.ingredientKeys].some((key)=>recipe.ingredients.some((ingredient)=>sameIngredient({ingredientKey:key,name:restriction.label},ingredient))));
  if(blocked.length)throw new Error("HARD_RESTRICTION_VIOLATION");
}

export function createMealTask(command:MealTaskCreate,recipe:RecipePackage,inventory:InventoryItem[],restrictions:DietaryRestriction[],now=new Date().toISOString()):MealTask{
  assertRecipeSafety(recipe,restrictions);
  const factor=command.currentMeal.servings/Math.max(1,recipe.servings)+(command.nextMeal.strategy==="cook_extra"?command.nextMeal.servings/Math.max(1,recipe.servings):0);
  const remaining=inventory.map((item)=>({...item}));
  const shortages=recipe.ingredients.filter((item)=>!item.isPantryStaple).flatMap((item)=>{
    const required=item.quantity*factor;
    let available=0;
    for(const stock of remaining.filter((candidate)=>candidate.unit===item.unit&&sameIngredient(candidate,item))){
      const used=Math.min(required-available,stock.qty);
      available+=used;
      stock.qty-=used;
      if(available>=required)break;
    }
    const missing=Math.max(0,required-available);
    return missing>0?[{id:`${command.operationId}:${item.ingredientKey}`,ingredientKey:item.ingredientKey,name:item.name,quantity:missing,unit:item.unit,resolution:"needed" as const}]:[];
  });
  return{id:command.operationId,operationId:command.operationId,recipe,status:shortages.length?"needs_shopping":"ready",currentMeal:command.currentMeal,nextMeal:command.nextMeal,plannedTotalServings:command.currentMeal.servings+(command.nextMeal.strategy==="cook_extra"?command.nextMeal.servings:0),shortages,revision:1,createdAt:now,updatedAt:now};
}
