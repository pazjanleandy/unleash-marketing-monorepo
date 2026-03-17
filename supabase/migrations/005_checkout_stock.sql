-- Atomic stock decrement for checkout to avoid race conditions.

create or replace function public.decrement_product_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_current integer;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No items provided';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::int;

    if v_product_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid product or quantity';
    end if;

    select quantity
      into v_current
      from public.products
     where product_id = v_product_id
     for update;

    if v_current is null then
      raise exception 'Product not found';
    end if;

    if v_current < v_quantity then
      raise exception 'Insufficient stock';
    end if;

    update public.products
       set quantity = v_current - v_quantity,
           updated_at = now()
     where product_id = v_product_id;
  end loop;
end;
$$;
