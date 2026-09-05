alter table public.goals
  add column if not exists purpose text not null default 'dream',
  add column if not exists target_date date;

create unique index if not exists goals_one_active_per_user_idx
  on public.goals(user_id) where status = 'active';

create table public.goal_amount_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  type text not null check (type in ('opening_balance','balance_adjustment','extra_deposit')),
  amount integer not null,
  created_at timestamptz not null default now()
);
create index goal_amount_events_user_goal_idx on public.goal_amount_events(user_id, goal_id, created_at);

alter table public.goal_amount_events enable row level security;
create policy "members own goal amount events" on public.goal_amount_events
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.goal_amount_events from anon, authenticated;
grant select on public.goal_amount_events to authenticated;
grant all on public.goal_amount_events to service_role;
create index goal_amount_events_goal_idx on public.goal_amount_events(goal_id);

create or replace function public.replace_goal_settings(p_user_id uuid, p_draft jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_goal_id uuid := extensions.gen_random_uuid();
  target integer := (p_draft->>'targetAmount')::integer;
  opening integer := coalesce((p_draft->>'currentSavedAmount')::integer, 0);
  slot_count integer;
begin
  if target <= 0 then raise exception 'INVALID_GOAL_TARGET'; end if;
  perform 1 from public.profiles where user_id = p_user_id for update;
  if not found then raise exception 'ONBOARDING_REQUIRED'; end if;

  update public.goals set status = 'archived' where user_id = p_user_id and status in ('active','completed');
  insert into public.goals(id,user_id,purpose,name,target_amount,target_date,status,completed_at)
  values(new_goal_id,p_user_id,coalesce(nullif(p_draft->>'purpose',''),'dream'),trim(p_draft->>'name'),target,
    nullif(p_draft->>'targetDate','')::date,
    case when opening >= target then 'completed' else 'active' end,
    case when opening >= target then now() else null end);
  insert into public.goal_amount_events(user_id,goal_id,type,amount)
  values(p_user_id,new_goal_id,'opening_balance',opening);

  select greatest(1,cardinality(planned_meal_slots)) into slot_count from public.profiles where user_id=p_user_id;
  update public.profiles set
    outside_meal_price=coalesce((p_draft->>'directEatingOutCost')::integer,
      case when coalesce((p_draft->>'eatingOutMeals')::integer,0)>0 then
        round((p_draft->>'eatingOutTotal')::numeric/(p_draft->>'eatingOutMeals')::numeric)::integer
      else outside_meal_price end),
    daily_meal_budget=coalesce((p_draft->>'homeCookBudget')::integer,0)*slot_count,
    weekly_home_cook_target=coalesce((p_draft->>'weeklyCookingMeals')::smallint,weekly_home_cook_target),
    updated_at=now()
  where user_id=p_user_id;
  return new_goal_id;
end $$;
revoke all on function public.replace_goal_settings(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.replace_goal_settings(uuid,jsonb) to service_role;

create or replace function public.update_goal_settings(p_user_id uuid, p_goal_id uuid, p_patch jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_saved integer;
  desired_saved integer;
  next_target integer;
  slot_count integer;
begin
  perform 1 from public.profiles where user_id=p_user_id for update;
  if not exists(select 1 from public.goals where id=p_goal_id and user_id=p_user_id and status in ('active','completed') for update) then
    raise exception 'GOAL_NOT_FOUND';
  end if;
  select target_amount into next_target from public.goals where id=p_goal_id;
  if p_patch ? 'targetAmount' then
    next_target := (p_patch->>'targetAmount')::integer;
    if next_target <= 0 then raise exception 'INVALID_GOAL_TARGET'; end if;
  end if;

  select coalesce((select sum(amount) from public.goal_amount_events where user_id=p_user_id and goal_id=p_goal_id),0)
       + coalesce((select sum(confirmed_amount) from public.savings_events where user_id=p_user_id and goal_id=p_goal_id),0)
  into current_saved;
  if p_patch ? 'desiredSaved' then
    desired_saved := greatest(0,(p_patch->>'desiredSaved')::integer);
    if desired_saved <> current_saved then
      insert into public.goal_amount_events(user_id,goal_id,type,amount)
      values(p_user_id,p_goal_id,'balance_adjustment',desired_saved-current_saved);
      current_saved := desired_saved;
    end if;
  end if;

  update public.goals set
    target_amount=next_target,
    target_date=case when p_patch ? 'targetDate' then nullif(p_patch->>'targetDate','')::date else target_date end,
    status=case when current_saved>=next_target then 'completed' else 'active' end,
    completed_at=case when current_saved>=next_target then coalesce(completed_at,now()) else null end
  where id=p_goal_id and user_id=p_user_id;

  select greatest(1,cardinality(planned_meal_slots)) into slot_count from public.profiles where user_id=p_user_id;
  update public.profiles set
    daily_meal_budget=case when p_patch ? 'homeCookBudget' then (p_patch->>'homeCookBudget')::integer*slot_count else daily_meal_budget end,
    weekly_home_cook_target=case when p_patch ? 'weeklyCookingMeals' then (p_patch->>'weeklyCookingMeals')::smallint else weekly_home_cook_target end,
    updated_at=now()
  where user_id=p_user_id;
end $$;
revoke all on function public.update_goal_settings(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.update_goal_settings(uuid,uuid,jsonb) to service_role;

alter table public.recipes
  add column if not exists estimated_cost integer not null default 0 check (estimated_cost >= 0),
  add column if not exists fallback_image_url text not null default '/favicon.svg';

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
    insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,estimated_cost,cookware_types,ingredients,steps,image_path,fallback_image_url,safety_reviewed,source)
    values((meal->>'recipeId')::uuid,p_user_id,package->>'title',(package->>'servings')::smallint,(package->>'prepMinutes')::smallint,
      (package->>'totalMinutes')::smallint,(package->>'estimatedCost')::integer,array(select jsonb_array_elements_text(package->'cookwareTypes')),
      package->'ingredients',package->'steps',nullif(package->>'imageUrl',''),coalesce(nullif(package->>'fallbackImageUrl',''),'/favicon.svg'),true,'brand_safe');
    insert into public.planned_meals(id,user_id,meal_plan_id,recipe_id,planned_date,meal_slot,status,servings,estimated_cost,energy_level)
    values((meal->>'id')::uuid,p_user_id,plan_id,(meal->>'recipeId')::uuid,(meal->>'date')::date,meal->>'slot',meal->>'status',
      (meal->>'servings')::smallint,(meal->>'estimatedCost')::integer,meal->>'energyLevel');
  end loop;
  return plan_id;
end $$;
revoke all on function public.replace_meal_plan(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.replace_meal_plan(uuid,jsonb) to service_role;

create or replace function public.reschedule_planned_meal(p_user_id uuid,p_plan_id uuid,p_meal_id uuid,p_expected timestamptz,p_date date,p_slot text,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare current_version timestamptz;
begin
  select updated_at into current_version from public.meal_plans where id=p_plan_id and user_id=p_user_id for update;
  if not found then raise exception 'PLANNED_MEAL_NOT_FOUND'; end if;
  if current_version<>p_expected then raise exception 'MEAL_PLAN_CONFLICT'; end if;
  if p_status not in ('planned','cancelled') then raise exception 'MEAL_NOT_EDITABLE'; end if;
  if p_status='planned' and exists(select 1 from public.planned_meals where user_id=p_user_id and id<>p_meal_id and status<>'cancelled' and planned_date=p_date and meal_slot=p_slot) then raise exception 'MEAL_SLOT_OCCUPIED'; end if;
  update public.planned_meals set planned_date=p_date,meal_slot=p_slot,status=p_status
    where id=p_meal_id and meal_plan_id=p_plan_id and user_id=p_user_id and status in ('planned','postponed');
  if not found then raise exception 'MEAL_NOT_EDITABLE'; end if;
  update public.meal_plans set updated_at=clock_timestamp() where id=p_plan_id and user_id=p_user_id;
end $$;
revoke all on function public.reschedule_planned_meal(uuid,uuid,uuid,timestamptz,date,text,text) from public,anon,authenticated;
grant execute on function public.reschedule_planned_meal(uuid,uuid,uuid,timestamptz,date,text,text) to service_role;
