-- Cover catalog foreign keys used by joins, cleanup and operational review.
create index recipes_catalog_version_idx on public.recipes(catalog_version_id) where catalog_version_id is not null;
create index recipe_catalog_jobs_version_idx on public.recipe_catalog_jobs(version_id) where version_id is not null;
create index recipe_catalog_usage_job_idx on public.recipe_catalog_usage(job_id) where job_id is not null;
create index recipe_catalog_events_version_idx on public.recipe_catalog_events(version_id) where version_id is not null;
create index recipe_catalog_events_actor_idx on public.recipe_catalog_events(actor_id) where actor_id is not null;
create index recipe_catalog_reports_user_idx on public.recipe_catalog_reports(user_id);
