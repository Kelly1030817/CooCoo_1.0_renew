import { describe,expect,test } from 'bun:test';
import { Elysia } from 'elysia';
import { brandSafeRecipes } from '@coocoo/core';
import type { CatalogRepository } from './repository';
import { catalogRoutes } from './routes';

const user='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const recipe={...structuredClone(brandSafeRecipes[0]),catalogVersionId:'a1111111-1111-4111-8111-111111111111',source:'catalog' as const};
const context=async()=>({weekStart:'2026-09-07',weeklyTarget:3,mealSlots:['dinner'] as const,servings:1,restrictions:[],cookwareTypes:['電磁爐'],cookware:[{type:'電磁爐',capacity:null,limitations:[]}],perMealBudget:200,inventory:recipe.ingredients.map(item=>({ingredientKey:item.ingredientKey,name:item.name,quantity:item.quantity,unit:item.unit,daysLeft:5})),ingredientIds:{}});
function api(repo:Partial<CatalogRepository>,planningContext=context){return new Elysia().use(catalogRoutes(async authorization=>{if(authorization!=='Bearer valid')throw new Error('AUTH_REQUIRED');return{id:user};},planningContext as never,repo as CatalogRepository));}

describe('catalog HTTP routes',()=>{
 test('returns only inventory-covered published recipes',async()=>{const response=await api({published:async()=>[recipe],prices:async()=>[],excluded:async()=>[],demand:async()=>{}}).handle(new Request('http://localhost/api/v1/recipes/recommendations',{method:'POST',headers:{authorization:'Bearer valid','content-type':'application/json'},body:JSON.stringify({mode:'inventory_only',purchaseBudget:100})}));expect(response.status).toBe(200);expect((await response.json() as any).data.eligible[0].recipe.source).toBe('catalog');});
 test('hides owner controls from a normal member',async()=>{const response=await api({owner:async()=>{throw new Error('OWNER_ROLE_REQUIRED');}}).handle(new Request('http://localhost/api/v1/admin/recipes/access',{headers:{authorization:'Bearer valid'}}));expect(await response.json()).toEqual({data:{owner:false}});});
 test('adds a confirmed purchase through one idempotent repository call',async()=>{let saved:unknown[]=[];const missingRice=async()=>({...await context(),inventory:(await context()).inventory.filter(item=>item.ingredientKey!=='白飯')});const response=await api({published:async()=>[recipe],prices:async()=>[{id:'rice',ingredientKey:'白飯',name:'白飯',packageQuantity:1,unit:'碗',price:40,source:'https://example.com/rice',observedAt:new Date().toISOString()}],excluded:async()=>[],demand:async()=>{},purchase:async(_user,_operation,items)=>{saved=items;}},missingRice).handle(new Request(`http://localhost/api/v1/recipes/${recipe.catalogVersionId}/purchases`,{method:'POST',headers:{authorization:'Bearer valid','content-type':'application/json'},body:JSON.stringify({operationId:crypto.randomUUID(),purchaseBudget:100})}));expect(response.status).toBe(200);expect(saved).toHaveLength(1);expect(saved[0]).toMatchObject({ingredientKey:'白飯',quantity:1});});
});
