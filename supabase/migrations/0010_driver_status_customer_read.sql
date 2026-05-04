-- Allow customers to read the location of a driver assigned to their active order
create policy "driver_status_customer_active_order"
  on public.driver_status for select
  using (
    exists (
      select 1 from public.orders o
      where o.driver_id = driver_status.driver_id
        and o.customer_id = (select auth.uid())
        and o.status in ('ready', 'picked_up')
    )
  );
