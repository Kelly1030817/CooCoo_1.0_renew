-- Saving onboarding preferences must never delete persisted inventory.
-- A destructive "clear fridge" operation, if added later, needs its own
-- explicit confirmation and audit boundary.
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
end $$;
revoke all on function public.save_onboarding_profile(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_onboarding_profile(uuid,jsonb) to service_role;
