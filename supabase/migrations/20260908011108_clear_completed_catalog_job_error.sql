create or replace function private.publish_catalog_version(p_version uuid,p_job uuid,p_lease uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 perform pg_advisory_xact_lock(hashtext('recipe-catalog-publish'));
 if (select paused from public.recipe_catalog_control where id) then raise exception 'CATALOG_PAUSED';end if;
 if not exists(select 1 from public.recipe_catalog_jobs where id=p_job and lease_token=p_lease and status='running' and lease_until>now()) then raise exception 'JOB_LEASE_LOST';end if;
 if not exists(select 1 from public.recipe_catalog_reviews where version_id=p_version and reviewer='rules' and result->>'pass'='true') or not exists(select 1 from public.recipe_catalog_reviews where version_id=p_version and reviewer='quality' and result->>'pass'='true') or not exists(select 1 from public.recipe_catalog_reviews where version_id=p_version and reviewer='safety' and result->>'pass'='true') then raise exception 'REVIEW_REQUIRED';end if;
 update public.recipe_catalog_versions set status='published',published_at=now() where id=p_version and status='candidate';
 if not found then raise exception 'CATALOG_NOT_CANDIDATE';end if;
 update public.recipe_catalog_jobs set status='completed',version_id=p_version,lease_until=null,error=null where id=p_job;
 insert into public.recipe_catalog_events(version_id,kind) values(p_version,'published');
end $$;

update public.recipe_catalog_jobs set error=null where status='completed' and error is not null;

notify pgrst, 'reload schema';
