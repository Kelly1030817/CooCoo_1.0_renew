create or replace function public.save_onboarding_profile(p_user_id uuid, p_profile jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  item jsonb;
  v_target integer := coalesce(nullif(p_profile->>'dreamTargetAmount','')::integer, 0);
  v_name text := trim(coalesce(p_profile->>'dreamName', ''));
  v_goal_id uuid;
  v_saved integer := 0;
begin
  insert into public.profiles(user_id, household_servings, daily_meal_budget, outside_meal_price, weekly_home_cook_target, onboarding_status, onboarding_step, planned_meal_slots, preferred_flavors, updated_at)
  values(p_user_id, (p_profile->>'householdServings')::smallint, (p_profile->>'dailyMealBudget')::integer, (p_profile->>'outsideMealComparisonPrice')::integer, (p_profile->>'weeklyHomeCookTarget')::smallint,
    p_profile->>'status', (p_profile->>'currentStep')::smallint, array(select jsonb_array_elements_text(p_profile->'plannedMealSlots')),
    array(select jsonb_array_elements_text(p_profile->'preferredFlavors')), now())
  on conflict(user_id) do update set household_servings=excluded.household_servings, daily_meal_budget=excluded.daily_meal_budget, outside_meal_price=excluded.outside_meal_price,
    weekly_home_cook_target=excluded.weekly_home_cook_target, onboarding_status=excluded.onboarding_status, onboarding_step=excluded.onboarding_step,
    planned_meal_slots=excluded.planned_meal_slots, preferred_flavors=excluded.preferred_flavors, updated_at=now();

  delete from public.cookware where user_id=p_user_id;
  for item in select * from jsonb_array_elements(p_profile->'cookware') loop
    insert into public.cookware(user_id,type,capacity,limitations) values(p_user_id,item->>'type',item->>'capacity',array(select jsonb_array_elements_text(coalesce(item->'limitations','[]'::jsonb))));
  end loop;

  delete from public.dietary_restrictions where user_id=p_user_id;
  for item in select * from jsonb_array_elements(p_profile->'restrictions') loop
    insert into public.dietary_restrictions(user_id,label,kind,ingredient_keys,is_hard_limit)
    values(p_user_id,item->>'label',item->>'kind',array(select jsonb_array_elements_text(item->'ingredientKeys')),(item->>'isHardLimit')::boolean);
  end loop;

  -- 處理圓夢目標 (Goals)：若已存在目標則更新名稱與目標金額，重新計算狀態並保留既有存款事件
  select id into v_goal_id from public.goals where user_id=p_user_id and status in ('active','completed') order by created_at desc limit 1;
  if v_goal_id is null then
    if v_target > 0 and v_name <> '' then
      insert into public.goals(user_id,name,target_amount,status)
      values(p_user_id, v_name, v_target, 'active');
    end if;
  else
    if v_target > 0 and v_name <> '' then
      select coalesce((select sum(amount) from public.goal_amount_events where user_id=p_user_id and goal_id=v_goal_id),0)
           + coalesce((select sum(confirmed_amount) from public.savings_events where user_id=p_user_id and goal_id=v_goal_id),0)
      into v_saved;

      update public.goals
      set name = v_name,
          target_amount = v_target,
          status = case when v_saved >= v_target then 'completed' else 'active' end,
          completed_at = case when v_saved >= v_target then coalesce(completed_at, now()) else null end
      where id = v_goal_id and user_id = p_user_id;
    end if;
  end if;

  update public.beta_invites set status='accepted',accepted_at=coalesce(accepted_at,now()) where email=(select lower(email) from auth.users where id=p_user_id) and status='invited';
end;
$$;
revoke all on function public.save_onboarding_profile(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.save_onboarding_profile(uuid,jsonb) to service_role;
