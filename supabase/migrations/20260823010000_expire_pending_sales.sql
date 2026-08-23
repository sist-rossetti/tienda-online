-- Vencimiento automático de pedidos pendientes: si un pedido queda en
-- estado "pendiente" más de 3 horas sin pasar a "completada", se cancela
-- solo y el stock reservado en el checkout se repone.
--
-- Deploy:
--   1. supabase db push  (o pegar este archivo en el SQL editor)
--   2. Habilitar la extensión pg_cron una vez desde el dashboard de
--      Supabase: Database → Extensions → buscar "pg_cron" → Enable.
--      (En algunos planes ya viene habilitada; si `create extension`
--      de más abajo falla por permisos, hacé este paso primero.)

create extension if not exists pg_cron with schema extensions;

create or replace function public.expire_pending_sales()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale record;
begin
  for v_sale in
    select id from public.sales
    where status = 'pendiente'
      and created_at < now() - interval '3 hours'
    for update skip locked
  loop
    update public.products p
    set stock = p.stock + si.quantity
    from public.sale_items si
    where si.sale_id = v_sale.id
      and p.id = si.product_id;

    update public.sales
    set status = 'cancelada',
        note = case
          when note is null or note = '' then 'Cancelado automáticamente: pendiente por más de 3hs'
          else note || ' | Cancelado automáticamente: pendiente por más de 3hs'
        end
    where id = v_sale.id;
  end loop;
end;
$$;

grant execute on function public.expire_pending_sales() to postgres;

-- Corre cada 10 minutos. select cron.unschedule('expire-pending-sales')
-- para desactivarlo, o cron.alter_job para cambiar la frecuencia.
select cron.schedule(
  'expire-pending-sales',
  '*/10 * * * *',
  $$select public.expire_pending_sales()$$
)
where not exists (
  select 1 from cron.job where jobname = 'expire-pending-sales'
);

-- Cancelación manual desde el admin (Ventas → marcar "cancelada"): repone
-- stock igual que el vencimiento automático, para que ambos caminos sean
-- consistentes. Si la venta ya estaba cancelada, no hace nada (evita
-- reponer stock dos veces si se clickea repetido).
create or replace function public.cancel_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.sales where id = p_sale_id for update;

  if not found then
    raise exception 'Venta no encontrada';
  end if;

  if v_status = 'cancelada' then
    return;
  end if;

  update public.products p
  set stock = p.stock + si.quantity
  from public.sale_items si
  where si.sale_id = p_sale_id
    and p.id = si.product_id;

  update public.sales set status = 'cancelada' where id = p_sale_id;
end;
$$;

grant execute on function public.cancel_sale(uuid) to authenticated;
