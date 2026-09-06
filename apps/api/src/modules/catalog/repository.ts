import type { CatalogAdminState, CatalogVersion, IngredientPrice, RecipePackage, RecipePreferences } from '@coocoo/contracts';
import { getSupabaseAdmin } from '../../shared/infrastructure/supabase';
import { normalize } from './recommendations';
import { ensureSeedCatalog } from './seed';

type Row={id:string;family_id:string;status:CatalogVersion['status'];recipe:RecipePackage;created_at:string;reasons:string[]};
const version=(row:Row):CatalogVersion=>({id:row.id,familyId:row.family_id,status:row.status,recipe:{...row.recipe,source:'catalog',catalogVersionId:row.id,recipeId:row.id,id:`catalog-${row.id}`},createdAt:row.created_at,reasons:row.reasons});
export class CatalogRepository {
  get db(){return getSupabaseAdmin();}
  async owner(user:string){const r=await this.db.from('app_roles').select('role').eq('user_id',user).eq('role','owner').maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('OWNER_ROLE_REQUIRED');}
  async versions(status?:string){let q=this.db.from('recipe_catalog_versions').select('*').order('created_at',{ascending:false});if(status)q=q.eq('status',status);const r=await q.limit(1000);if(r.error)throw r.error;return (r.data as Row[]).map(version);}
  async published(){let versions=await this.versions('published');if(!versions.length){await ensureSeedCatalog(this);versions=await this.versions('published');}return versions.map(v=>v.recipe);}
  async get(id:string){const r=await this.db.from('recipe_catalog_versions').select('*').eq('id',id).maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('RECIPE_PACKAGE_NOT_FOUND');return version(r.data as Row);}
  async assertAvailable(recipe:RecipePackage){if(recipe.catalogVersionId&&(await this.get(recipe.catalogVersionId)).status!=='published')throw new Error('RECIPE_WITHDRAWN');}
  async prices(){const r=await this.db.from('recipe_reference_prices').select('id,data');if(r.error)throw r.error;return (r.data||[]).map(r=>({...r.data,id:r.id}) as IngredientPrice);}
  async settings(user:string):Promise<RecipePreferences>{const r=await this.db.from('profiles').select('recipe_purchase_budget,recipe_budget_confirmed,recipe_settings_version').eq('user_id',user).single();if(r.error)throw r.error;return {purchaseBudget:r.data.recipe_purchase_budget,confirmed:r.data.recipe_budget_confirmed,version:r.data.recipe_settings_version};}
  async saveSettings(user:string,budget:number,expected:number){const r=await this.db.rpc('save_recipe_preferences',{p_user_id:user,p_budget:budget,p_expected:expected});if(r.error)throw r.error;return r.data as RecipePreferences;}
  async excluded(user:string){
    const since=new Date(Date.now()-7*86400000).toISOString();
    const [c,p]=await Promise.all([this.db.from('cooking_sessions').select('recipes(title)').eq('user_id',user).gte('completed_at',since),this.db.from('planned_meals').select('recipes(title)').eq('user_id',user).in('status',['planned','postponed']).gte('planned_date',since.slice(0,10))]);
    if(c.error)throw c.error;if(p.error)throw p.error;
    return [...(c.data||[]),...(p.data||[])].flatMap(row=>{const r=row.recipes as unknown as {title:string}|{title:string}[];return Array.isArray(r)?r.map(x=>x.title):r?[r.title]:[];});
  }
  async demand(context:Record<string,unknown>){const signature=JSON.stringify(context);const r=await this.db.rpc('record_recipe_demand',{p_signature:signature,p_context:context});if(r.error)throw r.error;}
  async purchase(user:string,operationId:string,items:unknown[]){const r=await this.db.rpc('add_recipe_purchases',{p_user:user,p_operation:operationId,p_items:items});if(r.error)throw r.error;}
  async admin(user:string):Promise<CatalogAdminState>{await this.owner(user);const month=new Date(Date.now()+8*3600000).toISOString().slice(0,7);const since=month+'-01T00:00:00+08:00';
    const [versions,prices,control,usage,jobs,reports]=await Promise.all([this.versions(),this.prices(),this.db.from('recipe_catalog_control').select('*').single(),this.db.from('recipe_catalog_usage').select('*').gte('created_at',since),this.db.from('recipe_catalog_jobs').select('id',{count:'exact',head:true}).gte('created_at',since),this.db.from('recipe_catalog_reports').select('id,version_id,safety,message,created_at,processed_at,recipe_catalog_versions(recipe)').order('created_at',{ascending:false}).limit(100)]);
    for(const r of [control,usage,jobs,reports])if(r.error)throw r.error;
    const spentTwd=(usage.data||[]).reduce((n,r)=>n+Number(r.actual_twd??0),0),reservedTwd=(usage.data||[]).filter(r=>r.actual_twd===null).reduce((n,r)=>n+Number(r.reserved_twd),0);
    return {versions,prices,paused:control.data.paused,month,spentTwd,reservedTwd,candidateCount:jobs.count||0,lastRunAt:control.data.last_run_at,alerts:[...(spentTwd+reservedTwd>=240?['AI 額度已達 80%']:[]),...(!control.data.last_run_at||Date.now()-Date.parse(control.data.last_run_at)>2*3600000?['排程尚未執行或超過兩小時未回報']:[])],reports:(reports.data||[]).map(row=>{const joined=row.recipe_catalog_versions as unknown as {recipe:{title?:string}}|{recipe:{title?:string}}[]|null;const relation=Array.isArray(joined)?joined[0]:joined;return{id:row.id,versionId:row.version_id,title:relation?.recipe?.title||'未知食譜',safety:row.safety,message:row.message,createdAt:row.created_at,processedAt:row.processed_at};})};
  }
  async pause(user:string,paused:boolean){await this.owner(user);const r=await this.db.from('recipe_catalog_control').update({paused}).eq('id',true);if(r.error)throw r.error;}
  async quarantine(user:string,id:string,reason:string){await this.owner(user);const r=await this.db.from('recipe_catalog_versions').update({status:'quarantined',reasons:[reason]}).eq('id',id);if(r.error)throw r.error;const e=await this.db.from('recipe_catalog_events').insert({version_id:id,actor_id:user,kind:'manual_quarantine',detail:{reason}});if(e.error)throw e.error;}
  async price(user:string,price:IngredientPrice){await this.owner(user);if(!/^https:\/\//.test(price.source)&&!/^receipt:/i.test(price.source))throw new Error('PRICE_SOURCE_REQUIRED');if(Date.parse(price.observedAt)>Date.now())throw new Error('PRICE_DATE_INVALID');const data={...price,ingredientKey:normalize(price.ingredientKey)};const r=await this.db.from('recipe_reference_prices').upsert({id:price.id,data,updated_at:new Date().toISOString()});if(r.error)throw r.error;}
  async report(user:string,id:string,safety:boolean,message:string){const r=await this.db.rpc('report_catalog_recipe',{p_user:user,p_version:id,p_safety:safety,p_message:message});if(r.error)throw r.error;const current=await this.get(id);if(current.status==='quarantined'){const queued=await this.db.rpc('request_catalog_revision',{p_version:id});if(queued.error&&!String(queued.error.message).includes('CATALOG_MONTH_LIMIT'))throw queued.error;}}
}
