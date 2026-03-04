-- Discount promotion parent model and product_discounts linkage.

create table if not exists public.discount_promotions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  max_uses integer check (max_uses is null or max_uses >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint discount_promotions_time_range_check check (end_at > start_at)
);

create index if not exists discount_promotions_shop_active_time_idx
  on public.discount_promotions(shop_id, is_active, start_at, end_at);

alter table public.product_discounts
  add column if not exists promotion_id uuid;

insert into public.discount_promotions (
  id,
  shop_id,
  name,
  start_at,
  end_at,
  max_uses,
  used_count,
  is_active,
  created_at,
  updated_at
)
select
  pd.id,
  pd.shop_id,
  'Legacy Promotion ' || to_char(coalesce(pd.created_at, now()), 'YYYYMMDD-HH24MISS'),
  pd.start_at,
  pd.end_at,
  pd.max_uses,
  coalesce(pd.used_count, 0),
  coalesce(pd.is_active, true),
  coalesce(pd.created_at, now()),
  coalesce(pd.updated_at, now())
from public.product_discounts pd
where pd.promotion_id is null
  and not exists (
    select 1
    from public.discount_promotions dp
    where dp.id = pd.id
  );

update public.product_discounts pd
set promotion_id = pd.id
where pd.promotion_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_discounts_promotion_fkey'
  ) then
    alter table public.product_discounts
      add constraint product_discounts_promotion_fkey
      foreign key (promotion_id)
      references public.discount_promotions(id)
      on delete cascade;
  end if;
end $$;

alter table public.product_discounts
  alter column promotion_id set not null;

create index if not exists product_discounts_promotion_id_idx
  on public.product_discounts(promotion_id);

alter table public.discount_promotions enable row level security;

drop policy if exists discount_promotions_owner_all on public.discount_promotions;
create policy discount_promotions_owner_all
  on public.discount_promotions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = discount_promotions.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = discount_promotions.shop_id and s.owner_id = auth.uid()
    )
  );
