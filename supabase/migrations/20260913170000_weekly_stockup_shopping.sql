-- Link a confirmed weekly meal plan to one idempotent, editable shopping list.

alter table public.shopping_items
  add column if not exists meal_plan_id uuid references public.meal_plans(id) on delete cascade;

alter table public.shopping_items drop constraint if exists shopping_items_source_check;
alter table public.shopping_items
  add constraint shopping_items_source_check check (source in ('manual','voice','assistant','task','receipt','plan'));

create unique index if not exists shopping_items_weekly_plan_ingredient_idx
  on public.shopping_items(user_id,meal_plan_id,ingredient_key,unit);
