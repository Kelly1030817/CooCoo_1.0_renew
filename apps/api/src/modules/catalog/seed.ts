import { brandSafeRecipes } from '@coocoo/core';
import type { CatalogReview, RecipePackage } from '@coocoo/contracts';
import { inspectRecipe, RULE_VERSION, SAFETY_SOURCE } from './quality';
import { recipeFingerprint } from './recommendations';
import type { CatalogRepository } from './repository';

const seedIds=[
  'a1111111-1111-4111-8111-111111111111',
  'a2222222-2222-4222-8222-222222222222',
  'a3333333-3333-4333-8333-333333333333',
];
const eventIds=[
  'b1111111-1111-4111-8111-111111111111',
  'b2222222-2222-4222-8222-222222222222',
  'b3333333-3333-4333-8333-333333333333',
];

export function reviewedSeedRecipes(){
  const accepted:RecipePackage[]=[];
  return brandSafeRecipes.map((source,index)=>{
    const recipe={...structuredClone(source),source:'catalog' as const};
    const review=inspectRecipe(recipe,accepted);
    if(!review.pass)throw new Error(`SEED_RECIPE_REJECTED:${recipe.title}:${review.reasons.join(',')}`);
    accepted.push(recipe);
    return {id:seedIds[index],eventId:eventIds[index],familyId:source.recipeId,recipe,fingerprint:recipeFingerprint(recipe),review};
  });
}

export async function ensureSeedCatalog(repo:CatalogRepository){
  for(const seed of reviewedSeedRecipes()){
    const version=await repo.db.from('recipe_catalog_versions').upsert({id:seed.id,family_id:seed.familyId,recipe:seed.recipe,fingerprint:seed.fingerprint,status:'published',published_at:new Date().toISOString(),reasons:[]},{onConflict:'id',ignoreDuplicates:true});
    if(version.error)throw version.error;
    const reviews:Array<{version_id:string;reviewer:string;result:CatalogReview&Record<string,unknown>}>=['rules','quality','safety'].map(reviewer=>({version_id:seed.id,reviewer,result:{...seed.review,reviewMode:'curated_seed',...(reviewer==='safety'?{source:SAFETY_SOURCE}:{})}}));
    const saved=await repo.db.from('recipe_catalog_reviews').upsert(reviews,{onConflict:'version_id,reviewer',ignoreDuplicates:true});if(saved.error)throw saved.error;
    const event=await repo.db.from('recipe_catalog_events').upsert({id:seed.eventId,version_id:seed.id,kind:'curated_seed_published',detail:{ruleVersion:RULE_VERSION}},{onConflict:'id',ignoreDuplicates:true});if(event.error)throw event.error;
  }
}
