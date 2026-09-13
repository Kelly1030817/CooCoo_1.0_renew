-- CooCoo 1.0 shopping restock v2: shortage bridge, idempotent operations, expiry-aware intake.
-- Additive rollout: retain the old RPC until the API deployment is complete.

alter table public.shopping_items
  add column if not exists shortage_id text,
  add column if not exists source text check (source in ('manual','voice','assistant','task','receipt'));

create table if not exists public.restock_operations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique(user_id, operation_id)
);
create index if not exists restock_operations_user_idx on public.restock_operations(user_id, created_at desc);


create function public.shopping_ingredient_key(value text) returns text language sql immutable set search_path='' as $$
  select case lower(trim(value))
    when 'egg' then '蛋'
    when 'eggs' then '蛋'
    when '雞蛋' then '蛋'
    when '蛋' then '蛋'
    when 'tofu' then '豆腐'
    when '豆腐' then '豆腐'
    when 'peanut' then '花生'
    when 'peanuts' then '花生'
    when '花生' then '花生'
    when 'shrimp' then '蝦'
    when 'prawn' then '蝦'
    when '蝦' then '蝦'
    when '蝦仁' then '蝦'
    when 'gluten' then '麩質'
    when 'wheat' then '麩質'
    when '小麥' then '麩質'
    when '麩質' then '麩質'
    when 'milk' then '牛奶'
    when 'dairy' then '乳製品'
    when '牛奶' then '牛奶'
    when '牛乳' then '牛奶'
    when '鮮乳' then '牛奶'
    when '乳製品' then '乳製品'
    when 'cheese' then '起司'
    when '起司' then '起司'
    when '芝士' then '起司'
    when 'chicken' then '雞肉'
    when 'chicken_breast' then '雞肉'
    when 'chicken breast' then '雞肉'
    when '雞胸肉' then '雞肉'
    when '雞肉' then '雞肉'
    when 'chicken_thigh' then '雞腿肉'
    when 'chicken thigh' then '雞腿肉'
    when '雞腿排' then '雞腿肉'
    when '雞腿肉' then '雞腿肉'
    when 'pork' then '豬肉'
    when 'pork_slices' then '豬肉'
    when 'pork slices' then '豬肉'
    when '豬肉片' then '豬肉'
    when '豬肉' then '豬肉'
    when 'beef' then '牛肉'
    when 'beef_slices' then '牛肉'
    when 'beef slices' then '牛肉'
    when '牛肉片' then '牛肉'
    when '牛肉' then '牛肉'
    when 'tomato' then '番茄'
    when 'tomatoes' then '番茄'
    when '番茄' then '番茄'
    when '蕃茄' then '番茄'
    when 'onion' then '洋蔥'
    when '洋蔥' then '洋蔥'
    when 'scallion' then '青蔥'
    when 'green_onion' then '青蔥'
    when 'green onion' then '青蔥'
    when '青蔥' then '青蔥'
    when '蔥' then '青蔥'
    when 'carrot' then '紅蘿蔔'
    when '紅蘿蔔' then '紅蘿蔔'
    when '胡蘿蔔' then '紅蘿蔔'
    when 'enoki' then '金針菇'
    when 'enoki_mushroom' then '金針菇'
    when '金針菇' then '金針菇'
    when 'potato' then '馬鈴薯'
    when '馬鈴薯' then '馬鈴薯'
    when 'sweet_potato' then '地瓜'
    when 'sweet potato' then '地瓜'
    when '地瓜' then '地瓜'
    when 'broccoli' then '青花菜'
    when '青花菜' then '青花菜'
    when '綠花椰菜' then '青花菜'
    when 'corn' then '玉米粒'
    when 'corn_kernels' then '玉米粒'
    when '玉米粒' then '玉米粒'
    when 'garlic' then '蒜頭'
    when '蒜頭' then '蒜頭'
    when '蒜米' then '蒜頭'
    when 'tuna' then '鮪魚'
    when '鮪魚' then '鮪魚'
    when 'rice' then '白米'
    when 'raw_rice' then '白米'
    when '白米' then '白米'
    when '白飯' then '白飯'
    when 'noodles' then '麵條'
    when 'noodle' then '麵條'
    when '麵' then '麵條'
    when '麵條' then '麵條'
    when 'udon' then '烏龍麵'
    when '烏龍麵' then '烏龍麵'
    when 'cooking_oil' then '油'
    when '食用油' then '油'
    when '油' then '油'
    when 'soy_sauce' then '醬油'
    when '醬油' then '醬油'
    when 'miso' then '味噌'
    when '味噌' then '味噌'
    when 'mirin' then '味醂'
    when '味醂' then '味醂'
    when 'sesame' then '芝麻'
    when '芝麻' then '芝麻'
    when 'sesame_sauce' then '胡麻醬'
    when '胡麻醬' then '胡麻醬'
    else lower(trim(value)) end;
$$;
revoke all on function public.shopping_ingredient_key(text) from public,anon,authenticated;
grant execute on function public.shopping_ingredient_key(text) to service_role;

create function public.refresh_shopping_task_v2(p_user_id uuid,p_task_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
<<task_refresh>>
declare t public.meal_tasks; r public.recipes; ingredient jsonb; old jsonb; shortages jsonb:='[]'; needed numeric; available numeric; status text; total numeric; stock record; take numeric;
begin
  select * into t from public.meal_tasks where user_id=p_user_id and id=p_task_id for update;
  if not found then raise exception 'MEAL_TASK_NOT_FOUND'; end if;
  if t.status not in ('needs_shopping','ready') then return '{}'::jsonb; end if;
  select * into r from public.recipes where id=t.recipe_id;
  create temporary table if not exists pg_temp.shopping_stock(id uuid,ingredient_key text,name text,unit text,remaining numeric) on commit drop;
  truncate pg_temp.shopping_stock;
  insert into pg_temp.shopping_stock select id,public.shopping_ingredient_key(ingredient_key),public.shopping_ingredient_key(name),unit,quantity from public.inventory_batches
    where user_id=p_user_id and quantity>0 and location in ('cold','frozen','pantry')
      and expires_on>=timezone('Asia/Taipei',now())::date and last_confirmed_at>now()-case when location='cold' then interval '7 days' else interval '30 days' end;
  for ingredient in select value from jsonb_array_elements(r.ingredients) where not coalesce((value->>'isPantryStaple')::boolean,false) loop
    total:=(ingredient->>'quantity')::numeric*t.planned_total_servings/r.servings;
    needed:=total;
    for stock in select * from pg_temp.shopping_stock where remaining>0 and unit=ingredient->>'unit' and (ingredient_key=public.shopping_ingredient_key(ingredient->>'ingredientKey') or name=public.shopping_ingredient_key(ingredient->>'name')) order by id loop
      take:=least(needed,stock.remaining);needed:=needed-take;
      update pg_temp.shopping_stock set remaining=remaining-take where id=stock.id;
      exit when needed<=0;
    end loop;
    select value into old from jsonb_array_elements(t.shortages) where value->>'ingredientKey'=ingredient->>'ingredientKey' and value->>'unit'=ingredient->>'unit' limit 1;
    if needed>0 or old is not null then
      shortages:=shortages||jsonb_build_array(jsonb_build_object('id',coalesce(old->>'id',t.operation_id::text||':'||(ingredient->>'ingredientKey')),'ingredientKey',ingredient->>'ingredientKey','name',ingredient->>'name','quantity',case when needed>0 then needed else total end,'unit',ingredient->>'unit','resolution',case when needed<=0 then 'bought' when old->>'resolution'='unavailable' then 'unavailable' else 'needed' end));
    end if;
  end loop;
  status:=case when exists(select 1 from jsonb_array_elements(shortages) s where s->>'resolution' not in ('bought','replaced')) then 'needs_shopping' else 'ready' end;
  if shortages<>t.shortages or status<>t.status then
    update public.meal_tasks set shortages=task_refresh.shortages,status=task_refresh.status,revision=revision+1,updated_at=now() where id=t.id and user_id=p_user_id;
  end if;
  return jsonb_build_object('mealTaskStatus',status,'remainingShortages',coalesce((select jsonb_agg(s) from jsonb_array_elements(shortages) s where s->>'resolution' not in ('bought','replaced')),'[]'::jsonb),'nextActions',case when status='ready' then '["return_to_task","start_cooking"]'::jsonb else '["continue_shopping","return_to_task"]'::jsonb end);
end $$;
revoke all on function public.refresh_shopping_task_v2(uuid,uuid) from public,anon,authenticated;
grant execute on function public.refresh_shopping_task_v2(uuid,uuid) to service_role;

create or replace function public.restock_checked_shopping_v2(
  p_user_id uuid,
  p_operation_id uuid,
  p_items jsonb,
  p_meal_task_id uuid default null,
  p_shortage_revision bigint default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_prior jsonb;
  v_request jsonb := jsonb_build_object('items',p_items,'task',p_meal_task_id,'revision',p_shortage_revision);
  v_entry jsonb;
  v_item record;
  v_task record;
  v_shortage jsonb;
  v_shortages jsonb;
  v_bought record;
  v_moved integer := 0;
  v_needed numeric;
  v_take numeric;
  v_location text;
  v_status text;
  v_result jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 4188));
  if exists(select 1 from public.restock_operations where user_id=p_user_id and operation_id=p_operation_id and request <> v_request) then raise exception 'OPERATION_CONFLICT'; end if;
  select result into v_prior from public.restock_operations where user_id = p_user_id and operation_id = p_operation_id;
  if found then
    return jsonb_set(v_prior, '{replayed}', 'true'::jsonb);
  end if;

  if p_meal_task_id is not null then
    select * into v_task from public.meal_tasks where id=p_meal_task_id and user_id=p_user_id for update;
    if not found then raise exception 'MEAL_TASK_NOT_FOUND'; end if;
    if p_shortage_revision is null or v_task.revision <> p_shortage_revision then raise exception 'MEAL_TASK_REVISION_CONFLICT'; end if;
    if v_task.status not in ('needs_shopping','ready') then raise exception 'MEAL_TASK_NOT_ACTIVE'; end if;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'PURCHASE_ITEMS_REQUIRED'; end if;
  if (select count(*) from jsonb_array_elements(p_items)) <> (select count(distinct item->>'shopping_item_id') from jsonb_array_elements(p_items) item) then raise exception 'DUPLICATE_SHOPPING_ITEM'; end if;
  create temporary table if not exists pg_temp.restock_bought(
    shopping_item_id uuid, shortage_id text, name text, unit text, remaining numeric
  ) on commit drop;

  truncate pg_temp.restock_bought;

  for v_entry in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    select * into v_item from public.shopping_items where id = (v_entry->>'shopping_item_id')::uuid and user_id = p_user_id for update;
    if not found then raise exception 'SHOPPING_ITEM_NOT_FOUND'; end if;
    if not v_item.checked then raise exception 'SHOPPING_ITEM_NOT_CHECKED'; end if;
    if (v_entry->>'actual_quantity')::numeric <= 0 or nullif(trim(v_entry->>'actual_unit'),'') is null then raise exception 'INVALID_PURCHASE'; end if;
    if v_item.shortage_id is distinct from nullif(v_entry->>'shortage_id','') then raise exception 'SHORTAGE_LINK_CONFLICT'; end if;
    if v_item.shortage_id is not null then
      if p_meal_task_id is null then raise exception 'MEAL_TASK_REQUIRED'; end if;
      select value into v_shortage from jsonb_array_elements(v_task.shortages) where value->>'id'=v_item.shortage_id;
      if not found or v_shortage->>'resolution' not in ('needed','unavailable') then raise exception 'SHORTAGE_NOT_ACTIVE'; end if;
      if nullif(v_entry->>'expires_on','') is null then raise exception 'EXPIRY_REQUIRED'; end if;
      if (v_entry->>'expires_on')::date < timezone('Asia/Taipei',now())::date then raise exception 'EXPIRED_PURCHASE'; end if;
      if v_entry->>'actual_unit' <> v_shortage->>'unit' then raise exception 'UNIT_CONFIRMATION_REQUIRED'; end if;
    end if;
    v_location := v_entry->>'storage_location';
    if v_location not in ('cold','frozen','pantry') then raise exception 'STORAGE_CONFIRMATION_REQUIRED'; end if;
    insert into public.inventory_batches(user_id, name, ingredient_key, quantity, unit, location, unit_cost, purchased_on, expires_on, last_confirmed_at)
    values (p_user_id, v_item.name, v_item.ingredient_key, (v_entry->>'actual_quantity')::numeric, v_entry->>'actual_unit', v_location,
      case when (v_entry->>'actual_quantity')::numeric > 0 and (v_entry->>'actual_price') is not null
        then (v_entry->>'actual_price')::numeric / (v_entry->>'actual_quantity')::numeric else 0 end,
      current_date, nullif(v_entry->>'expires_on', '')::date, now());
    delete from public.shopping_items where id = v_item.id and user_id = p_user_id;
    insert into pg_temp.restock_bought(shopping_item_id, shortage_id, name, unit, remaining)
    values (v_item.id, v_item.shortage_id, lower(v_item.name), v_entry->>'actual_unit', (v_entry->>'actual_quantity')::numeric);
    v_moved := v_moved + 1;
  end loop;

  if p_meal_task_id is not null then
    v_result:=public.refresh_shopping_task_v2(p_user_id,p_meal_task_id)||jsonb_build_object('operationId',p_operation_id,'replayed',false,'count',v_moved);
  end if;

  if v_result is null then
    v_result := jsonb_build_object(
      'operationId', p_operation_id,
      'replayed', false,
      'count', v_moved,
      'remainingShortages', '[]'::jsonb,
      'nextActions', '["continue_shopping"]'::jsonb
    );
  end if;

  insert into public.restock_operations(user_id, operation_id, request, result)
  values (p_user_id, p_operation_id, v_request, v_result)
  on conflict (user_id, operation_id) do nothing;
  return v_result;
end $$;
revoke all on function public.restock_checked_shopping_v2(uuid, uuid, jsonb, uuid, bigint) from public, anon, authenticated;
grant execute on function public.restock_checked_shopping_v2(uuid, uuid, jsonb, uuid, bigint) to service_role;

alter table public.restock_operations enable row level security;
revoke all on public.restock_operations from public, anon, authenticated;
grant all on public.restock_operations to service_role;
create unique index shopping_items_shortage_unique on public.shopping_items(user_id, shortage_id) where shortage_id is not null;

-- One atomic CAS for shortage decisions, linked list entries and a confirmed recipe.
create function public.resolve_shopping_shortage_v2(p_user_id uuid,p_task_id uuid,p_revision bigint,p_operation_id uuid,p_request jsonb,p_shortages jsonb,p_status text,p_recipe jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
<<resolution>>
declare t public.meal_tasks; prior public.restock_operations; result jsonb; recipe_id uuid; sh jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,4188));
  select * into prior from public.restock_operations where user_id=p_user_id and operation_id=p_operation_id;
  if found then
    if prior.request<>p_request then raise exception 'OPERATION_CONFLICT'; end if;
    return prior.result;
  end if;
  select * into t from public.meal_tasks where id=p_task_id and user_id=p_user_id for update;
  if not found then raise exception 'MEAL_TASK_NOT_FOUND'; end if;
  if t.revision<>p_revision then raise exception 'MEAL_TASK_REVISION_CONFLICT'; end if;
  if t.status<>'needs_shopping' then raise exception 'MEAL_TASK_NOT_ACTIVE'; end if;
  if p_recipe is not null then
    recipe_id:=extensions.gen_random_uuid();
    insert into public.recipes(id,user_id,title,servings,prep_minutes,total_minutes,cookware_types,ingredients,steps,safety_reviewed,source)
    values(recipe_id,p_user_id,p_recipe->>'title',(p_recipe->>'servings')::int,(p_recipe->>'prepMinutes')::int,(p_recipe->>'totalMinutes')::int,array(select jsonb_array_elements_text(p_recipe->'cookwareTypes')),p_recipe->'ingredients',p_recipe->'steps',false,'openrouter');
  end if;
  update public.meal_tasks set recipe_id=coalesce(resolution.recipe_id,t.recipe_id),shortages=p_shortages,status=p_status,revision=revision+1,updated_at=now() where id=t.id and user_id=p_user_id;
  -- Replanning detaches the shopping rows, preserving already selected purchases.
  if p_status='needs_replan' or p_recipe is not null then
    update public.shopping_items set shortage_id=null,source='manual',status='一般採買' where user_id=p_user_id and shortage_id in(select value->>'id' from jsonb_array_elements(t.shortages));
  end if;
  result:=jsonb_build_object('id',t.id,'revision',t.revision+1,'status',p_status);
  insert into public.restock_operations(user_id,operation_id,request,result) values(p_user_id,p_operation_id,p_request,result);
  return result;
end $$;
revoke all on function public.resolve_shopping_shortage_v2(uuid,uuid,bigint,uuid,jsonb,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.resolve_shopping_shortage_v2(uuid,uuid,bigint,uuid,jsonb,jsonb,text,jsonb) to service_role;

-- Receipt intake shares the same task recalculation, within the receipt transaction.
alter function public.confirm_receipt_and_restock(uuid,uuid,jsonb) rename to confirm_receipt_and_restock_before_shopping_v2;
create function public.confirm_receipt_and_restock(p_user_id uuid,p_receipt_id uuid,p_items jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare t record; receipt_state text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,4188));
  select status::text into receipt_state from public.receipts where id=p_receipt_id and user_id=p_user_id for update;
  if receipt_state='confirmed' then return; end if;
  perform public.confirm_receipt_and_restock_before_shopping_v2(p_user_id,p_receipt_id,p_items);
  update public.inventory_batches set last_confirmed_at=now() where user_id=p_user_id and source_receipt_item_id in(select id from public.receipt_items where receipt_id=p_receipt_id and user_id=p_user_id);
  for t in select id from public.meal_tasks where user_id=p_user_id and status in ('needs_shopping','ready') order by id loop
    perform public.refresh_shopping_task_v2(p_user_id,t.id);
  end loop;
end $$;
revoke all on function public.confirm_receipt_and_restock(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.confirm_receipt_and_restock(uuid,uuid,jsonb) to service_role;
revoke all on function public.confirm_receipt_and_restock_before_shopping_v2(uuid,uuid,jsonb) from public,anon,authenticated,service_role;
