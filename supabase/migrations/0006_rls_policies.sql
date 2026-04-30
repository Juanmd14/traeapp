-- ================================================================
-- 0006 — Row Level Security policies
-- ================================================================

-- ============ PROFILES ============
alter table public.profiles enable row level security;

create policy "profiles_self_read"
  on public.profiles for select
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles_self_update"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select role from public.profiles where id = (select auth.uid())));
-- Nota: el cambio de rol queda restringido al admin vía service_role.

-- ============ ADDRESSES ============
alter table public.addresses enable row level security;

create policy "addresses_owner_all"
  on public.addresses for all
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "addresses_admin_read"
  on public.addresses for select
  using (public.is_admin());

-- ============ STORES ============
alter table public.stores enable row level security;

create policy "stores_public_read_active"
  on public.stores for select
  using (status = 'active' and deleted_at is null);

create policy "stores_members_read"
  on public.stores for select
  using (public.is_store_member(id) or public.is_admin());

create policy "stores_members_write"
  on public.stores for update
  using (public.is_store_member(id) or public.is_admin())
  with check (public.is_store_member(id) or public.is_admin());

-- Insert/delete sólo via service_role (alta de comercio = proceso onboarding controlado).

-- ============ STORE_USERS ============
alter table public.store_users enable row level security;

create policy "store_users_member_read"
  on public.store_users for select
  using (
    user_id = (select auth.uid())
    or public.is_store_member(store_id)
    or public.is_admin()
  );

-- Mutaciones via service_role (admin/onboarding).

-- ============ STORE_HOURS ============
alter table public.store_hours enable row level security;

create policy "store_hours_public_read"
  on public.store_hours for select using (true);

create policy "store_hours_members_write"
  on public.store_hours for all
  using (public.is_store_member(store_id) or public.is_admin())
  with check (public.is_store_member(store_id) or public.is_admin());

-- ============ CATEGORIES ============
alter table public.categories enable row level security;

create policy "categories_public_read"
  on public.categories for select using (is_active = true);

create policy "categories_admin_all"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============ PRODUCT_CATEGORIES ============
alter table public.product_categories enable row level security;

create policy "product_categories_public_read"
  on public.product_categories for select using (true);

create policy "product_categories_members_write"
  on public.product_categories for all
  using (public.is_store_member(store_id) or public.is_admin())
  with check (public.is_store_member(store_id) or public.is_admin());

-- ============ PRODUCTS ============
alter table public.products enable row level security;

create policy "products_public_read"
  on public.products for select
  using (
    is_active = true and deleted_at is null
    and exists (
      select 1 from public.stores s
      where s.id = store_id and s.status = 'active' and s.deleted_at is null
    )
  );

create policy "products_members_read_all"
  on public.products for select
  using (public.is_store_member(store_id) or public.is_admin());

create policy "products_members_write"
  on public.products for all
  using (public.is_store_member(store_id) or public.is_admin())
  with check (public.is_store_member(store_id) or public.is_admin());

-- ============ PRODUCT_MODIFIERS ============
alter table public.product_modifiers enable row level security;

create policy "product_modifiers_public_read"
  on public.product_modifiers for select using (true);

create policy "product_modifiers_members_write"
  on public.product_modifiers for all
  using (
    exists(select 1 from public.products p
           where p.id = product_id and public.is_store_member(p.store_id))
    or public.is_admin()
  )
  with check (
    exists(select 1 from public.products p
           where p.id = product_id and public.is_store_member(p.store_id))
    or public.is_admin()
  );

alter table public.product_modifier_options enable row level security;

create policy "pmo_public_read"
  on public.product_modifier_options for select using (true);

create policy "pmo_members_write"
  on public.product_modifier_options for all
  using (
    exists(
      select 1 from public.product_modifiers m
      join public.products p on p.id = m.product_id
      where m.id = modifier_id and public.is_store_member(p.store_id)
    ) or public.is_admin()
  )
  with check (
    exists(
      select 1 from public.product_modifiers m
      join public.products p on p.id = m.product_id
      where m.id = modifier_id and public.is_store_member(p.store_id)
    ) or public.is_admin()
  );

-- ============ INVENTORY ============
alter table public.inventory enable row level security;

create policy "inventory_members_all"
  on public.inventory for all
  using (
    exists(select 1 from public.products p
           where p.id = product_id and public.is_store_member(p.store_id))
    or public.is_admin()
  )
  with check (
    exists(select 1 from public.products p
           where p.id = product_id and public.is_store_member(p.store_id))
    or public.is_admin()
  );

-- ============ PROMOTIONS ============
alter table public.promotions enable row level security;

create policy "promotions_public_read_active"
  on public.promotions for select
  using (is_active = true);

create policy "promotions_members_write"
  on public.promotions for all
  using (
    (store_id is null and public.is_admin())
    or (store_id is not null and (public.is_store_member(store_id) or public.is_admin()))
  )
  with check (
    (store_id is null and public.is_admin())
    or (store_id is not null and (public.is_store_member(store_id) or public.is_admin()))
  );

-- ============ CARTS ============
alter table public.carts enable row level security;

create policy "carts_owner_all"
  on public.carts for all
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

alter table public.cart_items enable row level security;

create policy "cart_items_owner_all"
  on public.cart_items for all
  using (
    exists(select 1 from public.carts c
           where c.id = cart_id and c.customer_id = (select auth.uid()))
  )
  with check (
    exists(select 1 from public.carts c
           where c.id = cart_id and c.customer_id = (select auth.uid()))
  );

-- ============ ORDERS ============
alter table public.orders enable row level security;

create policy "orders_customer_read"
  on public.orders for select
  using (customer_id = (select auth.uid()));

create policy "orders_store_read"
  on public.orders for select
  using (public.is_store_member(store_id));

create policy "orders_driver_read"
  on public.orders for select
  using (driver_id = (select auth.uid()));

create policy "orders_admin_read"
  on public.orders for select
  using (public.is_admin());

create policy "orders_customer_create"
  on public.orders for insert
  with check (customer_id = (select auth.uid()));

-- Cancelación por el cliente (sólo en estados tempranos).
create policy "orders_customer_cancel"
  on public.orders for update
  using (
    customer_id = (select auth.uid())
    and status in ('pending', 'confirmed')
  )
  with check (
    customer_id = (select auth.uid())
    and status = 'cancelled'
  );

-- Comercios pueden actualizar estados operativos.
create policy "orders_store_update"
  on public.orders for update
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- Repartidor actualiza pickup/delivered.
create policy "orders_driver_update"
  on public.orders for update
  using (driver_id = (select auth.uid()))
  with check (driver_id = (select auth.uid()));

-- Admin todo.
create policy "orders_admin_all"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============ ORDER_ITEMS ============
alter table public.order_items enable row level security;

create policy "order_items_via_order_read"
  on public.order_items for select
  using (
    exists(select 1 from public.orders o
           where o.id = order_id and (
             o.customer_id = (select auth.uid())
             or public.is_store_member(o.store_id)
             or o.driver_id = (select auth.uid())
             or public.is_admin()
           ))
  );

create policy "order_items_customer_create"
  on public.order_items for insert
  with check (
    exists(select 1 from public.orders o
           where o.id = order_id and o.customer_id = (select auth.uid()))
  );

-- ============ DELIVERIES ============
alter table public.deliveries enable row level security;

create policy "deliveries_via_order_read"
  on public.deliveries for select
  using (
    driver_id = (select auth.uid())
    or exists(select 1 from public.orders o
              where o.id = order_id and (
                o.customer_id = (select auth.uid())
                or public.is_store_member(o.store_id)
                or public.is_admin()
              ))
  );

create policy "deliveries_driver_update"
  on public.deliveries for update
  using (driver_id = (select auth.uid()) or public.is_admin())
  with check (driver_id = (select auth.uid()) or public.is_admin());

-- ============ DELIVERY_TRACKING ============
alter table public.delivery_tracking enable row level security;

create policy "delivery_tracking_read"
  on public.delivery_tracking for select
  using (
    exists(select 1 from public.deliveries d
           join public.orders o on o.id = d.order_id
           where d.id = delivery_id and (
             d.driver_id = (select auth.uid())
             or o.customer_id = (select auth.uid())
             or public.is_store_member(o.store_id)
             or public.is_admin()
           ))
  );

create policy "delivery_tracking_driver_insert"
  on public.delivery_tracking for insert
  with check (
    exists(select 1 from public.deliveries d
           where d.id = delivery_id and d.driver_id = (select auth.uid()))
  );

-- ============ DRIVER_STATUS ============
alter table public.driver_status enable row level security;

create policy "driver_status_self"
  on public.driver_status for all
  using (driver_id = (select auth.uid()) or public.is_admin())
  with check (driver_id = (select auth.uid()) or public.is_admin());

create policy "driver_status_admin_read"
  on public.driver_status for select
  using (public.is_admin());

-- ============ PAYMENTS ============
alter table public.payments enable row level security;

create policy "payments_owner_read"
  on public.payments for select
  using (
    exists(select 1 from public.orders o
           where o.id = order_id and (
             o.customer_id = (select auth.uid())
             or public.is_store_member(o.store_id)
             or public.is_admin()
           ))
  );

-- Inserts/updates sólo via service_role (webhook MP).

-- ============ NOTIFICATIONS ============
alter table public.notifications enable row level security;

create policy "notifications_self_read"
  on public.notifications for select
  using (user_id = (select auth.uid()));

create policy "notifications_self_mark_read"
  on public.notifications for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============ REVIEWS ============
alter table public.reviews enable row level security;

create policy "reviews_public_read"
  on public.reviews for select using (true);

create policy "reviews_customer_create"
  on public.reviews for insert
  with check (
    customer_id = (select auth.uid())
    and exists(select 1 from public.orders o
               where o.id = order_id
                 and o.customer_id = (select auth.uid())
                 and o.status = 'completed')
  );

create policy "reviews_customer_update_own"
  on public.reviews for update
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

-- ============ AUDIT LOGS ============
alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_only"
  on public.audit_logs for select
  using (public.is_admin());
-- Inserts via service_role.
