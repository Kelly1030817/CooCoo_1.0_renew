-- CooCoo 煮煮 - Database Schema Blueprint (PostgreSQL / Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (使用者帳號與目標進度)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT,
    avatar_url TEXT,
    savings_target NUMERIC DEFAULT 60000,
    savings_saved NUMERIC DEFAULT 0,
    savings_monthly_saved NUMERIC DEFAULT 0,
    sodium_reduced_mg NUMERIC DEFAULT 0,
    fat_reduced_g NUMERIC DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies for profiles
DROP POLICY IF EXISTS "Users can read own profile." ON public.profiles;
CREATE POLICY "Users can read own profile." ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);


-- 2. INVENTORY TABLE (冰箱食材庫存)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    chamber TEXT NOT NULL CHECK (chamber IN ('cold', 'frozen')),
    qty NUMERIC NOT NULL DEFAULT 1,
    unit TEXT DEFAULT '個',
    days_left INTEGER NOT NULL DEFAULT 7,
    image_url TEXT,
    added_date DATE DEFAULT CURRENT_DATE,
    savings_reward NUMERIC DEFAULT 50,
    sodium_mg NUMERIC DEFAULT 100,
    fat_g NUMERIC DEFAULT 5,
    storage_protocol TEXT,
    box_size TEXT DEFAULT 'M'
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies for inventory
DROP POLICY IF EXISTS "Users can manage own inventory." ON public.inventory;
CREATE POLICY "Users can manage own inventory." ON public.inventory
    FOR ALL USING (auth.uid() = user_id);


-- 3. SHOPPING LIST TABLE (待採買清單)
CREATE TABLE IF NOT EXISTS public.shopping_list (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('produce', 'protein', 'pantry', 'other')),
    qty NUMERIC NOT NULL DEFAULT 1,
    unit TEXT DEFAULT '包',
    checked BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT '手動新增',
    est_cost NUMERIC DEFAULT 50
);

-- Enable RLS
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies for shopping_list
DROP POLICY IF EXISTS "Users can manage own shopping list." ON public.shopping_list;
CREATE POLICY "Users can manage own shopping list." ON public.shopping_list
    FOR ALL USING (auth.uid() = user_id);


-- 4. COOKED HISTORY TABLE (烹飪與 Plan B 歷史記錄)
CREATE TABLE IF NOT EXISTS public.cooked_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cooked_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recipe_title TEXT NOT NULL,
    ingredients_used JSONB, -- list of ingredient names and quantities used
    type TEXT DEFAULT 'meal' CHECK (type IN ('meal', 'plan_b_blend', 'plan_b_bake', 'plan_b_boil')),
    savings_saved NUMERIC DEFAULT 0,
    sodium_reduced_mg NUMERIC DEFAULT 0,
    fat_reduced_g NUMERIC DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.cooked_history ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies for cooked_history
DROP POLICY IF EXISTS "Users can read own history." ON public.cooked_history;
CREATE POLICY "Users can read own history." ON public.cooked_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own history." ON public.cooked_history;
CREATE POLICY "Users can insert own history." ON public.cooked_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. AUTOMATIC PROFILE CREATION TRIGGER
-- When a user registers in auth.users, automatically create a row in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url, savings_target, savings_saved)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 60000, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
