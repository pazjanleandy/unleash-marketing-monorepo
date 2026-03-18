-- Add image_url column for product images.

alter table public.products
  add column if not exists image_url text;

-- Backfill image_url from legacy image column when present.
update public.products
set image_url = image
where image_url is null
  and image is not null;