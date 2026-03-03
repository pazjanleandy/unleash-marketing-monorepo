-- Core marketing schema
create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  name text not null,
  slug text unique,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  metadata jsonb default '{}'::jsonb,
  position integer default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  product_id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  prodname text not null,
  status text not null default 'avail',
  quantity integer not null default 0,
  image text,
  description text,
  price numeric default 0 check (price >= 0),
  currency text default 'USD',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  category_id uuid references public.categories(id)
);

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  min_spend numeric default 0,
  max_discount numeric,
  usage_limit integer check (usage_limit is null or usage_limit >= 0),
  used_count integer default 0 check (used_count >= 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint vouchers_time_range_check check (end_at > start_at)
);

create table if not exists public.voucher_products (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  product_id uuid not null references public.products(product_id) on delete cascade
);

create table if not exists public.voucher_usages (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  order_id uuid,
  used_at timestamptz default now()
);

create table if not exists public.product_discounts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(product_id),
  shop_id uuid not null references public.shops(id),
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  max_uses integer check (max_uses is null or max_uses >= 0),
  used_count integer default 0 check (used_count >= 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint product_discounts_time_range_check check (end_at > start_at)
);

create table if not exists public.flash_deals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(product_id),
  shop_id uuid not null references public.shops(id),
  flash_price numeric not null check (flash_price > 0),
  original_price numeric not null check (original_price > 0),
  flash_quantity integer not null check (flash_quantity > 0),
  sold_quantity integer default 0 check (sold_quantity >= 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint flash_deals_time_range_check check (end_at > start_at)
);

create unique index if not exists voucher_products_voucher_product_key
  on public.voucher_products(voucher_id, product_id);

create index if not exists shops_owner_id_idx
  on public.shops(owner_id);

create index if not exists products_shop_category_idx
  on public.products(shop_id, category_id);

create index if not exists vouchers_shop_active_time_idx
  on public.vouchers(shop_id, is_active, start_at, end_at);

create index if not exists product_discounts_shop_active_time_idx
  on public.product_discounts(shop_id, is_active, start_at, end_at);

create index if not exists flash_deals_shop_active_time_idx
  on public.flash_deals(shop_id, is_active, start_at, end_at);

create index if not exists voucher_usages_voucher_user_idx
  on public.voucher_usages(voucher_id, user_id);
