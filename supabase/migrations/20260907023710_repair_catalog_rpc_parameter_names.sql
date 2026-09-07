-- PostgREST resolves RPC calls by JSON argument name. The original narrow public
-- wrappers used positional arguments, so supabase-js named calls could not find
-- them even though the functions existed. Keep the private implementations and
-- recreate only the service-role wrappers with their API parameter names.
drop function if exists public.save_recipe_preferences(uuid,integer,integer);
drop function if exists public.record_recipe_demand(text,jsonb);
drop function if exists public.schedule_recipe_jobs(date,jsonb);
drop function if exists public.reserve_recipe_usage(uuid,uuid,uuid,text,numeric,jsonb);
drop function if exists public.publish_catalog_version(uuid,uuid,uuid);
drop function if exists public.report_catalog_recipe(uuid,uuid,boolean,text);
drop function if exists public.add_recipe_purchases(uuid,uuid,jsonb);
drop function if exists public.replace_meal_plan(uuid,jsonb);
drop function if exists public.complete_cooking_transaction(uuid,uuid,jsonb,jsonb,integer,integer,integer,integer,boolean);
drop function if exists public.request_catalog_revision(uuid);

create function public.save_recipe_preferences(p_user_id uuid,p_budget integer,p_expected integer) returns jsonb language sql security invoker set search_path='' as $$ select private.save_recipe_preferences(p_user_id,p_budget,p_expected) $$;
create function public.record_recipe_demand(p_signature text,p_context jsonb) returns void language sql security invoker set search_path='' as $$ select private.record_recipe_demand(p_signature,p_context) $$;
create function public.schedule_recipe_jobs(p_week date,p_contexts jsonb) returns integer language sql security invoker set search_path='' as $$ select private.schedule_recipe_jobs(p_week,p_contexts) $$;
create function public.reserve_recipe_usage(p_id uuid,p_job uuid,p_lease uuid,p_purpose text,p_max numeric,p_rate jsonb) returns void language sql security invoker set search_path='' as $$ select private.reserve_recipe_usage(p_id,p_job,p_lease,p_purpose,p_max,p_rate) $$;
create function public.publish_catalog_version(p_version uuid,p_job uuid,p_lease uuid) returns void language sql security invoker set search_path='' as $$ select private.publish_catalog_version(p_version,p_job,p_lease) $$;
create function public.report_catalog_recipe(p_user uuid,p_version uuid,p_safety boolean,p_message text) returns void language sql security invoker set search_path='' as $$ select private.report_catalog_recipe(p_user,p_version,p_safety,p_message) $$;
create function public.add_recipe_purchases(p_user uuid,p_operation uuid,p_items jsonb) returns void language sql security invoker set search_path='' as $$ select private.add_recipe_purchases(p_user,p_operation,p_items) $$;
create function public.replace_meal_plan(p_user_id uuid,p_plan jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.replace_meal_plan(p_user_id,p_plan) $$;
create function public.complete_cooking_transaction(p_user_id uuid,p_operation_id uuid,p_recipe jsonb,p_requirements jsonb,p_home_cook_cost integer,p_confirmed_savings integer,p_servings_cooked integer,p_servings_eaten integer,p_vegetables boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.complete_cooking_transaction(p_user_id,p_operation_id,p_recipe,p_requirements,p_home_cook_cost,p_confirmed_savings,p_servings_cooked,p_servings_eaten,p_vegetables) $$;
create function public.request_catalog_revision(p_version uuid) returns void language sql security invoker set search_path='' as $$ select private.request_catalog_revision(p_version) $$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('save_recipe_preferences','record_recipe_demand','schedule_recipe_jobs','reserve_recipe_usage','publish_catalog_version','report_catalog_recipe','add_recipe_purchases','replace_meal_plan','complete_cooking_transaction','request_catalog_revision') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;

notify pgrst, 'reload schema';
