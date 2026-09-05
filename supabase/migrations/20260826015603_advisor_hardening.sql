create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_owner()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.app_roles where user_id=(select auth.uid()) and role='owner') $$;
revoke all on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

drop policy "owners manage beta invites" on public.beta_invites;
create policy "owners manage beta invites" on public.beta_invites for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));

drop policy "members read own role" on public.app_roles;
drop policy "owners manage roles" on public.app_roles;
create policy "members read permitted roles" on public.app_roles for select to authenticated using (user_id=(select auth.uid()) or (select private.is_owner()));
create policy "owners insert roles" on public.app_roles for insert to authenticated with check ((select private.is_owner()));
create policy "owners update roles" on public.app_roles for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owners delete roles" on public.app_roles for delete to authenticated using ((select private.is_owner()));

drop policy "members write own recipes" on public.recipes;
create policy "members insert own recipes" on public.recipes for insert to authenticated with check (user_id=(select auth.uid()));
create policy "members update own recipes" on public.recipes for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "members delete own recipes" on public.recipes for delete to authenticated using (user_id=(select auth.uid()));

revoke all on function public.is_owner() from public, anon, authenticated;
drop function public.is_owner();

create index beta_invites_invited_by_idx on public.beta_invites(invited_by);
create index cooking_sessions_recipe_idx on public.cooking_sessions(recipe_id);
create index inventory_receipt_item_idx on public.inventory_batches(source_receipt_item_id);
create index meal_servings_session_idx on public.meal_servings(cooking_session_id);
create index planned_meals_plan_idx on public.planned_meals(meal_plan_id);
create index planned_meals_recipe_idx on public.planned_meals(recipe_id);
create index receipt_items_receipt_idx on public.receipt_items(receipt_id);
create index savings_events_goal_idx on public.savings_events(goal_id);
create index sync_conflicts_operation_idx on public.sync_conflicts(operation_id);
