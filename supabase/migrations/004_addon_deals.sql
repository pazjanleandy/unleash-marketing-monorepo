-- Add-on deals (cross-sell / optional add-on)

create table public.addon_deals (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null,
  name text not null,
  trigger_product_id uuid not null,
  discount_type text not null default 'percentage'::text,
  discount_value numeric not null,
  start_at timestamp with time zone not null,
  end_at timestamp with time zone not null,
  max_uses integer null,
  used_count integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint addon_deals_pkey primary key (id),
  constraint addon_deals_trigger_product_id_fkey foreign KEY (trigger_product_id) references products (product_id) on delete RESTRICT,
  constraint addon_deals_shop_id_fkey foreign KEY (shop_id) references shops (id) on delete CASCADE,
  constraint addon_deals_time_range_check check ((end_at > start_at)),
  constraint addon_deals_discount_type_check check (
    (
      discount_type = any (array['percentage'::text, 'fixed'::text])
    )
  ),
  constraint addon_deals_used_count_check check ((used_count >= 0)),
  constraint addon_deals_discount_value_check check ((discount_value > (0)::numeric)),
  constraint addon_deals_max_uses_check check (
    (
      (max_uses is null)
      or (max_uses >= 0)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_addon_deals_shop_id on public.addon_deals using btree (shop_id) TABLESPACE pg_default;

create index IF not exists idx_addon_deals_trigger_product_id on public.addon_deals using btree (trigger_product_id) TABLESPACE pg_default;

create table public.addon_deal_items (
  id uuid not null default gen_random_uuid(),
  addon_deal_id uuid not null,
  product_id uuid not null,
  required_quantity integer not null default 1,
  max_addon_quantity integer null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint addon_deal_items_pkey primary key (id),
  constraint addon_deal_items_addon_deal_id_fkey foreign KEY (addon_deal_id) references addon_deals (id) on delete CASCADE,
  constraint addon_deal_items_product_id_fkey foreign KEY (product_id) references products (product_id) on delete RESTRICT,
  constraint addon_deal_items_max_addon_quantity_check check (
    (
      (max_addon_quantity is null)
      or (max_addon_quantity >= 0)
    )
  ),
  constraint addon_deal_items_required_quantity_check check ((required_quantity >= 1))
) TABLESPACE pg_default;

create index IF not exists idx_addon_deal_items_addon_deal_id on public.addon_deal_items using btree (addon_deal_id) TABLESPACE pg_default;

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
