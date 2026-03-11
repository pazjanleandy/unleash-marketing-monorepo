-- Discount section (renamed from discount_promotions) + product_discounts linkage.

do $$
begin
  if to_regclass('public.discount_promotions') is not null
     and to_regclass('public.discount_section') is null then
    alter table public.discount_promotions rename to discount_section;
  end if;
end $$;

create table if not exists public.discount_section (
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
  campaign_type text not null default 'promotion',
  constraint discount_section_time_range_check check (end_at > start_at),
  constraint discount_section_campaign_type_check check (
    campaign_type in ('promotion', 'bundle', 'add-on')
  )
);

alter table public.discount_section
  add column if not exists campaign_type text not null default 'promotion';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'discount_section_campaign_type_check'
  ) then
    alter table public.discount_section
      add constraint discount_section_campaign_type_check check (
        campaign_type in ('promotion', 'bundle', 'add-on')
      );
  end if;
end $$;

create index if not exists discount_section_shop_active_time_idx
  on public.discount_section(shop_id, is_active, start_at, end_at);

alter table public.product_discounts
  add column if not exists promotion_id uuid;

insert into public.discount_section (
  id,
  shop_id,
  name,
  start_at,
  end_at,
  max_uses,
  used_count,
  is_active,
  created_at,
  updated_at,
  campaign_type
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
  coalesce(pd.updated_at, now()),
  'promotion'
from public.product_discounts pd
where pd.promotion_id is null
  and not exists (
    select 1
    from public.discount_section ds
    where ds.id = pd.id
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
      references public.discount_section(id)
      on delete cascade;
  end if;
end $$;

alter table public.product_discounts
  alter column promotion_id set not null;

create index if not exists product_discounts_promotion_id_idx
  on public.product_discounts(promotion_id);

alter table public.discount_section enable row level security;

drop policy if exists discount_promotions_owner_all on public.discount_section;
drop policy if exists discount_section_owner_all on public.discount_section;
create policy discount_section_owner_all
  on public.discount_section
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = discount_section.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = discount_section.shop_id and s.owner_id = auth.uid()
    )
  );
