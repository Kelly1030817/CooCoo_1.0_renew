-- The fridge experience manages cooking inventory only. Physical appliance
-- capacity, brand, model, and cold/frozen ratios are intentionally not tracked.
drop table if exists public.fridge_profiles;
