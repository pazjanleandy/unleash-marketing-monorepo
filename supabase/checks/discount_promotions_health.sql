-- Run this in Supabase SQL Editor against the same project used by VITE_SUPABASE_URL.

-- 1) Verify discount_promotions table exists.
select to_regclass('public.discount_promotions') as discount_promotions_table;

-- 2) Verify product_discounts.promotion_id exists.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'product_discounts'
  and column_name = 'promotion_id';

-- 3) Verify RLS policies exist.
select
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('discount_promotions', 'product_discounts')
order by tablename, policyname;

-- 4) Verify RLS is enabled.
select
  relname,
  relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('discount_promotions', 'product_discounts')
order by relname;
