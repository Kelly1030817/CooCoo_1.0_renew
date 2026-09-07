-- Low-cost operating limits. The 300 TWD constraint remains the emergency ceiling;
-- normal catalog work stops at 50 TWD or 50 candidates, whichever comes first.
alter table public.recipe_catalog_control
  add column if not exists catalog_monthly_budget_twd numeric not null default 50 check (catalog_monthly_budget_twd between 0 and 300),
  add column if not exists catalog_monthly_candidate_limit integer not null default 50 check (catalog_monthly_candidate_limit between 0 and 50),
  add column if not exists shopping_monthly_budget_twd numeric not null default 100 check (shopping_monthly_budget_twd >= 0),
  add column if not exists global_monthly_budget_twd numeric not null default 150 check (global_monthly_budget_twd >= 0),
  add column if not exists shopping_daily_user_limit integer not null default 20 check (shopping_daily_user_limit between 0 and 100);

create table if not exists public.shopping_ai_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  input_hash text not null,
  status text not null check(status in ('reserved','completed','failed')),
  model text not null,
  reserved_twd numeric not null check(reserved_twd>=0),
  actual_twd numeric check(actual_twd>=0),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key(user_id,operation_id)
);
alter table public.shopping_ai_operations enable row level security;
revoke all on public.shopping_ai_operations from public,anon,authenticated;
grant all on public.shopping_ai_operations to service_role;

create or replace function public.reserve_shopping_ai(p_user uuid,p_operation uuid,p_hash text,p_model text,p_max numeric) returns text
language plpgsql security definer set search_path='' as $$
declare daily_count integer; shopping_used numeric; catalog_used numeric; limits public.recipe_catalog_control;
begin
 perform pg_advisory_xact_lock(hashtext('coocoo-openrouter-budget'));
 if exists(select 1 from public.shopping_ai_operations where user_id=p_user and operation_id=p_operation) then return 'duplicate'; end if;
 select * into limits from public.recipe_catalog_control where id;
 select count(*) into daily_count from public.shopping_ai_operations where user_id=p_user and created_at>=date_trunc('day',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 if daily_count>=limits.shopping_daily_user_limit then raise exception 'AI_DAILY_LIMITED'; end if;
 select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into shopping_used from public.shopping_ai_operations where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into catalog_used from public.recipe_catalog_usage where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 if shopping_used+p_max>limits.shopping_monthly_budget_twd or shopping_used+catalog_used+p_max>limits.global_monthly_budget_twd then raise exception 'AI_BUDGET_EXHAUSTED'; end if;
 insert into public.shopping_ai_operations(user_id,operation_id,input_hash,status,model,reserved_twd) values(p_user,p_operation,p_hash,'reserved',p_model,p_max);
 return 'reserved';
end $$;
revoke all on function public.reserve_shopping_ai(uuid,uuid,text,text,numeric) from public,anon,authenticated;
grant execute on function public.reserve_shopping_ai(uuid,uuid,text,text,numeric) to service_role;

create or replace function public.settle_shopping_ai(p_user uuid,p_operation uuid,p_status text,p_actual numeric,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.shopping_ai_operations set status=p_status,actual_twd=p_actual,result=p_result where user_id=p_user and operation_id=p_operation and status='reserved';
 if not found then raise exception 'AI_OPERATION_NOT_FOUND'; end if;
end $$;
revoke all on function public.settle_shopping_ai(uuid,uuid,text,numeric,jsonb) from public,anon,authenticated;
grant execute on function public.settle_shopping_ai(uuid,uuid,text,numeric,jsonb) to service_role;

create or replace function private.reserve_recipe_usage(p_id uuid,p_job uuid,p_lease uuid,p_purpose text,p_max numeric,p_rate jsonb) returns void language plpgsql security definer set search_path='' as $$
declare used numeric; budget numeric;
begin
 perform pg_advisory_xact_lock(hashtext('recipe-catalog-budget'));
 select catalog_monthly_budget_twd into budget from public.recipe_catalog_control where id;
 if p_max<=0 or (select paused from public.recipe_catalog_control where id) then raise exception 'CATALOG_PAUSED';end if;
 if not exists(select 1 from public.recipe_catalog_jobs where id=p_job and lease_token=p_lease and lease_until>now() and status='running') then raise exception 'JOB_LEASE_LOST';end if;
 select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into used from public.recipe_catalog_usage where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 if used+p_max>least(budget,300) then raise exception 'CATALOG_BUDGET_EXHAUSTED';end if;
 insert into public.recipe_catalog_usage(id,job_id,purpose,reserved_twd,rate) values(p_id,p_job,p_purpose,p_max,p_rate);
end $$;

create or replace function private.schedule_recipe_jobs(p_week date,p_contexts jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare c integer; lim integer; i integer:=0; ctx jsonb; added integer:=0; count_added integer;
begin
 perform pg_advisory_xact_lock(hashtext('recipe-catalog-budget'));
 select catalog_monthly_candidate_limit into lim from public.recipe_catalog_control where id;
 if (select paused from public.recipe_catalog_control where id) then return 0; end if;
 select count(*) into c from public.recipe_catalog_jobs where created_at>=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
 for ctx in select value from jsonb_array_elements(p_contexts) limit 10 loop
  exit when c>=lim;
  insert into public.recipe_catalog_jobs(week_start,slot,context) values(p_week,i,ctx) on conflict(week_start,slot) do nothing;
  get diagnostics count_added=row_count; added:=added+count_added;c:=c+count_added;i:=i+1;
 end loop; return added;
end $$;

-- Supabase hosted projects install the hourly wake-up. Local PGlite skips this block.
do $$
begin
 if exists(select 1 from pg_available_extensions where name='pg_cron')
    and exists(select 1 from pg_available_extensions where name='pg_net')
    and exists(select 1 from pg_available_extensions where name='supabase_vault') then
   create extension if not exists pg_cron;
   create extension if not exists pg_net with schema extensions;
   create extension if not exists supabase_vault with schema vault;
   execute $sql$
     create or replace function private.invoke_recipe_catalog_tick() returns void
     language plpgsql security definer set search_path='' as $fn$
     declare secret text;
     begin
       select decrypted_secret into secret from vault.decrypted_secrets where name='catalog_cron_secret' order by created_at desc limit 1;
       if secret is null then return; end if;
       perform net.http_post(
         url := 'https://coocoo-1-0-renew.onrender.com/api/v1/internal/catalog/tick',
         headers := jsonb_build_object('content-type','application/json','authorization','Bearer '||secret),
         body := '{}'::jsonb,
         timeout_milliseconds := 120000
       );
     end $fn$
   $sql$;
   if not exists(select 1 from cron.job where jobname='coocoo-recipe-catalog-hourly') then
     perform cron.schedule('coocoo-recipe-catalog-hourly','0 * * * *','select private.invoke_recipe_catalog_tick()');
   end if;
 end if;
end $$;
