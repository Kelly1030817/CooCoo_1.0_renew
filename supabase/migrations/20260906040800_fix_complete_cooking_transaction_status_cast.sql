-- Fix operation_status enum cast in complete_cooking_transaction
create or replace function public.complete_cooking_transaction(
  p_user_id uuid, p_operation_id uuid, p_recipe jsonb, p_requirements jsonb,
  p_home_cook_cost integer, p_confirmed_savings integer, p_servings_cooked integer,
  p_servings_eaten integer, p_vegetables boolean
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare session_id uuid := extensions.gen_random_uuid(); recipe_id uuid := extensions.gen_random_uuid();
declare requirement jsonb; batch record; needed numeric; take_qty numeric; has_conflict boolean := false;
declare outside_price integer; active_goal uuid; serving_index integer;
begin
  if p_servings_eaten < 0 or p_servings_eaten > p_servings_cooked then raise exception 'INVALID_SERVING_COUNT'; end if;
  if exists(select 1 from public.cooking_sessions where user_id=p_user_id and operation_id=p_operation_id) then
    return jsonb_build_object('accepted',false,'reason','duplicate');
  end if;
  select outside_meal_price into outside_price from public.profiles where user_id=p_user_id;
  if outside_price is null then raise exception 'ONBOARDING_REQUIRED'; end if;
  if p_confirmed_savings > greatest(0,outside_price*p_servings_eaten-p_home_cook_cost) then raise exception 'SAVINGS_EXCEEDS_CALCULATED_AMOUNT'; end if;
  insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,cookware_types,ingredients,steps,safety_reviewed,source)
  values(recipe_id,p_user_id,p_recipe->>'title',1,0,greatest(1,coalesce(nullif(regexp_replace(p_recipe->>'prepTime','[^0-9]','','g'),'')::integer,30)),
    '{}',coalesce(p_requirements,'[]'::jsonb),coalesce(p_recipe->'steps','[]'::jsonb),false,'brand_safe')
  ;
  insert into public.cooking_sessions(id,user_id,operation_id,recipe_id,status,servings_cooked,current_step,started_at,completed_at)
  values(session_id,p_user_id,p_operation_id,recipe_id,'completed',p_servings_cooked,999,now(),now());
  for requirement in select * from jsonb_array_elements(coalesce(p_requirements,'[]'::jsonb))
  loop
    if coalesce((requirement->>'isPantryStaple')::boolean,false) then continue; end if;
    needed := (requirement->>'quantity')::numeric * p_servings_cooked;
    for batch in select id,quantity from public.inventory_batches
      where user_id=p_user_id and ingredient_key=lower(requirement->>'ingredientKey') and quantity>0
      order by expires_on nulls last,id for update
    loop
      exit when needed<=0;
      take_qty := least(needed,batch.quantity);
      update public.inventory_batches set quantity=quantity-take_qty,version=version+1,updated_at=now() where id=batch.id;
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
  values(p_operation_id,p_user_id,'cooking_complete',jsonb_build_object('sessionId',session_id),case when has_conflict then 'conflict'::public.operation_status else 'synced'::public.operation_status end,now());
  if has_conflict then
    insert into public.sync_conflicts(user_id,operation_id,kind,message) values(p_user_id,p_operation_id,'inventory_shortage','料理已保留，但另一裝置的庫存不足；未產生負庫存，請確認實際用量。');
  end if;
  return jsonb_build_object('accepted',true,'sessionId',session_id,'hasConflict',has_conflict);
end;
$$;

revoke all on function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) from public,anon,authenticated;
grant execute on function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) to service_role;
