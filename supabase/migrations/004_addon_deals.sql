-- Add-on deals (cross-sell / optional add-on)

create table if not exists public.addon_deals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  trigger_product_id uuid not null references public.products(product_id) on delete restrict,
  discount_type text not null default 'percentage',
  discount_value numeric not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  max_uses integer check (max_uses is null or max_uses >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint addon_deals_time_range_check check (end_at > start_at),
  constraint addon_deals_discount_type_check check (discount_type in ('percentage', 'fixed')),
  constraint addon_deals_discount_value_check check (discount_value > 0)
);

create index if not exists idx_addon_deals_shop_id on public.addon_deals(shop_id);
create index if not exists idx_addon_deals_trigger_product_id on public.addon_deals(trigger_product_id);

create table if not exists public.addon_deal_items (
  id uuid primary key default gen_random_uuid(),
  addon_deal_id uuid not null references public.addon_deals(id) on delete cascade,
  product_id uuid not null references public.products(product_id) on delete restrict,
  required_quantity integer not null default 1 check (required_quantity >= 1),
  max_addon_quantity integer check (max_addon_quantity is null or max_addon_quantity >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_addon_deal_items_addon_deal_id on public.addon_deal_items(addon_deal_id);

alter table public.addon_deals enable row level security;
alter table public.addon_deal_items enable row level security;

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
