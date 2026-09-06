-- Additive catalog schema. Private recipe snapshots remain private.
alter table public.profiles add column recipe_purchase_budget integer not null default 100 check(recipe_purchase_budget>=0), add column recipe_budget_confirmed boolean not null default false, add column recipe_settings_version integer not null default 0;
alter table public.recipes drop constraint recipes_source_check;
alter table public.recipes add constraint recipes_source_check check(source in ('gemini','brand_safe','catalog'));
create table public.recipe_catalog_versions (
 id uuid primary key default extensions.gen_random_uuid(), family_id uuid not null,
 recipe jsonb not null, status text not null default 'candidate' check(status in ('candidate','published','quarantined','rejected')),
 fingerprint text not null, reasons jsonb not null default '[]', created_at timestamptz not null default now(), published_at timestamptz
);
create unique index catalog_published_fingerprint on public.recipe_catalog_versions(fingerprint) where status='published';
alter table public.recipes add column catalog_version_id uuid references public.recipe_catalog_versions(id);
create table public.recipe_catalog_reviews (
 id uuid primary key default extensions.gen_random_uuid(), version_id uuid not null references public.recipe_catalog_versions(id),
 reviewer text not null, result jsonb not null, created_at timestamptz not null default now()
);
create unique index recipe_catalog_review_reviewer_idx on public.recipe_catalog_reviews(version_id,reviewer);
create table public.recipe_reference_prices (id uuid primary key default extensions.gen_random_uuid(), data jsonb not null, updated_at timestamptz not null default now());
create table public.recipe_catalog_demands (signature text primary key, context jsonb not null, hits integer not null default 1, updated_at timestamptz not null default now());
create table public.recipe_catalog_jobs (
 id uuid primary key default extensions.gen_random_uuid(), week_start date not null, slot integer not null,
 context jsonb not null, status text not null default 'queued' check(status in ('queued','running','deferred','completed','failed')),
 lease_token uuid, lease_until timestamptz, attempts integer not null default 0,
 version_id uuid references public.recipe_catalog_versions(id), error text, next_attempt_at timestamptz, created_at timestamptz not null default now(), unique(week_start,slot)
);
create table public.recipe_catalog_usage (
 id uuid primary key, job_id uuid references public.recipe_catalog_jobs(id), purpose text not null,
 reserved_twd numeric not null check(reserved_twd>=0), actual_twd numeric check(actual_twd>=0),
 rate jsonb not null, created_at timestamptz not null default now()
);
create table public.recipe_catalog_control (id boolean primary key default true check(id), paused boolean not null default true, last_run_at timestamptz);
insert into public.recipe_catalog_control(id) values(true);
create table public.recipe_catalog_events (id uuid primary key default extensions.gen_random_uuid(), version_id uuid references public.recipe_catalog_versions(id), actor_id uuid references auth.users(id) on delete set null, kind text not null, detail jsonb not null default '{}', created_at timestamptz not null default now());
create table public.recipe_catalog_reports (id uuid primary key default extensions.gen_random_uuid(), version_id uuid not null references public.recipe_catalog_versions(id), user_id uuid not null references auth.users(id) on delete cascade, safety boolean not null, message text not null, processed_at timestamptz, created_at timestamptz not null default now());
create unique index recipe_catalog_report_reporter_idx on public.recipe_catalog_reports(version_id,user_id,safety);

-- Content is immutable; status and review reasons are mutable and audited.
create function public.protect_catalog_recipe() returns trigger language plpgsql set search_path='' as $$ begin
 if new.recipe is distinct from old.recipe or new.family_id is distinct from old.family_id or new.fingerprint is distinct from old.fingerprint then raise exception 'CATALOG_VERSION_IMMUTABLE'; end if; return new; end $$;
create trigger catalog_immutable before update on public.recipe_catalog_versions for each row execute function public.protect_catalog_recipe();

do $$ declare n text; begin
 foreach n in array array['recipe_catalog_versions','recipe_catalog_reviews','recipe_reference_prices','recipe_catalog_demands','recipe_catalog_jobs','recipe_catalog_usage','recipe_catalog_control','recipe_catalog_events','recipe_catalog_reports'] loop
 execute format('alter table public.%I enable row level security',n);
 execute format('revoke all on public.%I from anon,authenticated',n);
 execute format('grant all on public.%I to service_role',n);
 end loop;
end $$;

create function public.save_recipe_preferences(p_user_id uuid,p_budget integer,p_expected integer)
returns jsonb language plpgsql security definer set search_path='' as $$ declare r record; begin
 update public.profiles set recipe_purchase_budget=p_budget,recipe_budget_confirmed=true,recipe_settings_version=recipe_settings_version+1 where user_id=p_user_id and recipe_settings_version=p_expected returning * into r;
 if not found then raise exception 'SETTINGS_CONFLICT'; end if;
 return jsonb_build_object('purchaseBudget',r.recipe_purchase_budget,'confirmed',r.recipe_budget_confirmed,'version',r.recipe_settings_version);
end $$;

create function public.record_recipe_demand(p_signature text,p_context jsonb) returns void language sql security definer set search_path='' as $$
 insert into public.recipe_catalog_demands(signature,context) values(p_signature,p_context) on conflict(signature) do update set hits=public.recipe_catalog_demands.hits+1,updated_at=now();
$$;

create function public.schedule_recipe_jobs(p_week date,p_contexts jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare c integer; i integer:=0; ctx jsonb; added integer:=0; count_added integer; begin
 perform pg_advisory_xact_lock(hashtext('recipe-catalog-budget'));
 if (select paused from public.recipe_catalog_control where id) then return 0; end if;
 select count(*) into c from public.recipe_catalog_jobs where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 for ctx in select value from jsonb_array_elements(p_contexts) limit 10 loop
  exit when c>=50;
  insert into public.recipe_catalog_jobs(week_start,slot,context) values(p_week,i,ctx) on conflict(week_start,slot) do nothing;
  get diagnostics count_added=row_count; added:=added+count_added;c:=c+count_added;i:=i+1;
 end loop; return added;
end $$;

create function public.claim_recipe_job() returns jsonb language plpgsql security definer set search_path='' as $$ declare j public.recipe_catalog_jobs; begin
 if (select paused from public.recipe_catalog_control where id) then return null; end if;
 update public.recipe_catalog_jobs set status='failed',error='RETRY_LIMIT' where status='running' and lease_until<now() and attempts>=3;
 select * into j from public.recipe_catalog_jobs where (status='queued' or (status='deferred' and next_attempt_at<=now()) or (status='running' and lease_until<now())) and attempts<3 order by created_at,slot for update skip locked limit 1;
 if not found then return null; end if;
 update public.recipe_catalog_jobs set status='running',attempts=attempts+1,lease_token=extensions.gen_random_uuid(),lease_until=now()+interval '20 minutes',next_attempt_at=null where id=j.id returning * into j;
 return to_jsonb(j);
end $$;

create function public.reserve_recipe_usage(p_id uuid,p_job uuid,p_lease uuid,p_purpose text,p_max numeric,p_rate jsonb) returns void language plpgsql security definer set search_path='' as $$ declare used numeric; begin
 perform pg_advisory_xact_lock(hashtext('recipe-catalog-budget'));
 if p_max<=0 or (select paused from public.recipe_catalog_control where id) then raise exception 'CATALOG_PAUSED';end if;
 if not exists(select 1 from public.recipe_catalog_jobs where id=p_job and lease_token=p_lease and lease_until>now() and status='running') then raise exception 'JOB_LEASE_LOST';end if;
 select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into used from public.recipe_catalog_usage where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 if used+p_max>300 then raise exception 'CATALOG_BUDGET_EXHAUSTED';end if;
 insert into public.recipe_catalog_usage(id,job_id,purpose,reserved_twd,rate) values(p_id,p_job,p_purpose,p_max,p_rate);
end $$;

create function public.publish_catalog_version(p_version uuid,p_job uuid,p_lease uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 perform pg_advisory_xact_lock(hashtext('recipe-catalog-publish'));
 if (select paused from public.recipe_catalog_control where id) then raise exception 'CATALOG_PAUSED';end if;
 if not exists(select 1 from public.recipe_catalog_jobs where id=p_job and lease_token=p_lease and status='running' and lease_until>now()) then raise exception 'JOB_LEASE_LOST';end if;
 if not exists(select 1 from public.recipe_catalog_reviews where version_id=p_version and reviewer='rules' and result->>'pass'='true') or not exists(select 1 from public.recipe_catalog_reviews where version_id=p_version and reviewer='quality' and result->>'pass'='true') or not exists(select 1 from public.recipe_catalog_reviews where version_id=p_version and reviewer='safety' and result->>'pass'='true') then raise exception 'REVIEW_REQUIRED';end if;
 update public.recipe_catalog_versions set status='published',published_at=now() where id=p_version and status='candidate';
 if not found then raise exception 'CATALOG_NOT_CANDIDATE';end if;
 update public.recipe_catalog_jobs set status='completed',version_id=p_version,lease_until=null where id=p_job;
 insert into public.recipe_catalog_events(version_id,kind) values(p_version,'published');
end $$;

create function public.report_catalog_recipe(p_user uuid,p_version uuid,p_safety boolean,p_message text) returns void language plpgsql security definer set search_path='' as $$ declare report_count integer; report_id uuid; v public.recipe_catalog_versions; c integer; begin
 if not exists(select 1 from public.recipe_catalog_versions where id=p_version and status in ('published','quarantined')) then raise exception 'RECIPE_PACKAGE_NOT_FOUND';end if;
 insert into public.recipe_catalog_reports(version_id,user_id,safety,message) values(p_version,p_user,p_safety,p_message)
 on conflict(version_id,user_id,safety) do update set message=excluded.message,created_at=now(),processed_at=null returning id into report_id;
 if p_safety then
 update public.recipe_catalog_versions set status='quarantined',reasons='["食安回報，等待重審"]' where id=p_version;
 insert into public.recipe_catalog_events(version_id,actor_id,kind) values(p_version,p_user,'safety_quarantine');
 update public.recipe_catalog_reports set processed_at=now() where id=report_id;
 else
 select count(distinct user_id) into report_count from public.recipe_catalog_reports where version_id=p_version and not safety and created_at>=now()-interval '30 days';
 if report_count>=3 then
   perform pg_advisory_xact_lock(hashtext('recipe-catalog-budget'));
   update public.recipe_catalog_versions set status='quarantined',reasons='["30 天內三位使用者回報，等待重審"]' where id=p_version and status='published' returning * into v;
   if found then
     insert into public.recipe_catalog_events(version_id,actor_id,kind,detail) values(p_version,p_user,'quality_threshold_quarantine',jsonb_build_object('uniqueReporters',report_count));
     select count(*) into c from public.recipe_catalog_jobs where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
     if c<50 then insert into public.recipe_catalog_jobs(week_start,slot,context) values((now() at time zone 'Asia/Taipei')::date,-1-c,jsonb_build_object('revisionOf',p_version,'revision',v.recipe,'familyId',v.family_id,'issues',v.reasons,'cookware',v.recipe->'cookwareTypes')); end if;
   end if;
   update public.recipe_catalog_reports set processed_at=now() where version_id=p_version and not safety and processed_at is null;
 end if;
 end if;
end $$;

-- One transaction for selecting a recipe and adding its missing purchases.
create table public.recipe_purchase_operations (user_id uuid not null references auth.users(id) on delete cascade, operation_id uuid not null, created_at timestamptz not null default now(), primary key(user_id,operation_id));
alter table public.recipe_purchase_operations enable row level security;
revoke all on public.recipe_purchase_operations from anon,authenticated;
grant all on public.recipe_purchase_operations to service_role;
create function public.add_recipe_purchases(p_user uuid,p_operation uuid,p_items jsonb) returns void language plpgsql security definer set search_path='' as $$ declare item jsonb; begin
 insert into public.recipe_purchase_operations values(p_user,p_operation,now()) on conflict do nothing;
 if not found then return;end if;
 for item in select * from jsonb_array_elements(p_items) loop
 insert into public.shopping_items(user_id,ingredient_key,name,quantity,unit,category,estimated_cost,status)
 values(p_user,item->>'ingredientKey',item->>'name',(item->>'quantity')::numeric,item->>'unit','other',coalesce((item->>'estimatedCost')::integer,0),'recipe_purchase');
 end loop;
end $$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('save_recipe_preferences','record_recipe_demand','schedule_recipe_jobs','claim_recipe_job','reserve_recipe_usage','publish_catalog_version','report_catalog_recipe','add_recipe_purchases') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;

create or replace function public.replace_meal_plan(p_user_id uuid, p_plan jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  plan_id uuid;
  meal jsonb;
  package jsonb;
begin
  insert into public.meal_plans(user_id,week_start,overlap_rate,inventory_coverage_rate,updated_at)
  values(p_user_id,(p_plan->>'weekStart')::date,(p_plan->>'overlapRate')::numeric,(p_plan->>'inventoryCoverageRate')::numeric,now())
  on conflict(user_id,week_start) do nothing
  returning id into plan_id;
  if plan_id is null then
    select id into plan_id from public.meal_plans where user_id=p_user_id and week_start=(p_plan->>'weekStart')::date;
    return plan_id;
  end if;

  for meal in select * from jsonb_array_elements(p_plan->'meals') loop
    package := null;
    select item into package from jsonb_array_elements(p_plan->'packages') as items(item) where item->>'recipeId'=meal->>'recipeId' limit 1;
    if package is null then raise exception 'RECIPE_PACKAGE_REQUIRED'; end if;
    insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,estimated_cost,cookware_types,ingredients,steps,image_path,fallback_image_url,safety_reviewed,source,catalog_version_id)
    values((meal->>'recipeId')::uuid,p_user_id,package->>'title',(package->>'servings')::smallint,(package->>'prepMinutes')::smallint,
      (package->>'totalMinutes')::smallint,(package->>'estimatedCost')::integer,array(select jsonb_array_elements_text(package->'cookwareTypes')),
      package->'ingredients',package->'steps',nullif(package->>'imageUrl',''),coalesce(nullif(package->>'fallbackImageUrl',''),'/favicon.svg'),coalesce(package->>'source',case when package->>'catalogVersionId' is null then 'brand_safe' else 'catalog' end)<>'gemini',coalesce(package->>'source',case when package->>'catalogVersionId' is null then 'brand_safe' else 'catalog' end),nullif(package->>'catalogVersionId','')::uuid);
    insert into public.planned_meals(id,user_id,meal_plan_id,recipe_id,planned_date,meal_slot,status,servings,estimated_cost,energy_level)
    values((meal->>'id')::uuid,p_user_id,plan_id,(meal->>'recipeId')::uuid,(meal->>'date')::date,meal->>'slot',meal->>'status',
      (meal->>'servings')::smallint,(meal->>'estimatedCost')::integer,meal->>'energyLevel');
  end loop;
  return plan_id;
end $$;
revoke all on function public.replace_meal_plan(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.replace_meal_plan(uuid,jsonb) to service_role;


-- Requirements passed to completion are per serving, including pantry ingredients.
create or replace function public.complete_cooking_transaction(
  p_user_id uuid, p_operation_id uuid, p_recipe jsonb, p_requirements jsonb,
  p_home_cook_cost integer, p_confirmed_savings integer, p_servings_cooked integer,
  p_servings_eaten integer, p_vegetables boolean
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare session_id uuid := extensions.gen_random_uuid(); recipe_id uuid := extensions.gen_random_uuid();
declare requirement jsonb; batch record; needed numeric; take_qty numeric; has_conflict boolean := false; factor numeric; batch_factor numeric; required_unit text;
declare outside_price integer; active_goal uuid; serving_index integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text || p_operation_id::text));
  if p_home_cook_cost<0 or p_confirmed_savings<0 or p_servings_cooked<1 then raise exception 'INVALID_COOKING_AMOUNT';end if;
  if p_servings_eaten < 0 or p_servings_eaten > p_servings_cooked then raise exception 'INVALID_SERVING_COUNT'; end if;
  if exists(select 1 from public.cooking_sessions where user_id=p_user_id and operation_id=p_operation_id) then
    return jsonb_build_object('accepted',false,'reason','duplicate');
  end if;
  select outside_meal_price into outside_price from public.profiles where user_id=p_user_id;
  if outside_price is null then raise exception 'ONBOARDING_REQUIRED'; end if;
  if p_confirmed_savings > greatest(0,outside_price*p_servings_eaten-p_home_cook_cost) then raise exception 'SAVINGS_EXCEEDS_CALCULATED_AMOUNT'; end if;
  insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,cookware_types,ingredients,steps,safety_reviewed,source,catalog_version_id)
  values(recipe_id,p_user_id,p_recipe->>'title',1,0,greatest(1,coalesce(nullif(regexp_replace(p_recipe->>'prepTime','[^0-9]','','g'),'')::integer,30)),
    '{}',coalesce(p_requirements,'[]'::jsonb),coalesce(p_recipe->'steps','[]'::jsonb),coalesce(p_recipe->>'source',case when p_recipe->>'catalogVersionId' is null then 'brand_safe' else 'catalog' end)<>'gemini',coalesce(p_recipe->>'source',case when p_recipe->>'catalogVersionId' is null then 'brand_safe' else 'catalog' end),(select id from public.recipe_catalog_versions where id::text=p_recipe->>'catalogVersionId'))
  ;
  insert into public.cooking_sessions(id,user_id,operation_id,recipe_id,status,servings_cooked,current_step,started_at,completed_at)
  values(session_id,p_user_id,p_operation_id,recipe_id,'completed',p_servings_cooked,999,now(),now());
  for requirement in select * from jsonb_array_elements(coalesce(p_requirements,'[]'::jsonb))
  loop
    factor:=case lower(requirement->>'unit') when 'kg' then 1000 when '公斤' then 1000 when 'l' then 1000 when '公升' then 1000 else 1 end;
    required_unit:=case lower(requirement->>'unit') when 'kg' then 'g' when '公斤' then 'g' when '克' then 'g' when '公克' then 'g' when 'l' then 'ml' when '公升' then 'ml' when '毫升' then 'ml' when '個' then '顆' else lower(requirement->>'unit') end;
    needed := (requirement->>'quantity')::numeric * p_servings_cooked * factor;
    if needed<=0 then raise exception 'INVALID_REQUIREMENT';end if;
    for batch in select id,quantity,unit from public.inventory_batches
      where user_id=p_user_id and (ingredient_key=lower(requirement->>'ingredientKey') or lower(name)=lower(requirement->>'name')) and quantity>0 and (expires_on is null or expires_on >= (now() at time zone 'Asia/Taipei')::date)
      and (case lower(unit) when 'kg' then 'g' when '公斤' then 'g' when '克' then 'g' when '公克' then 'g' when 'l' then 'ml' when '公升' then 'ml' when '毫升' then 'ml' when '個' then '顆' else lower(unit) end)=required_unit
      order by expires_on nulls last,id for update
    loop
      exit when needed<=0;
      batch_factor:=case lower(batch.unit) when 'kg' then 1000 when '公斤' then 1000 when 'l' then 1000 when '公升' then 1000 else 1 end;
      take_qty := least(needed,batch.quantity*batch_factor);
      update public.inventory_batches set quantity=quantity-take_qty/batch_factor,version=version+1,updated_at=now() where id=batch.id;
      needed := needed-take_qty;
    end loop;
    if needed>0 then has_conflict:=true; end if;
  end loop;
  for serving_index in 1..p_servings_cooked loop
    insert into public.meal_servings(user_id,cooking_session_id,status,vegetable_keys,eaten_at)
    values(p_user_id,session_id,case when serving_index<=p_servings_eaten then 'eaten' else 'prepared_inventory' end,
      case when p_vegetables and serving_index<=p_servings_eaten then array['reported-vegetable'] else '{}' end,
      case when serving_index<=p_servings_eaten then now() else null end);
  end loop;
  select id into active_goal from public.goals where user_id=p_user_id and status='active' order by created_at limit 1;
  if p_confirmed_savings>0 then
    insert into public.savings_events(user_id,goal_id,cooking_session_id,outside_meal_price,actual_ingredient_cost,confirmed_amount)
    values(p_user_id,active_goal,session_id,outside_price,p_home_cook_cost,p_confirmed_savings);
  end if;
  insert into public.offline_operations(id,user_id,kind,payload,status,synced_at)
  values(p_operation_id,p_user_id,'cooking_complete',jsonb_build_object('sessionId',session_id),(case when has_conflict then 'conflict' else 'synced' end)::public.operation_status,now());
  if has_conflict then
    insert into public.sync_conflicts(user_id,operation_id,kind,message) values(p_user_id,p_operation_id,'inventory_shortage','料理已保留，但另一裝置的庫存不足；未產生負庫存，請確認實際用量。');
  end if;
  return jsonb_build_object('accepted',true,'sessionId',session_id,'hasConflict',has_conflict);
end;
$$;
revoke all on function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) from public,anon,authenticated;
grant execute on function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) to service_role;


create function public.request_catalog_revision(p_version uuid) returns void language plpgsql security definer set search_path='' as $$ declare v public.recipe_catalog_versions; c integer; begin
 perform pg_advisory_xact_lock(hashtext('recipe-catalog-budget'));
 select * into v from public.recipe_catalog_versions where id=p_version;
 if not found then raise exception 'RECIPE_PACKAGE_NOT_FOUND';end if;
 if exists(select 1 from public.recipe_catalog_jobs where status in ('queued','running','deferred') and context->>'revisionOf'=p_version::text) then return;end if;
 select count(*) into c from public.recipe_catalog_jobs where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 if c>=50 then raise exception 'CATALOG_MONTH_LIMIT';end if;
 insert into public.recipe_catalog_jobs(week_start,slot,context) values((now() at time zone 'Asia/Taipei')::date,-1-c,jsonb_build_object('revisionOf',p_version,'revision',v.recipe,'familyId',v.family_id,'issues',v.reasons,'cookware',v.recipe->'cookwareTypes'));
end $$;
revoke all on function public.request_catalog_revision(uuid) from public,anon,authenticated;
grant execute on function public.request_catalog_revision(uuid) to service_role;

-- Keep privileged implementations outside the exposed API schema. Public wrappers run
-- with the service-role caller's privileges and are not executable by browser roles.
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to service_role;

alter function public.protect_catalog_recipe() set schema private;
alter function public.save_recipe_preferences(uuid,integer,integer) set schema private;
alter function public.record_recipe_demand(text,jsonb) set schema private;
alter function public.schedule_recipe_jobs(date,jsonb) set schema private;
alter function public.claim_recipe_job() set schema private;
alter function public.reserve_recipe_usage(uuid,uuid,uuid,text,numeric,jsonb) set schema private;
alter function public.publish_catalog_version(uuid,uuid,uuid) set schema private;
alter function public.report_catalog_recipe(uuid,uuid,boolean,text) set schema private;
alter function public.add_recipe_purchases(uuid,uuid,jsonb) set schema private;
alter function public.replace_meal_plan(uuid,jsonb) set schema private;
alter function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) set schema private;
alter function public.request_catalog_revision(uuid) set schema private;

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on all functions in schema private to service_role;

create function public.save_recipe_preferences(uuid,integer,integer) returns jsonb language sql security invoker set search_path='' as $$ select private.save_recipe_preferences($1,$2,$3) $$;
create function public.record_recipe_demand(text,jsonb) returns void language sql security invoker set search_path='' as $$ select private.record_recipe_demand($1,$2) $$;
create function public.schedule_recipe_jobs(date,jsonb) returns integer language sql security invoker set search_path='' as $$ select private.schedule_recipe_jobs($1,$2) $$;
create function public.claim_recipe_job() returns jsonb language sql security invoker set search_path='' as $$ select private.claim_recipe_job() $$;
create function public.reserve_recipe_usage(uuid,uuid,uuid,text,numeric,jsonb) returns void language sql security invoker set search_path='' as $$ select private.reserve_recipe_usage($1,$2,$3,$4,$5,$6) $$;
create function public.publish_catalog_version(uuid,uuid,uuid) returns void language sql security invoker set search_path='' as $$ select private.publish_catalog_version($1,$2,$3) $$;
create function public.report_catalog_recipe(uuid,uuid,boolean,text) returns void language sql security invoker set search_path='' as $$ select private.report_catalog_recipe($1,$2,$3,$4) $$;
create function public.add_recipe_purchases(uuid,uuid,jsonb) returns void language sql security invoker set search_path='' as $$ select private.add_recipe_purchases($1,$2,$3) $$;
create function public.replace_meal_plan(uuid,jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.replace_meal_plan($1,$2) $$;
create function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.complete_cooking_transaction($1,$2,$3,$4,$5,$6,$7,$8,$9) $$;
create function public.request_catalog_revision(uuid) returns void language sql security invoker set search_path='' as $$ select private.request_catalog_revision($1) $$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('save_recipe_preferences','record_recipe_demand','schedule_recipe_jobs','claim_recipe_job','reserve_recipe_usage','publish_catalog_version','report_catalog_recipe','add_recipe_purchases','replace_meal_plan','complete_cooking_transaction','request_catalog_revision') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
