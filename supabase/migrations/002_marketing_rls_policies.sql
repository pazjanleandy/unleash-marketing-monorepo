-- Row-level security policies for owner-scoped shop access

alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.vouchers enable row level security;
alter table public.voucher_products enable row level security;
alter table public.voucher_usages enable row level security;
alter table public.product_discounts enable row level security;
alter table public.flash_deals enable row level security;

drop policy if exists shops_select_owner on public.shops;
create policy shops_select_owner
  on public.shops
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists shops_insert_owner on public.shops;
create policy shops_insert_owner
  on public.shops
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists shops_update_owner on public.shops;
create policy shops_update_owner
  on public.shops
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists shops_delete_owner on public.shops;
create policy shops_delete_owner
  on public.shops
  for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists categories_select_authenticated on public.categories;
create policy categories_select_authenticated
  on public.categories
  for select
  to authenticated
  using (true);

drop policy if exists products_owner_all on public.products;
create policy products_owner_all
  on public.products
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = products.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = products.shop_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists vouchers_owner_all on public.vouchers;
create policy vouchers_owner_all
  on public.vouchers
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = vouchers.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = vouchers.shop_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists voucher_products_owner_all on public.voucher_products;
create policy voucher_products_owner_all
  on public.voucher_products
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.vouchers v
      join public.shops s on s.id = v.shop_id
      where v.id = voucher_products.voucher_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vouchers v
      join public.shops s on s.id = v.shop_id
      where v.id = voucher_products.voucher_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists voucher_usages_owner_all on public.voucher_usages;
create policy voucher_usages_owner_all
  on public.voucher_usages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.vouchers v
      join public.shops s on s.id = v.shop_id
      where v.id = voucher_usages.voucher_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vouchers v
      join public.shops s on s.id = v.shop_id
      where v.id = voucher_usages.voucher_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists product_discounts_owner_all on public.product_discounts;
create policy product_discounts_owner_all
  on public.product_discounts
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = product_discounts.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = product_discounts.shop_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists flash_deals_owner_all on public.flash_deals;
create policy flash_deals_owner_all
  on public.flash_deals
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = flash_deals.shop_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = flash_deals.shop_id and s.owner_id = auth.uid()
    )
  );
