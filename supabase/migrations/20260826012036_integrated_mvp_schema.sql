create extension if not exists pgcrypto with schema extensions;

create type public.invite_status as enum ('invited', 'accepted', 'revoked');
create type public.receipt_status as enum ('uploaded', 'recognizing', 'needs_review', 'confirmed', 'failed');
create type public.operation_status as enum ('pending', 'synced', 'conflict');

create table public.beta_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  email text not null,
  status public.invite_status not null default 'invited',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint beta_invites_email_lowercase check (email = lower(email))
);
create unique index beta_invites_active_email_idx on public.beta_invites (lower(email)) where status <> 'revoked';

create table public.app_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('member', 'owner')),
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  household_servings smallint not null default 1 check (household_servings between 1 and 12),
  daily_meal_budget integer not null default 0 check (daily_meal_budget >= 0),
  outside_meal_price integer not null default 0 check (outside_meal_price >= 0),
  weekly_home_cook_target smallint not null default 3 check (weekly_home_cook_target between 1 and 21),
  onboarding_status text not null default 'draft' check (onboarding_status in ('draft', 'complete')),
  onboarding_step smallint not null default 1 check (onboarding_step between 1 and 10),
  planned_meal_slots text[] not null default array['dinner']::text[],
  preferred_flavors text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.cookware (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, capacity text, limitations text[] not null default '{}', created_at timestamptz not null default now()
);
create index cookware_user_idx on public.cookware(user_id);
create table public.fridge_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade, brand text not null default '', model text not null default '',
  capacity_liters integer not null default 0 check(capacity_liters>=0), cold_ratio numeric(4,3) not null default .6 check(cold_ratio between 0 and 1),
  is_configured boolean not null default false, updated_at timestamptz not null default now()
);

create table public.dietary_restrictions (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  label text not null, kind text not null check (kind in ('allergy','avoid','preference')),
  ingredient_keys text[] not null default '{}', is_hard_limit boolean not null, created_at timestamptz not null default now()
);
create index dietary_restrictions_user_idx on public.dietary_restrictions(user_id, is_hard_limit);

create table public.goals (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, target_amount integer not null check (target_amount > 0), status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(), completed_at timestamptz
);
create index goals_user_status_idx on public.goals(user_id, status);

create table public.inventory_batches (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, ingredient_key text not null, quantity numeric(12,3) not null check (quantity >= 0), unit text not null,
  location text not null check (location in ('cold','frozen','pantry','prepared')),
  unit_cost numeric(12,4) not null default 0 check (unit_cost >= 0), purchased_on date, expires_on date,
  source_receipt_item_id uuid, version bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index inventory_user_expiry_idx on public.inventory_batches(user_id, expires_on) where quantity > 0;

create table public.shopping_items (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, ingredient_key text not null, quantity numeric(12,3) not null check (quantity > 0), unit text not null,
  category text not null default 'other' check (category in ('produce','protein','pantry','other')),
  estimated_cost integer not null default 0 check (estimated_cost >= 0), checked boolean not null default false,
  status text not null default 'needed', position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index shopping_items_user_status_idx on public.shopping_items(user_id, status, position);

create table public.meal_plans (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, overlap_rate numeric(5,4) not null default 0, inventory_coverage_rate numeric(5,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, week_start)
);
create index meal_plans_user_week_idx on public.meal_plans(user_id, week_start desc);

create table public.recipes (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  title text not null, servings smallint not null check (servings > 0), prep_minutes smallint not null default 0,
  total_minutes smallint not null check (total_minutes > 0), cookware_types text[] not null default '{}', ingredients jsonb not null,
  steps jsonb not null, image_path text, safety_reviewed boolean not null default false, source text not null check (source in ('gemini','brand_safe')),
  created_at timestamptz not null default now()
);
create index recipes_user_created_idx on public.recipes(user_id, created_at desc);

create table public.planned_meals (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade, recipe_id uuid not null references public.recipes(id),
  planned_date date not null, meal_slot text not null check (meal_slot in ('breakfast','lunch','dinner')),
  status text not null default 'planned' check (status in ('planned','postponed','cancelled','cooked')), servings smallint not null check (servings > 0),
  estimated_cost integer not null check (estimated_cost >= 0), energy_level text not null check (energy_level in ('low','normal')), created_at timestamptz not null default now()
);
create index planned_meals_user_date_idx on public.planned_meals(user_id, planned_date, meal_slot);

create table public.receipts (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  purchased_on date, original_image_path text not null, status public.receipt_status not null default 'uploaded',
  recognition_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index receipts_user_created_idx on public.receipts(user_id, created_at desc);

create table public.receipt_items (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  receipt_id uuid not null references public.receipts(id) on delete cascade, name text not null, quantity numeric(12,3) not null check (quantity > 0),
  unit text not null, unit_price integer not null check (unit_price >= 0), actual_price integer not null check (actual_price >= 0),
  storage_location text check (storage_location in ('cold','frozen','pantry')), expires_on date, confidence jsonb not null,
  confirmed boolean not null default false, created_at timestamptz not null default now()
);
create index receipt_items_user_receipt_idx on public.receipt_items(user_id, receipt_id);
alter table public.inventory_batches add constraint inventory_receipt_item_fk foreign key(source_receipt_item_id) references public.receipt_items(id) on delete set null;

create table public.cooking_sessions (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null, recipe_id uuid not null references public.recipes(id), status text not null check (status in ('active','completed','needs_sync')),
  servings_cooked smallint not null check (servings_cooked > 0), current_step smallint not null default 0,
  started_at timestamptz not null default now(), completed_at timestamptz, unique(user_id, operation_id)
);
create index cooking_sessions_user_status_idx on public.cooking_sessions(user_id, status, started_at desc);

create table public.meal_servings (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  cooking_session_id uuid not null references public.cooking_sessions(id) on delete cascade,
  status text not null check (status in ('eaten','prepared_inventory')), vegetable_keys text[] not null default '{}', eaten_at timestamptz, created_at timestamptz not null default now()
);
create index meal_servings_user_eaten_idx on public.meal_servings(user_id, eaten_at desc);

create table public.savings_events (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id), cooking_session_id uuid not null unique references public.cooking_sessions(id),
  outside_meal_price integer not null check (outside_meal_price >= 0), actual_ingredient_cost integer not null check (actual_ingredient_cost >= 0),
  confirmed_amount integer not null check (confirmed_amount >= 0), created_at timestamptz not null default now()
);
create index savings_events_user_created_idx on public.savings_events(user_id, created_at desc);

create table public.offline_operations (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, kind text not null, payload jsonb not null,
  status public.operation_status not null default 'pending', created_at timestamptz not null default now(), synced_at timestamptz
);
create index offline_operations_user_status_idx on public.offline_operations(user_id, status, created_at);

create table public.sync_conflicts (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null references public.offline_operations(id), kind text not null, message text not null,
  created_at timestamptz not null default now(), resolved_at timestamptz
);
create index sync_conflicts_user_unresolved_idx on public.sync_conflicts(user_id, created_at) where resolved_at is null;

create table public.ai_usage_events (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('receipt_ocr','recipe_generation','shopping_analysis')),
  status text not null check (status in ('started','succeeded','failed','rate_limited')), model text not null,
  input_bytes integer not null default 0 check (input_bytes >= 0), created_at timestamptz not null default now()
);
create index ai_usage_user_feature_idx on public.ai_usage_events(user_id, feature, created_at desc);

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.app_roles where user_id = (select auth.uid()) and role = 'owner') $$;

create or replace function public.before_user_created(event jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare invited boolean;
begin
  select exists(select 1 from public.beta_invites where email = lower(event->'user'->>'email') and status = 'invited') into invited;
  if invited then return '{}'::jsonb; end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'CooCoo 封閉測試目前只接受受邀 Email'));
end;
$$;
revoke all on function public.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.before_user_created(jsonb) to supabase_auth_admin;

alter table public.beta_invites enable row level security;
alter table public.app_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.cookware enable row level security;
alter table public.fridge_profiles enable row level security;
alter table public.dietary_restrictions enable row level security;
alter table public.goals enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.shopping_items enable row level security;
alter table public.meal_plans enable row level security;
alter table public.recipes enable row level security;
alter table public.planned_meals enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;
alter table public.cooking_sessions enable row level security;
alter table public.meal_servings enable row level security;
alter table public.savings_events enable row level security;
alter table public.offline_operations enable row level security;
alter table public.sync_conflicts enable row level security;
alter table public.ai_usage_events enable row level security;

create policy "owners manage beta invites" on public.beta_invites for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "members read own role" on public.app_roles for select to authenticated using (user_id = (select auth.uid()));
create policy "owners manage roles" on public.app_roles for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','cookware','fridge_profiles','dietary_restrictions','goals','inventory_batches','shopping_items','meal_plans','planned_meals','receipts','receipt_items','cooking_sessions','meal_servings','savings_events','offline_operations','sync_conflicts']
  loop
    execute format('create policy "members own %1$s" on public.%1$I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', table_name);
  end loop;
end $$;
create policy "members read own ai usage" on public.ai_usage_events for select to authenticated using (user_id = (select auth.uid()));
create policy "members read own and safe brand recipes" on public.recipes for select to authenticated using (user_id = (select auth.uid()) or (user_id is null and source = 'brand_safe' and safety_reviewed));
create policy "members write own recipes" on public.recipes for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.cookware, public.fridge_profiles, public.dietary_restrictions, public.goals, public.inventory_batches, public.shopping_items, public.meal_plans, public.planned_meals, public.recipes, public.receipts, public.receipt_items, public.cooking_sessions, public.meal_servings, public.savings_events, public.offline_operations, public.sync_conflicts to authenticated;
grant select on public.ai_usage_events to authenticated;
grant select on public.app_roles to authenticated;
grant select, insert, update, delete on public.beta_invites, public.app_roles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipt-images', 'receipt-images', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "members upload receipt images" on storage.objects for insert to authenticated
with check (bucket_id = 'receipt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "members read receipt images" on storage.objects for select to authenticated
using (bucket_id = 'receipt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "members update receipt images" on storage.objects for update to authenticated
using (bucket_id = 'receipt-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'receipt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "members delete receipt images" on storage.objects for delete to authenticated
using (bucket_id = 'receipt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.confirm_receipt_and_restock(p_user_id uuid, p_receipt_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare item jsonb;
begin
  if not exists(select 1 from public.receipts where id = p_receipt_id and user_id = p_user_id and status = 'needs_review') then
    raise exception 'RECEIPT_NOT_READY';
  end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'RECEIPT_ITEMS_REQUIRED'; end if;
  for item in select * from jsonb_array_elements(p_items)
  loop
    update public.receipt_items set
      name = item->>'name', quantity = (item->>'quantity')::numeric, unit = item->>'unit',
      unit_price = (item->>'unitPrice')::integer, actual_price = (item->>'actualPrice')::integer,
      storage_location = item->>'storageLocation', expires_on = nullif(item->>'expiresOn','')::date, confirmed = true
    where id = (item->>'id')::uuid and receipt_id = p_receipt_id and user_id = p_user_id;
    if not found then raise exception 'RECEIPT_ITEM_NOT_FOUND'; end if;
    insert into public.inventory_batches(user_id, name, ingredient_key, quantity, unit, location, unit_cost, purchased_on, expires_on, source_receipt_item_id)
    values(p_user_id, item->>'name', lower(item->>'name'), (item->>'quantity')::numeric, item->>'unit', item->>'storageLocation',
      case when (item->>'quantity')::numeric > 0 then (item->>'actualPrice')::numeric / (item->>'quantity')::numeric else 0 end,
      (select purchased_on from public.receipts where id = p_receipt_id), nullif(item->>'expiresOn','')::date, (item->>'id')::uuid);
  end loop;
  update public.receipts set status = 'confirmed', updated_at = now() where id = p_receipt_id and user_id = p_user_id;
end;
$$;
revoke all on function public.confirm_receipt_and_restock(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.confirm_receipt_and_restock(uuid,uuid,jsonb) to service_role;

create or replace function public.save_onboarding_profile(p_user_id uuid, p_profile jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare item jsonb;
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
  if not exists(select 1 from public.goals where user_id=p_user_id and status='active') then
    insert into public.goals(user_id,name,target_amount) values(p_user_id,p_profile->>'dreamName',(p_profile->>'dreamTargetAmount')::integer);
  end if;
  update public.beta_invites set status='accepted',accepted_at=coalesce(accepted_at,now()) where email=(select lower(email) from auth.users where id=p_user_id) and status='invited';
end;
$$;
revoke all on function public.save_onboarding_profile(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.save_onboarding_profile(uuid,jsonb) to service_role;

create or replace function public.restock_checked_shopping(p_user_id uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare item record; moved integer := 0;
begin
  for item in select * from public.shopping_items where user_id=p_user_id and checked order by id for update
  loop
    insert into public.inventory_batches(user_id,name,ingredient_key,quantity,unit,location,unit_cost,purchased_on)
    values(p_user_id,item.name,item.ingredient_key,item.quantity,item.unit,case when item.category='pantry' then 'pantry' else 'cold' end,
      case when item.quantity>0 then item.estimated_cost/item.quantity else 0 end,current_date);
    delete from public.shopping_items where id=item.id and user_id=p_user_id;
    moved := moved + 1;
  end loop;
  return moved;
end;
$$;
revoke all on function public.restock_checked_shopping(uuid) from public, anon, authenticated;
grant execute on function public.restock_checked_shopping(uuid) to service_role;

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
  values(p_operation_id,p_user_id,'cooking_complete',jsonb_build_object('sessionId',session_id),case when has_conflict then 'conflict' else 'synced' end,now());
  if has_conflict then
    insert into public.sync_conflicts(user_id,operation_id,kind,message) values(p_user_id,p_operation_id,'inventory_shortage','料理已保留，但另一裝置的庫存不足；未產生負庫存，請確認實際用量。');
  end if;
  return jsonb_build_object('accepted',true,'sessionId',session_id,'hasConflict',has_conflict);
end;
$$;
revoke all on function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) from public,anon,authenticated;
grant execute on function public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean) to service_role;

create or replace function public.replace_cookware(p_user_id uuid,p_items jsonb)
returns void language plpgsql security definer set search_path='' as $$ declare item jsonb; begin
  delete from public.cookware where user_id=p_user_id;
  for item in select * from jsonb_array_elements(p_items) loop
    insert into public.cookware(id,user_id,type,capacity,limitations) values(coalesce((item->>'id')::uuid,extensions.gen_random_uuid()),p_user_id,item->>'type',nullif(item->>'capacity',''),array(select jsonb_array_elements_text(coalesce(item->'limitations','[]'::jsonb))));
  end loop;
end $$;
revoke all on function public.replace_cookware(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.replace_cookware(uuid,jsonb) to service_role;
