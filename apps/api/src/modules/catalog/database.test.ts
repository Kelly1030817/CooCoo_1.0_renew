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
test('purchase replay is idempotent and does not change savings',async()=>{
 const id=crypto.randomUUID(),items=JSON.stringify([{ingredientKey:'油',name:'油',quantity:500,unit:'ml',estimatedCost:120}]);
 for(let i=0;i<2;i++)await db.query('select public.add_recipe_purchases($1,$2,$3)',[user,id,items]);
 expect((await db.query('select * from public.shopping_items')).rows).toHaveLength(1);expect((await db.query('select * from public.savings_events')).rows).toHaveLength(0);
});
test('pantry quantities are deducted once and repeated completion cannot deposit twice',async()=>{
 await db.query("insert into public.inventory_batches(user_id,name,ingredient_key,quantity,unit,location) values($1,'油','油',500,'ml','cold')",[user]);
 const op=crypto.randomUUID(),recipe=JSON.stringify({title:'test',prepTime:'10',steps:[],source:'catalog'}),requirements=JSON.stringify([{ingredientKey:'油',name:'油',quantity:5,unit:'ml',isPantryStaple:true}]);
 const args=[user,op,recipe,requirements];
 for(let i=0;i<2;i++)await db.query('select public.complete_cooking_transaction($1,$2,$3,$4,10,0,2,1,false)',args);
 expect(Number((await db.query<{quantity:number}>('select quantity from public.inventory_batches where ingredient_key=\'油\'')).rows[0].quantity)).toBe(490);
 expect((await db.query('select * from public.cooking_sessions')).rows).toHaveLength(1);
 expect((await db.query<{source:string}>('select source from public.recipes where title=\'test\'')).rows[0].source).toBe('catalog');
});
