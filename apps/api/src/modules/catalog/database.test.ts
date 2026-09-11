import { beforeAll,afterAll,expect,test } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { readdir,readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const db=new PGlite();const user='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';const job='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';const lease='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create role supabase_auth_admin;create schema auth;create schema extensions;create schema storage;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function extensions.gen_random_uuid() returns uuid language sql as $$select gen_random_uuid()$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,name text,bucket_id text);create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;grant usage on schema public,auth to authenticated,service_role;`);
 const dir=resolve(import.meta.dir,'../../../../../supabase/migrations');
 for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()){const sql=(await readFile(resolve(dir,name),'utf8')).replace('create extension if not exists pgcrypto with schema extensions;','');await db.exec(sql);}
 await db.exec(`insert into auth.users(id) values('${user}');insert into public.profiles(user_id,outside_meal_price) values('${user}',150);update public.recipe_catalog_control set paused=false;insert into public.recipe_catalog_jobs(id,week_start,slot,context,status,lease_token,lease_until) values('${job}',current_date,99,'{}','running','${lease}',now()+interval '1 hour');`);
},30000);
afterAll(async()=>{await db.close();});
test('all migrations apply, preferences are optimistic, and another account cannot edit them directly',async()=>{
 const r=await db.query<{value:{version:number}}>('select public.save_recipe_preferences($1,150,0) as value',[user]);expect(r.rows[0].value.version).toBe(1);
 await expect(db.query('select public.save_recipe_preferences($1,99,0)',[user])).rejects.toThrow('SETTINGS_CONFLICT');
 await db.exec(`set role authenticated;set request.jwt.claim.sub='dddddddd-dddd-4ddd-8ddd-dddddddddddd';`);
 try{const rows=await db.query('select * from public.profiles');expect(rows.rows).toHaveLength(0);await expect(db.query('select * from public.recipe_catalog_usage')).rejects.toThrow();await expect(db.query('select public.save_recipe_preferences($1,10,1)',[user])).rejects.toThrow();}finally{await db.exec('reset role');}
});
test('privileged implementations are private and browser roles cannot execute public wrappers',async()=>{
 const functions=await db.query<{nspname:string;prosecdef:boolean}>("select n.nspname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='save_recipe_preferences' order by n.nspname");
 expect(functions.rows).toEqual([{nspname:'private',prosecdef:true},{nspname:'public',prosecdef:false}]);
 const rpcArgs=await db.query<{name:string;args:string}>("select p.proname name,pg_get_function_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('schedule_recipe_jobs','reserve_recipe_usage','publish_catalog_version') order by p.proname");
 expect(rpcArgs.rows.every(row=>row.args.includes('p_'))).toBe(true);
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${user}';`);
 try{await expect(db.query('select * from public.ai_operations')).rejects.toThrow();await expect(db.query('select public.reserve_ai_operation($1,$2,$3,$4,$5,1)',[user,crypto.randomUUID(),'shopping_analysis','hash','model'])).rejects.toThrow();}finally{await db.exec('reset role');}
});
test('interactive AI operations are idempotent and enforce per-feature daily limits',async()=>{
 const operation=crypto.randomUUID();
 expect((await db.query<{value:{status:string}}>('select public.reserve_ai_operation($1,$2,$3,$4,$5,1) value',[user,operation,'shopping_analysis','same-input','model'])).rows[0].value.status).toBe('reserved');
 await db.query("select public.settle_ai_operation($1,$2,'completed',0.1,$3)",[user,operation,'{"source":"rules"}']);
 const replay=await db.query<{value:{status:string;result:{source:string}}}>('select public.reserve_ai_operation($1,$2,$3,$4,$5,1) value',[user,operation,'shopping_analysis','same-input','model']);
 expect(replay.rows[0].value).toEqual({status:'completed',result:{source:'rules'}});
 await expect(db.query('select public.reserve_ai_operation($1,$2,$3,$4,$5,1)',[user,operation,'shopping_analysis','changed-input','model'])).rejects.toThrow('AI_OPERATION_CONFLICT');
 await db.exec('update public.recipe_catalog_control set shopping_daily_user_limit=1');
 await expect(db.query('select public.reserve_ai_operation($1,$2,$3,$4,$5,1)',[user,crypto.randomUUID(),'shopping_analysis','new-input','model'])).rejects.toThrow('AI_DAILY_LIMITED');
 await db.exec('delete from public.ai_operations;update public.recipe_catalog_control set shopping_daily_user_limit=5');
});
test('catalog and interactive calls share one atomic monthly ceiling',async()=>{
 const operation=crypto.randomUUID();
 await db.exec('update public.recipe_catalog_control set global_monthly_budget_twd=1');
 await db.query('select public.reserve_ai_operation($1,$2,$3,$4,$5,.6)',[user,operation,'receipt_ocr','receipt','model']);
 await db.query("select public.settle_ai_operation($1,$2,'completed',.6,'{}')",[user,operation]);
 await expect(db.query('select public.reserve_recipe_usage($1,$2,$3,$4,.5,$5)',[crypto.randomUUID(),job,lease,'test','{}'])).rejects.toThrow('AI_BUDGET_EXHAUSTED');
 await db.exec('delete from public.ai_operations;update public.recipe_catalog_control set global_monthly_budget_twd=150');
});
test('generated recipe sources can never be marked as independently safety reviewed',async()=>{
 const id=crypto.randomUUID();
 await db.query("insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,cookware_types,ingredients,steps,safety_reviewed,source) values($1,$2,'AI test',1,1,1,'{}','[]','[]',true,'openrouter')",[id,user]);
 expect((await db.query<{safety_reviewed:boolean}>('select safety_reviewed from public.recipes where id=$1',[id])).rows[0].safety_reviewed).toBe(false);
});
test('catalog budget reservation is atomic and stops at the NT$50 operating cap',async()=>{
 await db.query('select public.reserve_recipe_usage($1,$2,$3,$4,49,$5)',[crypto.randomUUID(),job,lease,'test','{}']);
 await expect(db.query('select public.reserve_recipe_usage($1,$2,$3,$4,2,$5)',[crypto.randomUUID(),job,lease,'test','{}'])).rejects.toThrow('CATALOG_BUDGET_EXHAUSTED');
});
test('published content requires three passes, remains immutable and safety reports quarantine it',async()=>{
 const id=crypto.randomUUID();await db.query("insert into public.recipe_catalog_versions(id,family_id,recipe,fingerprint) values($1,$1,'{}','unique')",[id]);
 await expect(db.query('select public.publish_catalog_version($1,$2,$3)',[id,job,lease])).rejects.toThrow('REVIEW_REQUIRED');
 for(const reviewer of ['rules','quality','safety'])await db.query(`insert into public.recipe_catalog_reviews(version_id,reviewer,result) values($1,$2,'{"pass":true}')`,[id,reviewer]);
 await db.query('select public.publish_catalog_version($1,$2,$3)',[id,job,lease]);
 expect((await db.query<{status:string;error:string|null}>('select status,error from public.recipe_catalog_jobs where id=$1',[job])).rows[0]).toEqual({status:'completed',error:null});
 await expect(db.query(`update public.recipe_catalog_versions set recipe='{"title":"changed"}' where id=$1`,[id])).rejects.toThrow('CATALOG_VERSION_IMMUTABLE');
 await db.query('select public.report_catalog_recipe($1,$2,true,$3)',[user,id,'safety report']);
 expect((await db.query<{status:string}>('select status from public.recipe_catalog_versions where id=$1',[id])).rows[0].status).toBe('quarantined');
});
test('three distinct quality reporters in 30 days quarantine and queue one revision',async()=>{
 const users=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()];for(const id of users)await db.query('insert into auth.users(id) values($1)',[id]);
 const id=crypto.randomUUID();await db.query("insert into public.recipe_catalog_versions(id,family_id,recipe,fingerprint,status,published_at) values($1,$1,'{}',$2,'published',now())",[id,'quality-'+id]);
 for(let index=0;index<users.length;index++){await db.query('select public.report_catalog_recipe($1,$2,false,$3)',[users[index],id,'quality '+index]);const status=(await db.query<{status:string}>('select status from public.recipe_catalog_versions where id=$1',[id])).rows[0].status;expect(status).toBe(index<2?'published':'quarantined');}
 expect((await db.query("select * from public.recipe_catalog_jobs where context->>'revisionOf'=$1",[id])).rows).toHaveLength(1);
 expect((await db.query('select * from public.recipe_catalog_reports where version_id=$1 and processed_at is not null',[id])).rows).toHaveLength(3);
});
test('purchase replay is idempotent and does not award EXP',async()=>{
 const id=crypto.randomUUID(),items=JSON.stringify([{ingredientKey:'油',name:'油',quantity:500,unit:'ml',estimatedCost:120}]);
 for(let i=0;i<2;i++)await db.query('select public.add_recipe_purchases($1,$2,$3)',[user,id,items]);
 expect((await db.query('select * from public.shopping_items')).rows).toHaveLength(1);expect((await db.query('select * from public.exp_events')).rows).toHaveLength(0);
});
test('inventory quantities and EXP are changed once by cooking replay',async()=>{
 await db.query("insert into public.inventory_batches(user_id,name,ingredient_key,quantity,unit,location) values($1,'油','油',500,'ml','cold')",[user]);
 await db.query("insert into public.weekly_goals_v2(user_id,week_start,metric,target) values($1,date_trunc('week',timezone('Asia/Taipei',now()))::date,'cooking_sessions',1)",[user]);
 const op=crypto.randomUUID(),recipe=JSON.stringify({title:'test',prepTime:'10',steps:[],source:'catalog'}),requirements=JSON.stringify([{ingredientKey:'油',name:'油',quantity:5,unit:'ml',isPantryStaple:false}]);
 const args=[user,op,recipe,requirements];
 for(let i=0;i<2;i++)await db.query('select public.complete_cooking_v2_transaction($1,$2,$3,$4,10,150,true,2,1,false,false,true,null)',args);
 expect(Number((await db.query<{quantity:number}>('select quantity from public.inventory_batches where ingredient_key=\'油\'')).rows[0].quantity)).toBe(490);
 expect((await db.query('select * from public.cooking_sessions')).rows).toHaveLength(1);
 expect((await db.query('select * from public.exp_events')).rows).toHaveLength(3);
 expect((await db.query('select * from public.cooking_cost_records')).rows).toHaveLength(1);
 expect((await db.query<{source:string}>('select source from public.recipes where title=\'test\'')).rows[0].source).toBe('brand_safe');
});
test('partial restocking keeps a MealTask open; full restocking and cooking close it',async()=>{
 const recipeId=crypto.randomUUID(),taskId=crypto.randomUUID(),taskOperation=crypto.randomUUID(),shoppingId=crypto.randomUUID();
 await db.query("insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,cookware_types,ingredients,steps,safety_reviewed,source) values($1,$2,'MealTask flow',1,5,10,'{}','[]','[]',true,'brand_safe')",[recipeId,user]);
 await db.query("insert into public.meal_tasks(id,user_id,operation_id,recipe_id,status,current_meal,next_meal,planned_total_servings,shortages) values($1,$2,$3,$4,'needs_shopping',$5,$6,1,$7)",[taskId,user,taskOperation,recipeId,JSON.stringify({date:'2026-09-11',slot:'dinner',servings:1}),JSON.stringify({strategy:'skip'}),JSON.stringify([{id:crypto.randomUUID(),ingredientKey:'蛋',name:'雞蛋',quantity:2,unit:'顆',resolution:'needed'}])]);
 await db.query("insert into public.shopping_items(id,user_id,name,ingredient_key,quantity,unit,category,estimated_cost,checked) values($1,$2,'雞蛋','蛋',1,'顆','protein',15,true)",[shoppingId,user]);
 expect(Number((await db.query<{value:number}>('select public.restock_checked_shopping($1) value',[user])).rows[0].value)).toBe(1);
 expect((await db.query<{status:string;shortages:Array<{quantity:number;resolution:string}>}>('select status,shortages from public.meal_tasks where id=$1',[taskId])).rows[0]).toMatchObject({status:'needs_shopping',shortages:[{quantity:1,resolution:'needed'}]});
 await db.query("insert into public.shopping_items(user_id,name,ingredient_key,quantity,unit,category,estimated_cost,checked) values($1,'雞蛋','蛋',1,'顆','protein',15,true)",[user]);
 expect(Number((await db.query<{value:number}>('select public.restock_checked_shopping($1) value',[user])).rows[0].value)).toBe(1);
 expect((await db.query<{status:string}>('select status from public.meal_tasks where id=$1',[taskId])).rows[0].status).toBe('ready');
 const completion=crypto.randomUUID();
 await db.query("select public.complete_cooking_v2_transaction($1,$2,$3,'[]',0,null,false,1,1,false,false,false,$4)",[user,completion,JSON.stringify({title:'MealTask flow',prepTime:'10',steps:[],source:'brand_safe'}),taskId]);
 expect((await db.query<{status:string}>('select status from public.meal_tasks where id=$1',[taskId])).rows[0].status).toBe('complete');
});
test('save_onboarding_profile creates and updates a weekly habit goal without money goals',async()=>{
 const testUser=crypto.randomUUID();await db.query('insert into auth.users(id) values($1)',[testUser]);
 await db.query("insert into public.inventory_batches(user_id,name,ingredient_key,quantity,unit,location) values($1,'測試食材','test',1,'份','cold')",[testUser]);
 const initialProfile=JSON.stringify({householdServings:2,weeklyGoalTarget:4,status:'complete',currentStep:5,plannedMealSlots:['dinner'],preferredFlavors:['清淡'],cookware:[],restrictions:[],cookingExperience:'beginner',currentWeeklyCookingFrequency:3,habitBarriers:['no_ideas'],guidanceMode:'detailed',availableMinutes:30,primaryGoalMetric:'cooking_sessions',inventoryReviewed:true,hasNoInventory:true,reminders:{}});
 await db.query('select public.save_onboarding_profile($1,$2)',[testUser,initialProfile]);
 let goal=(await db.query<{metric:string;target:number}>("select metric,target from public.weekly_goals_v2 where user_id=$1",[testUser])).rows[0];
 expect(goal).toEqual({metric:'cooking_sessions',target:4});
 expect((await db.query('select * from public.inventory_batches where user_id=$1',[testUser])).rows).toHaveLength(0);
 const replayedProfile=JSON.stringify({...JSON.parse(initialProfile),weeklyGoalTarget:5,primaryGoalMetric:'self_cooked_servings'});
 await db.query('select public.save_onboarding_profile($1,$2)',[testUser,replayedProfile]);
 goal=(await db.query<{metric:string;target:number}>("select metric,target from public.weekly_goals_v2 where user_id=$1",[testUser])).rows[0];
 expect(goal).toEqual({metric:'self_cooked_servings',target:5});
 expect((await db.query("select to_regclass('public.goals') value")).rows[0]).toEqual({value:null});
});
