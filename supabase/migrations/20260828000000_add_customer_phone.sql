-- Agrega teléfono de contacto al cliente, junto al email ya existente.

alter table public.sales add column if not exists customer_phone text;

create or replace function public.checkout_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_doc text,
  p_payment_method text,
  p_note text,
  p_coupon_code text,
  p_items jsonb, -- [{ "product_id": "uuid", "quantity": 2 }, ...]
  p_customer_phone text default null
)
returns table (
  sale_id uuid,
  order_number text,
  subtotal numeric,
  discount numeric,
  total numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product record;
  v_coupon record;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_order_number text;
  v_sale_id uuid;
  v_item_count int;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'El nombre es obligatorio';
  end if;

  select count(*) into v_item_count from jsonb_array_elements(coalesce(p_items, '[]'::jsonb));
  if v_item_count = 0 then
    raise exception 'El carrito está vacío';
  end if;

  -- Tabla temporal con precio/stock reales tomados de la base, no del cliente
  create temporary table _checkout_items (
    product_id uuid,
    name text,
    unit_price numeric,
    quantity int,
    subtotal numeric
  ) on commit drop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if (v_item->>'quantity')::int <= 0 then
      raise exception 'Cantidad inválida';
    end if;

    -- Bloquea la fila para evitar condiciones de carrera con otro checkout simultáneo
    select id, name, price, stock, active
      into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid
      for update;

    if not found or v_product.active is not true then
      raise exception 'Producto no disponible';
    end if;

    if v_product.stock < (v_item->>'quantity')::int then
      raise exception 'Sin stock suficiente para "%": quedan % unidades', v_product.name, v_product.stock;
    end if;

    insert into _checkout_items (product_id, name, unit_price, quantity, subtotal)
    values (
      v_product.id,
      v_product.name,
      v_product.price,
      (v_item->>'quantity')::int,
      v_product.price * (v_item->>'quantity')::int
    );

    v_subtotal := v_subtotal + v_product.price * (v_item->>'quantity')::int;
  end loop;

  -- Cupón: se revalida acá aunque el cliente ya lo haya "previsualizado" antes
  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    select id, discount_percent, max_uses, uses, active, expires_at
      into v_coupon
      from public.coupons
      where code = upper(btrim(p_coupon_code))
      for update;

    if not found or v_coupon.active is not true then
      raise exception 'Cupón no válido';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Cupón vencido';
    end if;
    if v_coupon.max_uses is not null and v_coupon.uses >= v_coupon.max_uses then
      raise exception 'Cupón agotado';
    end if;

    v_discount := round(v_subtotal * v_coupon.discount_percent / 100.0);
  end if;

  v_total := v_subtotal - v_discount;
  v_order_number := '#' || lpad(nextval('public.sales_order_seq')::text, 6, '0');

  insert into public.sales (
    order_number, customer_name, customer_email, customer_phone, customer_doc,
    total, discount, payment_method, status, note
  ) values (
    v_order_number, p_customer_name, nullif(p_customer_email, ''), nullif(p_customer_phone, ''), nullif(p_customer_doc, ''),
    v_total, v_discount, p_payment_method, 'pendiente', nullif(p_note, '')
  )
  returning id into v_sale_id;

  insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
  select v_sale_id, ci.product_id, ci.name, ci.quantity, ci.unit_price, ci.subtotal
  from _checkout_items ci;

  update public.products p
  set stock = p.stock - ci.quantity
  from _checkout_items ci
  where p.id = ci.product_id;

  if v_coupon.id is not null then
    update public.coupons set uses = uses + 1 where id = v_coupon.id;
  end if;

  return query select v_sale_id, v_order_number, v_subtotal, v_discount, v_total;
end;
$$;

drop function if exists public.checkout_order(text, text, text, text, text, text, jsonb);

grant execute on function public.checkout_order(text, text, text, text, text, text, jsonb, text) to anon, authenticated;
