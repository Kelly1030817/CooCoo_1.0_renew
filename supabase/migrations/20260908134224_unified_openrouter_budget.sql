-- One finite OpenRouter balance is shared by interactive AI and the catalog worker.
alter table public.recipe_catalog_control
  add column if not exists recipe_generation_monthly_budget_twd numeric not null default 30 check(recipe_generation_monthly_budget_twd>=0),
  add column if not exists receipt_ocr_monthly_budget_twd numeric not null default 30 check(receipt_ocr_monthly_budget_twd>=0),
  add column if not exists recipe_generation_daily_user_limit integer not null default 3 check(recipe_generation_daily_user_limit between 0 and 100),
  add column if not exists receipt_ocr_daily_user_limit integer not null default 3 check(receipt_ocr_daily_user_limit between 0 and 100);

update public.recipe_catalog_control
set shopping_monthly_budget_twd=40, shopping_daily_user_limit=5, global_monthly_budget_twd=150
where id;

create table public.ai_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  feature text not null check(feature in ('shopping_analysis','recipe_generation','receipt_ocr')),
  input_hash text not null,
  status text not null check(status in ('reserved','completed','failed')),
  model text not null,
  reserved_twd numeric not null check(reserved_twd>=0),
  actual_twd numeric check(actual_twd>=0),
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key(user_id,operation_id)
);
create index ai_operations_month_feature_idx on public.ai_operations(created_at,feature);
create index ai_operations_user_day_feature_idx on public.ai_operations(user_id,feature,created_at);
alter table public.ai_operations enable row level security;
revoke all on public.ai_operations from public,anon,authenticated;
grant all on public.ai_operations to service_role;

insert into public.ai_operations(user_id,operation_id,feature,input_hash,status,model,reserved_twd,actual_twd,result,created_at,completed_at)
select user_id,operation_id,'shopping_analysis',input_hash,status,model,reserved_twd,actual_twd,result,created_at,
       case when status='reserved' then null else created_at end
from public.shopping_ai_operations
on conflict(user_id,operation_id) do nothing;

create or replace function private.reserve_ai_operation(p_user uuid,p_operation uuid,p_feature text,p_hash text,p_model text,p_max numeric)
returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.ai_operations; limits public.recipe_catalog_control; daily_count integer; feature_used numeric; interactive_used numeric; catalog_used numeric; feature_budget numeric; daily_limit integer; month_start timestamptz; day_start timestamptz;
begin
  if p_feature not in ('shopping_analysis','recipe_generation','receipt_ocr') or p_max<=0 then raise exception 'AI_OPERATION_INVALID'; end if;
  perform pg_advisory_xact_lock(hashtext('coocoo-openrouter-budget'));
  select * into existing from public.ai_operations where user_id=p_user and operation_id=p_operation;
  if found then
    if existing.input_hash<>p_hash or existing.feature<>p_feature then raise exception 'AI_OPERATION_CONFLICT'; end if;
    if existing.status='reserved' then raise exception 'AI_OPERATION_IN_PROGRESS'; end if;
    return jsonb_build_object('status',existing.status,'result',existing.result);
  end if;
  select * into limits from public.recipe_catalog_control where id;
  month_start:=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
  day_start:=date_trunc('day',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
  feature_budget:=case p_feature when 'shopping_analysis' then limits.shopping_monthly_budget_twd when 'recipe_generation' then limits.recipe_generation_monthly_budget_twd else limits.receipt_ocr_monthly_budget_twd end;
  daily_limit:=case p_feature when 'shopping_analysis' then limits.shopping_daily_user_limit when 'recipe_generation' then limits.recipe_generation_daily_user_limit else limits.receipt_ocr_daily_user_limit end;
  select count(*) into daily_count from public.ai_operations where user_id=p_user and feature=p_feature and created_at>=day_start;
  if daily_count>=daily_limit then raise exception 'AI_DAILY_LIMITED'; end if;
  select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into feature_used from public.ai_operations where feature=p_feature and created_at>=month_start;
  select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into interactive_used from public.ai_operations where created_at>=month_start;
  select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into catalog_used from public.recipe_catalog_usage where created_at>=month_start;
  if feature_used+p_max>feature_budget or interactive_used+catalog_used+p_max>limits.global_monthly_budget_twd then raise exception 'AI_BUDGET_EXHAUSTED'; end if;
  insert into public.ai_operations(user_id,operation_id,feature,input_hash,status,model,reserved_twd) values(p_user,p_operation,p_feature,p_hash,'reserved',p_model,p_max);
  return jsonb_build_object('status','reserved');
end $$;

create or replace function private.settle_ai_operation(p_user uuid,p_operation uuid,p_status text,p_actual numeric,p_result jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
  if p_status not in ('completed','failed') or p_actual<0 then raise exception 'AI_OPERATION_INVALID'; end if;
  update public.ai_operations set status=p_status,actual_twd=p_actual,result=p_result,completed_at=now()
  where user_id=p_user and operation_id=p_operation and status='reserved';
  if not found then raise exception 'AI_OPERATION_NOT_FOUND'; end if;
end $$;

create or replace function public.reserve_ai_operation(p_user uuid,p_operation uuid,p_feature text,p_hash text,p_model text,p_max numeric)
returns jsonb language sql security invoker set search_path='' as $$ select private.reserve_ai_operation(p_user,p_operation,p_feature,p_hash,p_model,p_max) $$;
create or replace function public.settle_ai_operation(p_user uuid,p_operation uuid,p_status text,p_actual numeric,p_result jsonb)
returns void language sql security invoker set search_path='' as $$ select private.settle_ai_operation(p_user,p_operation,p_status,p_actual,p_result) $$;

revoke all on function private.reserve_ai_operation(uuid,uuid,text,text,text,numeric),private.settle_ai_operation(uuid,uuid,text,numeric,jsonb) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.reserve_ai_operation(uuid,uuid,text,text,text,numeric),private.settle_ai_operation(uuid,uuid,text,numeric,jsonb) to service_role;
revoke all on function public.reserve_ai_operation(uuid,uuid,text,text,text,numeric),public.settle_ai_operation(uuid,uuid,text,numeric,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_ai_operation(uuid,uuid,text,text,text,numeric),public.settle_ai_operation(uuid,uuid,text,numeric,jsonb) to service_role;

-- Catalog reservations now obey both their own NT$50 cap and the shared NT$150 cap.
create or replace function private.reserve_recipe_usage(p_id uuid,p_job uuid,p_lease uuid,p_purpose text,p_max numeric,p_rate jsonb) returns void language plpgsql security definer set search_path='' as $$
declare used numeric; interactive_used numeric; limits public.recipe_catalog_control; month_start timestamptz;
begin
 perform pg_advisory_xact_lock(hashtext('coocoo-openrouter-budget'));
 select * into limits from public.recipe_catalog_control where id;
 if p_max<=0 or limits.paused then raise exception 'CATALOG_PAUSED';end if;
 if not exists(select 1 from public.recipe_catalog_jobs where id=p_job and lease_token=p_lease and lease_until>now() and status='running') then raise exception 'JOB_LEASE_LOST';end if;
 month_start:=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into used from public.recipe_catalog_usage where created_at>=month_start;
 select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into interactive_used from public.ai_operations where created_at>=month_start;
 if used+p_max>least(limits.catalog_monthly_budget_twd,300) then raise exception 'CATALOG_BUDGET_EXHAUSTED';end if;
 if used+interactive_used+p_max>limits.global_monthly_budget_twd then raise exception 'AI_BUDGET_EXHAUSTED';end if;
 insert into public.recipe_catalog_usage(id,job_id,purpose,reserved_twd,rate) values(p_id,p_job,p_purpose,p_max,p_rate);
end $$;

alter table public.recipes drop constraint recipes_source_check;
alter table public.recipes add constraint recipes_source_check check(source in ('gemini','openrouter','brand_safe','catalog'));

create or replace function private.enforce_recipe_safety_marker() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.safety_reviewed:=new.source in ('brand_safe','catalog');
  return new;
end $$;
drop trigger if exists enforce_recipe_safety_marker on public.recipes;
create trigger enforce_recipe_safety_marker before insert or update of source,safety_reviewed on public.recipes for each row execute function private.enforce_recipe_safety_marker();
revoke all on function private.enforce_recipe_safety_marker() from public,anon,authenticated;
grant execute on function private.enforce_recipe_safety_marker() to service_role;
