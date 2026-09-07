import { Elysia, t } from 'elysia';
import { IngredientPriceSchema, RecipeRecommendationRequestSchema, type RecipeRecommendationRequest } from '@coocoo/contracts';
import { CatalogRepository } from './repository';
import { SupabaseMealPlanRepository } from '../meal-plans/supabase-meal-plan.repository';
import { recommend } from './recommendations';
import type { PlanningDependencies } from '../meal-plans/routes';
import { taipeiDate, weekOf } from '../meal-plans/meal-planning';
export function catalogRoutes(authenticate:PlanningDependencies['authenticate'],context:PlanningDependencies['context'],repo=new CatalogRepository()){
  const recommendations=async(user:string,request:RecipeRecommendationRequest)=>{
    const [c,recipes,prices,excluded]=await Promise.all([context(user,weekOf(taipeiDate())),repo.published(),repo.prices(),repo.excluded(user)]);
    const result=recommend(recipes,c,request,prices,excluded);
    if(result.eligible.length<3){await repo.demand({ingredients:c.inventory.slice(0,20).map(i=>i.ingredientKey).sort(),cookware:c.cookwareTypes.sort(),restrictions:c.restrictions.filter(r=>r.isHardLimit).map(r=>r.ingredientKeys).flat().sort(),mode:request.mode});}
    return result;
  };
  return new Elysia({name:'recipe-catalog'})
    .get('/api/v1/settings/recipes',async({headers})=>({data:await repo.settings((await authenticate(headers.authorization)).id)}))
    .put('/api/v1/settings/recipes',async({headers,body})=>({data:await repo.saveSettings((await authenticate(headers.authorization)).id,body.purchaseBudget,body.expectedVersion)}),{body:t.Object({purchaseBudget:t.Integer({minimum:0,maximum:100000}),expectedVersion:t.Integer({minimum:0})})})
    .post('/api/v1/recipes/recommendations',async({headers,body})=>({data:await recommendations((await authenticate(headers.authorization)).id,body)}),{body:RecipeRecommendationRequestSchema})
    .post('/api/v1/recipes/:id/start',async({headers,params})=>{const user=(await authenticate(headers.authorization)).id;const result=await recommendations(user,{mode:'inventory_only',purchaseBudget:0,allowRepeat:true});const item=result.eligible.find(r=>r.recipe.catalogVersionId===params.id);if(!item)throw new Error('RECOMMENDATION_CHANGED');return {data:await new SupabaseMealPlanRepository().savePackage(user,item.recipe,'catalog')};})
    .post('/api/v1/recipes/:id/purchases',async({headers,params,body})=>{
      const user=(await authenticate(headers.authorization)).id;const result=await recommendations(user,{mode:'small_purchase',purchaseBudget:body.purchaseBudget,allowRepeat:body.allowRepeat});
      const item=[...result.eligible,...result.needsConfirmation].find(r=>r.recipe.catalogVersionId===params.id);if(!item)throw new Error('RECOMMENDATION_CHANGED');
      if(item.budgetStatus==='unknown')throw new Error('PRICE_CONFIRMATION_REQUIRED');
      await repo.purchase(user,body.operationId,item.missing.map(i=>({...i,quantity:i.purchaseQuantity??i.quantity})));
      return {data:{added:true}};
    },{body:t.Object({operationId:t.String({format:'uuid'}),purchaseBudget:t.Integer({minimum:0}),allowRepeat:t.Optional(t.Boolean())})})
    .post('/api/v1/recipes/:id/report',async({headers,params,body})=>{await repo.report((await authenticate(headers.authorization)).id,params.id,body.safety,body.message);return {data:{reported:true}};},{body:t.Object({safety:t.Boolean(),message:t.String({minLength:1,maxLength:2000})})})
    .get('/api/v1/admin/recipes/access',async({headers})=>{const user=(await authenticate(headers.authorization)).id;try{await repo.owner(user);return {data:{owner:true}};}catch(error){if(error instanceof Error&&error.message==='OWNER_ROLE_REQUIRED')return {data:{owner:false}};throw error;}})
    .get('/api/v1/admin/recipes',async({headers})=>({data:await repo.admin((await authenticate(headers.authorization)).id)}))
    .put('/api/v1/admin/recipes/control',async({headers,body})=>{await repo.pause((await authenticate(headers.authorization)).id,body.paused);return {data:{paused:body.paused}};},{body:t.Object({paused:t.Boolean()})})
    .put('/api/v1/admin/recipes/prices',async({headers,body})=>{await repo.price((await authenticate(headers.authorization)).id,body);return {data:body};},{body:IngredientPriceSchema})
    .post('/api/v1/admin/recipes/:id/review',async({headers,params})=>{await repo.owner((await authenticate(headers.authorization)).id);const r=await repo.db.rpc('request_catalog_revision',{p_version:params.id});if(r.error)throw r.error;return {data:{queued:true}};})
    .post('/api/v1/admin/recipes/:id/quarantine',async({headers,params,body})=>{await repo.quarantine((await authenticate(headers.authorization)).id,params.id,body.reason);return {data:{quarantined:true}};},{body:t.Object({reason:t.String({minLength:1,maxLength:2000})})});
}
