-- Bundle Deal + Add-on Deal schema for discount module.

create table if not exists public.bundle_deals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'bundle_price')),
  discount_value numeric not null check (discount_value > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  max_uses integer check (max_uses is null or max_uses >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint bundle_deals_time_range_check check (end_at > start_at),
  constraint bundle_deals_percentage_limit_check check (
    discount_type <> 'percentage' or discount_value <= 100
  )
);

create table if not exists public.bundle_deal_items (
  id uuid primary key default gen_random_uuid(),
  bundle_deal_id uuid not null references public.bundle_deals(id) on delete cascade,
  product_id uuid not null references public.products(product_id) on delete cascade,
  required_quantity integer not null default 1 check (required_quantity > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint bundle_deal_items_unique unique (bundle_deal_id, product_id)
);

create table if not exists public.addon_deals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  trigger_product_id uuid not null references public.products(product_id) on delete cascade,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  max_uses integer check (max_uses is null or max_uses >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint addon_deals_time_range_check check (end_at > start_at),
  constraint addon_deals_percentage_limit_check check (
    discount_type <> 'percentage' or discount_value <= 100
  )
);

create table if not exists public.addon_deal_items (
  id uuid primary key default gen_random_uuid(),
  addon_deal_id uuid not null references public.addon_deals(id) on delete cascade,
  product_id uuid not null references public.products(product_id) on delete cascade,
  required_quantity integer not null default 1 check (required_quantity > 0),
  max_addon_quantity integer check (max_addon_quantity is null or max_addon_quantity > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint addon_deal_items_unique unique (addon_deal_id, product_id)
);

create index if not exists bundle_deals_shop_active_time_idx
  on public.bundle_deals(shop_id, is_active, start_at, end_at);

create index if not exists bundle_deal_items_bundle_idx
  on public.bundle_deal_items(bundle_deal_id);

create index if not exists bundle_deal_items_product_idx
  on public.bundle_deal_items(product_id);

create index if not exists addon_deals_shop_active_time_idx
  on public.addon_deals(shop_id, is_active, start_at, end_at);

create index if not exists addon_deals_trigger_product_idx
  on public.addon_deals(trigger_product_id);

create index if not exists addon_deal_items_addon_idx
  on public.addon_deal_items(addon_deal_id);

create index if not exists addon_deal_items_product_idx
  on public.addon_deal_items(product_id);

alter table public.bundle_deals enable row level security;
alter table public.bundle_deal_items enable row level security;
alter table public.addon_deals enable row level security;
alter table public.addon_deal_items enable row level security;

drop policy if exists bundle_deals_owner_all on public.bundle_deals;
create policy bundle_deals_owner_all
  on public.bundle_deals
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = bundle_deals.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = bundle_deals.shop_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists bundle_deal_items_owner_all on public.bundle_deal_items;
create policy bundle_deal_items_owner_all
  on public.bundle_deal_items
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.bundle_deals bd
      join public.shops s on s.id = bd.shop_id
      where bd.id = bundle_deal_items.bundle_deal_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.bundle_deals bd
      join public.shops s on s.id = bd.shop_id
      where bd.id = bundle_deal_items.bundle_deal_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists addon_deals_owner_all on public.addon_deals;
create policy addon_deals_owner_all
  on public.addon_deals
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = addon_deals.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = addon_deals.shop_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists addon_deal_items_owner_all on public.addon_deal_items;
create policy addon_deal_items_owner_all
  on public.addon_deal_items
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.addon_deals ad
      join public.shops s on s.id = ad.shop_id
      where ad.id = addon_deal_items.addon_deal_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.addon_deals ad
      join public.shops s on s.id = ad.shop_id
      where ad.id = addon_deal_items.addon_deal_id and s.owner_id = auth.uid()
    )
  );
