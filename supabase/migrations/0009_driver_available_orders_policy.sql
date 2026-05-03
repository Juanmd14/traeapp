-- ================================================================
-- 0009 — Políticas para que los repartidores vean pedidos disponibles
-- ================================================================

-- Función helper para chequear rol driver
create or replace function public.is_driver()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('delivery_driver', 'admin'), false);
$$;

-- Repartidores pueden ver pedidos listos sin conductor asignado
create policy "orders_driver_available_read"
  on public.orders for select
  using (
    status = 'ready'
    and driver_id is null
    and public.is_driver()
  );

-- Repartidores pueden ver los ítems de pedidos disponibles
create policy "order_items_driver_available_read"
  on public.order_items for select
  using (
    exists(
      select 1 from public.orders o
      where o.id = order_id
        and o.status = 'ready'
        and o.driver_id is null
        and public.is_driver()
    )
  );
