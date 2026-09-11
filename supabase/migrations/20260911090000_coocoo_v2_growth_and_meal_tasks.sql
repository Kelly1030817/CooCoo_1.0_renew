-- CooCoo 1.0 v2. This migration is intentionally unapplied until Preview approval.
-- There are no production users, so the retired money-goal model has no compatibility period.

drop function if exists public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean);
drop table if exists public.savings_events cascade;
drop table if exists public.goal_events cascade;
drop table if exists public.goals cascade;

alter table public.profiles
  add column if not exists cooking_experience text check (cooking_experience in ('beginner','comfortable','advanced')),
  add column if not exists current_weekly_cooking_frequency integer not null default 0 check (current_weekly_cooking_frequency between 0 and 21),
  add column if not exists habit_barriers text[] not null default '{}',
  add column if not exists guidance_mode text not null default 'detailed' check (guidance_mode in ('detailed','compact')),
  add column if not exists available_minutes integer not null default 30 check (available_minutes between 5 and 180),
  add column if not exists primary_goal_metric text not null default 'cooking_sessions' check (primary_goal_metric in ('cooking_sessions','self_cooked_servings'));

alter table public.inventory_batches add column if not exists last_confirmed_at timestamptz not null default now();
alter table public.ai_usage_events drop constraint if exists ai_usage_events_feature_check;
alter table public.ai_usage_events add constraint ai_usage_events_feature_check check (feature in ('receipt_ocr','recipe_generation','shopping_analysis','catalog_generation','chef_chat'));
alter table public.ai_operations drop constraint if exists ai_operations_feature_check;
alter table public.ai_operations add constraint ai_operations_feature_check check(feature in ('shopping_analysis','recipe_generation','receipt_ocr','chef_chat'));
alter table public.recipe_catalog_control
  add column if not exists chef_chat_monthly_budget_twd numeric not null default 100 check(chef_chat_monthly_budget_twd>=0),
  add column if not exists chef_chat_daily_user_limit integer not null default 30 check(chef_chat_daily_user_limit between 0 and 100);
update public.recipe_catalog_control set global_monthly_budget_twd=250,chef_chat_monthly_budget_twd=100,chef_chat_daily_user_limit=30 where id;

create table public.weekly_goals_v2 (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, metric text not null check (metric in ('cooking_sessions','self_cooked_servings')),
  target integer not null check (target between 1 and 21), progress integer not null default 0 check (progress >= 0),
  reward_granted_at timestamptz, updated_at timestamptz not null default now(), unique(user_id,week_start)
);
create table public.exp_events (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null, event_type text not null check (event_type in ('cooking_completed','prepared_serving_eaten','expiring_ingredient_used','double_meal_completed','weekly_goal_completed')),
  points integer not null check (points in (10,20,30,40)), source_id uuid not null, created_at timestamptz not null default now(),
  unique(user_id,operation_id,event_type)
);
create table public.badge_awards (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null, category text not null check (category in ('cooking','rhythm','waste_less','exploration')),
  tier integer not null check (tier between 1 and 3), title text not null, awarded_at timestamptz not null default now(), unique(user_id,badge_key)
);
create table public.cooking_cost_records (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  cooking_session_id uuid not null unique references public.cooking_sessions(id) on delete cascade,
  comparison_meal_price integer not null default 0 check (comparison_meal_price >= 0), actual_ingredient_cost integer not null check (actual_ingredient_cost >= 0),
  difference integer not null check (difference >= 0), created_at timestamptz not null default now()
);
create table public.recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade, recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,recipe_id)
);
create table public.meal_tasks (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null, recipe_id uuid not null references public.recipes(id), adjustment_preview_id uuid,
  status text not null check(status in ('needs_shopping','ready','cooking','needs_replan','complete')),
  current_meal jsonb not null, next_meal jsonb not null, planned_total_servings integer not null check(planned_total_servings > 0),
  shortages jsonb not null default '[]', revision bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,operation_id)
);
create table public.recipe_adjustment_previews (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null, original_recipe_id uuid not null references public.recipes(id), adjusted_recipe jsonb not null,
  changes jsonb not null, missing jsonb not null, safety_checks jsonb not null, source text not null check(source in ('openrouter','rules')),
  confirmed_at timestamptz, expires_at timestamptz not null, created_at timestamptz not null default now(), unique(user_id,operation_id)
);
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade, expiring_ingredients boolean not null default true,
  planned_meals boolean not null default true, weekly_rhythm boolean not null default true, push_enabled boolean not null default false,
  quiet_hours_start time not null default '21:00', quiet_hours_end time not null default '09:00', weekly_limit integer not null default 3 check(weekly_limit=3), updated_at timestamptz not null default now()
);
create table public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null, p256dh text not null, auth text not null, created_at timestamptz not null default now(), unique(user_id,endpoint)
);
create table public.chef_chat_sessions (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, source text not null check(source in ('openrouter','rules')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.chef_chat_messages (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.chef_chat_sessions(id) on delete cascade, role text not null check(role in ('user','assistant','system')),
  content text not null check(length(content) between 1 and 4000), created_at timestamptz not null default now()
);

create index exp_events_user_created_idx on public.exp_events(user_id,created_at desc);
create index meal_tasks_user_status_idx on public.meal_tasks(user_id,status,updated_at desc);
create index chef_chat_sessions_user_updated_idx on public.chef_chat_sessions(user_id,updated_at desc);

do $$ declare table_name text; begin
  foreach table_name in array array['weekly_goals_v2','exp_events','badge_awards','cooking_cost_records','recipe_favorites','meal_tasks','recipe_adjustment_previews','notification_preferences','push_subscriptions','chef_chat_sessions','chef_chat_messages'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('create policy %I on public.%I for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()))',table_name||'_own',table_name);
  end loop;
end $$;

grant select,insert,update,delete on public.weekly_goals_v2,public.exp_events,public.badge_awards,public.cooking_cost_records,public.recipe_favorites,public.meal_tasks,public.recipe_adjustment_previews,public.notification_preferences,public.push_subscriptions,public.chef_chat_sessions,public.chef_chat_messages to authenticated;

create or replace function public.save_onboarding_profile(p_user_id uuid,p_profile jsonb) returns void language plpgsql security definer set search_path='' as $$
declare v_week date:=date_trunc('week',timezone('Asia/Taipei',now()))::date;v_restriction jsonb;
begin
  insert into public.profiles(user_id,household_servings,weekly_home_cook_target,onboarding_status,onboarding_step,planned_meal_slots,preferred_flavors,cooking_experience,current_weekly_cooking_frequency,habit_barriers,guidance_mode,available_minutes,primary_goal_metric,updated_at)
  values(p_user_id,(p_profile->>'householdServings')::integer,(p_profile->>'weeklyGoalTarget')::integer,p_profile->>'status',(p_profile->>'currentStep')::integer,array(select jsonb_array_elements_text(p_profile->'plannedMealSlots')),array(select jsonb_array_elements_text(coalesce(p_profile->'preferredFlavors','[]'))),p_profile->>'cookingExperience',(p_profile->>'currentWeeklyCookingFrequency')::integer,array(select jsonb_array_elements_text(p_profile->'habitBarriers')),p_profile->>'guidanceMode',(p_profile->>'availableMinutes')::integer,p_profile->>'primaryGoalMetric',now())
  on conflict(user_id) do update set household_servings=excluded.household_servings,weekly_home_cook_target=excluded.weekly_home_cook_target,onboarding_status=excluded.onboarding_status,onboarding_step=excluded.onboarding_step,planned_meal_slots=excluded.planned_meal_slots,preferred_flavors=excluded.preferred_flavors,cooking_experience=excluded.cooking_experience,current_weekly_cooking_frequency=excluded.current_weekly_cooking_frequency,habit_barriers=excluded.habit_barriers,guidance_mode=excluded.guidance_mode,available_minutes=excluded.available_minutes,primary_goal_metric=excluded.primary_goal_metric,updated_at=now();
  perform public.replace_cookware(p_user_id,coalesce(p_profile->'cookware','[]'));
  delete from public.dietary_restrictions where user_id=p_user_id;
  for v_restriction in select * from jsonb_array_elements(coalesce(p_profile->'restrictions','[]')) loop
    insert into public.dietary_restrictions(user_id,label,kind,ingredient_keys,is_hard_limit) values(p_user_id,v_restriction->>'label',v_restriction->>'kind',array(select jsonb_array_elements_text(coalesce(v_restriction->'ingredientKeys','[]'))),coalesce((v_restriction->>'isHardLimit')::boolean,false));
  end loop;
  insert into public.weekly_goals_v2(user_id,week_start,metric,target) values(p_user_id,v_week,p_profile->>'primaryGoalMetric',(p_profile->>'weeklyGoalTarget')::integer)
  on conflict(user_id,week_start) do update set metric=excluded.metric,target=excluded.target,updated_at=now();
  insert into public.notification_preferences(user_id,expiring_ingredients,planned_meals,weekly_rhythm,push_enabled,quiet_hours_start,quiet_hours_end)
  values(p_user_id,coalesce((p_profile#>>'{reminders,expiringIngredients}')::boolean,true),coalesce((p_profile#>>'{reminders,plannedMeals}')::boolean,true),coalesce((p_profile#>>'{reminders,weeklyRhythm}')::boolean,true),false,coalesce((p_profile#>>'{reminders,quietHoursStart}')::time,'21:00'),coalesce((p_profile#>>'{reminders,quietHoursEnd}')::time,'09:00'))
  on conflict(user_id) do update set expiring_ingredients=excluded.expiring_ingredients,planned_meals=excluded.planned_meals,weekly_rhythm=excluded.weekly_rhythm,quiet_hours_start=excluded.quiet_hours_start,quiet_hours_end=excluded.quiet_hours_end,updated_at=now();
  if coalesce((p_profile->>'inventoryReviewed')::boolean,false) and coalesce((p_profile->>'hasNoInventory')::boolean,false) then
    delete from public.inventory_batches where user_id=p_user_id;
  end if;
end $$;
revoke all on function public.save_onboarding_profile(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_onboarding_profile(uuid,jsonb) to service_role;

create or replace function public.restock_checked_shopping(p_user_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare v_item record;v_task record;v_shortage jsonb;v_bought record;v_shortages jsonb;v_moved integer:=0;v_needed numeric;v_take numeric;
begin
  create temporary table if not exists pg_temp.restock_bought(ingredient_key text,name text,unit text,remaining numeric) on commit drop;
  for v_item in select * from public.shopping_items where user_id=p_user_id and checked order by id for update loop
    insert into pg_temp.restock_bought(ingredient_key,name,unit,remaining) values(lower(v_item.ingredient_key),lower(v_item.name),v_item.unit,v_item.quantity);
    insert into public.inventory_batches(user_id,name,ingredient_key,quantity,unit,location,unit_cost,purchased_on,last_confirmed_at)
    values(p_user_id,v_item.name,v_item.ingredient_key,v_item.quantity,v_item.unit,case when v_item.category='pantry' then 'pantry' else 'cold' end,case when v_item.quantity>0 then v_item.estimated_cost/v_item.quantity else 0 end,current_date,now());
    delete from public.shopping_items where id=v_item.id and user_id=p_user_id;
    v_moved:=v_moved+1;
  end loop;
  for v_task in select id,shortages from public.meal_tasks where user_id=p_user_id and status='needs_shopping' order by created_at,id for update loop
    v_shortages:='[]'::jsonb;
    for v_shortage in select value from jsonb_array_elements(v_task.shortages) loop
      v_needed:=(v_shortage->>'quantity')::numeric;
      for v_bought in select ctid,remaining from pg_temp.restock_bought where remaining>0 and unit=v_shortage->>'unit' and (ingredient_key in (lower(v_shortage->>'ingredientKey'),lower(v_shortage->>'name')) or name in (lower(v_shortage->>'ingredientKey'),lower(v_shortage->>'name'))) order by ctid for update loop
        v_take:=least(v_needed,v_bought.remaining);
        update pg_temp.restock_bought set remaining=remaining-v_take where ctid=v_bought.ctid;
        v_needed:=v_needed-v_take;
        exit when v_needed<=0;
      end loop;
      if v_needed<=0 then
        v_shortage:=jsonb_set(v_shortage,'{resolution}',to_jsonb('bought'::text));
      elsif v_needed<(v_shortage->>'quantity')::numeric then
        v_shortage:=jsonb_set(jsonb_set(v_shortage,'{quantity}',to_jsonb(v_needed)),'{resolution}',to_jsonb('needed'::text));
      end if;
      v_shortages:=v_shortages||jsonb_build_array(v_shortage);
    end loop;
    if v_shortages<>v_task.shortages then
      update public.meal_tasks set shortages=v_shortages,status=case when not exists(select 1 from jsonb_array_elements(v_shortages) item where item->>'resolution'='needed') then 'ready' else 'needs_shopping' end,revision=revision+1,updated_at=now() where id=v_task.id and user_id=p_user_id;
    end if;
  end loop;
  return v_moved;
end $$;
revoke all on function public.restock_checked_shopping(uuid) from public,anon,authenticated;
grant execute on function public.restock_checked_shopping(uuid) to service_role;

create or replace function private.reserve_ai_operation(p_user uuid,p_operation uuid,p_feature text,p_hash text,p_model text,p_max numeric)
returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.ai_operations;limits public.recipe_catalog_control;daily_count integer;feature_used numeric;interactive_used numeric;catalog_used numeric;feature_budget numeric;daily_limit integer;month_start timestamptz;day_start timestamptz;
begin
  if p_feature not in ('shopping_analysis','recipe_generation','receipt_ocr','chef_chat') or p_max<=0 then raise exception 'AI_OPERATION_INVALID';end if;
  perform pg_advisory_xact_lock(hashtext('coocoo-openrouter-budget'));
  select * into existing from public.ai_operations where user_id=p_user and operation_id=p_operation;
  if found then if existing.input_hash<>p_hash or existing.feature<>p_feature then raise exception 'AI_OPERATION_CONFLICT';end if;if existing.status='reserved' then raise exception 'AI_OPERATION_IN_PROGRESS';end if;return jsonb_build_object('status',existing.status,'result',existing.result);end if;
  select * into limits from public.recipe_catalog_control where id;month_start:=date_trunc('month',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';day_start:=date_trunc('day',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei';
  feature_budget:=case p_feature when 'shopping_analysis' then limits.shopping_monthly_budget_twd when 'recipe_generation' then limits.recipe_generation_monthly_budget_twd when 'receipt_ocr' then limits.receipt_ocr_monthly_budget_twd else limits.chef_chat_monthly_budget_twd end;
  daily_limit:=case p_feature when 'shopping_analysis' then limits.shopping_daily_user_limit when 'recipe_generation' then limits.recipe_generation_daily_user_limit when 'receipt_ocr' then limits.receipt_ocr_daily_user_limit else limits.chef_chat_daily_user_limit end;
  select count(*) into daily_count from public.ai_operations where user_id=p_user and feature=p_feature and created_at>=day_start;if daily_count>=daily_limit then raise exception 'AI_DAILY_LIMITED';end if;
  select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into feature_used from public.ai_operations where feature=p_feature and created_at>=month_start;
  select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into interactive_used from public.ai_operations where created_at>=month_start;
  select coalesce(sum(coalesce(actual_twd,reserved_twd)),0) into catalog_used from public.recipe_catalog_usage where created_at>=month_start;
  if feature_used+p_max>feature_budget or interactive_used+catalog_used+p_max>limits.global_monthly_budget_twd then raise exception 'AI_BUDGET_EXHAUSTED';end if;
  insert into public.ai_operations(user_id,operation_id,feature,input_hash,status,model,reserved_twd) values(p_user,p_operation,p_feature,p_hash,'reserved',p_model,p_max);return jsonb_build_object('status','reserved');
end $$;

create or replace function public.complete_cooking_v2_transaction(
  p_user_id uuid,p_operation_id uuid,p_recipe jsonb,p_requirements jsonb,p_ingredient_cost integer,p_comparison_meal_price integer,
  p_track_cost boolean,p_servings_cooked integer,p_servings_eaten integer,p_vegetables boolean,p_used_expiring boolean,p_completed_double_meal boolean,p_meal_task_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_session_id uuid:=extensions.gen_random_uuid();v_recipe_id uuid:=extensions.gen_random_uuid();v_requirement jsonb;v_batch record;v_needed numeric;v_take numeric;v_conflict boolean:=false;v_index integer;v_week date;v_progress integer;v_target integer;
begin
  if p_servings_cooked<1 or p_servings_eaten<0 or p_servings_eaten>p_servings_cooked then raise exception 'INVALID_SERVING_COUNT';end if;
  if exists(select 1 from public.cooking_sessions where user_id=p_user_id and operation_id=p_operation_id) then return jsonb_build_object('accepted',false,'reason','duplicate');end if;
  if p_meal_task_id is not null and not exists(select 1 from public.meal_tasks where id=p_meal_task_id and user_id=p_user_id and status in ('ready','cooking') for update) then raise exception 'MEAL_TASK_NOT_READY';end if;
  insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,cookware_types,ingredients,steps,safety_reviewed,source)
  values(v_recipe_id,p_user_id,p_recipe->>'title',p_servings_cooked,0,greatest(1,coalesce(nullif(regexp_replace(p_recipe->>'prepTime','[^0-9]','','g'),'')::integer,30)),'{}',coalesce(p_requirements,'[]'),coalesce(p_recipe->'steps','[]'),false,'brand_safe');
  insert into public.cooking_sessions(id,user_id,operation_id,recipe_id,status,servings_cooked,current_step,completed_at) values(v_session_id,p_user_id,p_operation_id,v_recipe_id,'completed',p_servings_cooked,999,now());
  for v_requirement in select * from jsonb_array_elements(coalesce(p_requirements,'[]')) loop
    if coalesce((v_requirement->>'isPantryStaple')::boolean,false) then continue;end if;
    v_needed:=(v_requirement->>'quantity')::numeric*p_servings_cooked;
    for v_batch in select id,quantity from public.inventory_batches where user_id=p_user_id and ingredient_key=lower(v_requirement->>'ingredientKey') and quantity>0 order by expires_on nulls last,id for update loop
      exit when v_needed<=0;v_take:=least(v_needed,v_batch.quantity);update public.inventory_batches set quantity=quantity-v_take,version=version+1,updated_at=now() where id=v_batch.id;v_needed:=v_needed-v_take;
    end loop;
    if v_needed>0 then v_conflict:=true;end if;
  end loop;
  for v_index in 1..p_servings_cooked loop insert into public.meal_servings(user_id,cooking_session_id,status,vegetable_keys,eaten_at) values(p_user_id,v_session_id,case when v_index<=p_servings_eaten then 'eaten' else 'prepared_inventory' end,case when p_vegetables and v_index<=p_servings_eaten then array['reported-vegetable'] else '{}' end,case when v_index<=p_servings_eaten then now() else null end);end loop;
  insert into public.exp_events(user_id,operation_id,event_type,points,source_id) values(p_user_id,p_operation_id,'cooking_completed',30,v_session_id);
  if p_used_expiring then insert into public.exp_events(user_id,operation_id,event_type,points,source_id) values(p_user_id,p_operation_id,'expiring_ingredient_used',10,v_session_id);end if;
  if p_completed_double_meal then insert into public.exp_events(user_id,operation_id,event_type,points,source_id) values(p_user_id,p_operation_id,'double_meal_completed',20,v_session_id);end if;
  if p_track_cost then insert into public.cooking_cost_records(user_id,cooking_session_id,comparison_meal_price,actual_ingredient_cost,difference) values(p_user_id,v_session_id,greatest(0,coalesce(p_comparison_meal_price,0)),greatest(0,p_ingredient_cost),greatest(0,coalesce(p_comparison_meal_price,0)-p_ingredient_cost));end if;
  v_week:=date_trunc('week',timezone('Asia/Taipei',now()))::date;update public.weekly_goals_v2 set progress=progress+case when metric='cooking_sessions' then 1 else p_servings_eaten end,updated_at=now() where user_id=p_user_id and week_start=v_week returning progress,target into v_progress,v_target;
  if v_progress>=v_target then update public.weekly_goals_v2 set reward_granted_at=coalesce(reward_granted_at,now()) where user_id=p_user_id and week_start=v_week and reward_granted_at is null returning target into v_target;if found then insert into public.exp_events(user_id,operation_id,event_type,points,source_id) values(p_user_id,extensions.gen_random_uuid(),'weekly_goal_completed',40,(select id from public.weekly_goals_v2 where user_id=p_user_id and week_start=v_week));end if;end if;
  insert into public.badge_awards(user_id,badge_key,category,tier,title)
  select p_user_id,b.badge_key,b.category,b.tier,b.title from (values
    ('cooking-1','cooking',1,'第一道火光','cooking',1),('cooking-10','cooking',2,'十餐上桌','cooking',10),('cooking-30','cooking',3,'料理成習','cooking',30),
    ('rhythm-1','rhythm',1,'第一週節奏','rhythm',1),('rhythm-4','rhythm',2,'穩穩一個月','rhythm',4),('rhythm-12','rhythm',3,'一季同行','rhythm',12),
    ('waste-less-1','waste_less',1,'惜食初芽','waste_less',1),('waste-less-5','waste_less',2,'冰箱守護者','waste_less',5),('waste-less-15','waste_less',3,'惜食達人','waste_less',15),
    ('exploration-3','exploration',1,'三味探索','exploration',3),('exploration-10','exploration',2,'十道風景','exploration',10),('exploration-25','exploration',3,'百味前奏','exploration',25)
  ) as b(badge_key,category,tier,title,metric,target)
  where case b.metric
    when 'cooking' then (select count(*) from public.cooking_sessions where user_id=p_user_id and status='completed')
    when 'rhythm' then (select count(*) from public.exp_events where user_id=p_user_id and event_type='weekly_goal_completed')
    when 'waste_less' then (select count(*) from public.exp_events where user_id=p_user_id and event_type in ('expiring_ingredient_used','prepared_serving_eaten'))
    else (select count(distinct r.title) from public.cooking_sessions s join public.recipes r on r.id=s.recipe_id where s.user_id=p_user_id and s.status='completed')
  end >= b.target
  on conflict(user_id,badge_key) do nothing;
  insert into public.offline_operations(id,user_id,kind,payload,status,synced_at) values(p_operation_id,p_user_id,'cooking_complete',jsonb_build_object('sessionId',v_session_id),(case when v_conflict then 'conflict' else 'synced' end)::public.operation_status,now());
  if p_meal_task_id is not null then update public.meal_tasks set status='complete',revision=revision+1,updated_at=now() where id=p_meal_task_id and user_id=p_user_id;end if;
  if v_conflict then insert into public.sync_conflicts(user_id,operation_id,kind,message) values(p_user_id,p_operation_id,'inventory_shortage','料理已保留，但另一裝置的庫存不足；未產生負庫存，請確認實際用量。');end if;
  return jsonb_build_object('accepted',true,'sessionId',v_session_id,'hasConflict',v_conflict);
end $$;
revoke all on function public.complete_cooking_v2_transaction(uuid,uuid,jsonb,jsonb,integer,integer,boolean,integer,integer,boolean,boolean,boolean,uuid) from public,anon,authenticated;
grant execute on function public.complete_cooking_v2_transaction(uuid,uuid,jsonb,jsonb,integer,integer,boolean,integer,integer,boolean,boolean,boolean,uuid) to service_role;

create or replace function public.eat_prepared_serving_v2(p_user_id uuid,p_serving_id uuid,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_session_id uuid;v_week date;v_progress integer;v_target integer;v_waste_count integer;
begin
  if exists(select 1 from public.exp_events where user_id=p_user_id and operation_id=p_operation_id and event_type='prepared_serving_eaten') then return jsonb_build_object('accepted',false,'reason','duplicate');end if;
  update public.meal_servings set status='eaten',eaten_at=now() where id=p_serving_id and user_id=p_user_id and status='prepared_inventory' returning cooking_session_id into v_session_id;
  if v_session_id is null then raise exception 'PREPARED_SERVING_NOT_FOUND';end if;
  insert into public.exp_events(user_id,operation_id,event_type,points,source_id) values(p_user_id,p_operation_id,'prepared_serving_eaten',10,p_serving_id);
  v_week:=date_trunc('week',timezone('Asia/Taipei',now()))::date;
  update public.weekly_goals_v2 set progress=progress+1,updated_at=now() where user_id=p_user_id and week_start=v_week and metric='self_cooked_servings' returning progress,target into v_progress,v_target;
  if v_progress>=v_target then update public.weekly_goals_v2 set reward_granted_at=coalesce(reward_granted_at,now()) where user_id=p_user_id and week_start=v_week and reward_granted_at is null returning target into v_target;if found then insert into public.exp_events(user_id,operation_id,event_type,points,source_id) values(p_user_id,extensions.gen_random_uuid(),'weekly_goal_completed',40,(select id from public.weekly_goals_v2 where user_id=p_user_id and week_start=v_week));end if;end if;
  select count(*) into v_waste_count from public.exp_events where user_id=p_user_id and event_type in ('expiring_ingredient_used','prepared_serving_eaten');
  insert into public.badge_awards(user_id,badge_key,category,tier,title)
  select p_user_id,badge_key,'waste_less',tier,title from (values ('waste-less-1',1,'惜食初芽',1),('waste-less-5',2,'冰箱守護者',5),('waste-less-15',3,'惜食達人',15)) as b(badge_key,tier,title,target)
  where v_waste_count>=target on conflict(user_id,badge_key) do nothing;
  return jsonb_build_object('accepted',true,'servingId',p_serving_id,'expAwarded',10);
end $$;
revoke all on function public.eat_prepared_serving_v2(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.eat_prepared_serving_v2(uuid,uuid,uuid) to service_role;
