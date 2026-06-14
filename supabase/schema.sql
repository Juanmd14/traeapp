-- ================================================================
-- 0001 — Extensiones y tipos base
-- ================================================================

-- UUIDs y timestamps automáticos
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime" schema "extensions";
create extension if not exists "pg_trgm";
-- Para búsquedas geoespaciales avanzadas (cuando crezca):
-- create extension if not exists "postgis";

-- ============ ENUMS ============
create type public.user_role as enum (
  'customer', 'store_owner', 'store_staff', 'delivery_driver', 'admin'
);

create type public.store_status as enum (
  'draft', 'pending_review', 'active', 'paused', 'closed'
);

create type public.order_status as enum (
  'pending', 'confirmed', 'preparing', 'ready',
  'picked_up', 'delivered', 'completed',
  'cancelled', 'rejected'
);

create type public.payment_method as enum (
  'cash', 'mercadopago', 'card_on_delivery'
);

create type public.payment_status as enum (
  'pending', 'authorized', 'approved',
  'rejected', 'refunded', 'cancelled'
);

create type public.delivery_status as enum (
  'unassigned', 'assigned', 'heading_to_store',
  'at_store', 'heading_to_customer', 'delivered', 'failed'
);

create type public.promo_type as enum (
  'percent', 'amount', 'free_delivery', 'bxgy'
);

create type public.notification_channel as enum (
  'in_app', 'email', 'push', 'sms', 'whatsapp'
);
-- ================================================================
-- 0002 — Profiles, direcciones, comercios y miembros
-- ================================================================

-- ============ PROFILES ============
-- Extiende auth.users de Supabase
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  phone        text unique,
  email        text unique,
  avatar_url   text,
  role         public.user_role not null default 'customer',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure extensions.moddatetime(updated_at);

-- Trigger: cuando se registra un usuario en auth.users, crear su profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ ADDRESSES ============
create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  label         text,
  street        text not null,
  number        text,
  apartment     text,
  neighborhood  text,
  city          text not null default 'Mi Ciudad',
  reference     text,
  lat           double precision,
  lng           double precision,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index addresses_profile_id_idx on public.addresses(profile_id);

-- Solo una dirección default por usuario
create unique index addresses_one_default_per_user
on public.addresses(profile_id) where is_default = true;

-- ============ STORES ============
create table public.stores (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  name               text not null,
  description        text,
  logo_url           text,
  cover_url          text,
  phone              text,
  email              text,
  address            text not null,
  lat                double precision,
  lng                double precision,
  category_id        uuid,
  status             public.store_status not null default 'draft',

  -- Operación
  min_order_amount   numeric(12,2) not null default 0,
  delivery_fee       numeric(12,2) not null default 0,
  avg_prep_minutes   integer not null default 25,
  delivery_radius_km numeric(5,2) not null default 5,
  accepts_cash       boolean not null default true,
  accepts_mp         boolean not null default true,

  -- Comisión específica del comercio (override del default)
  commission_pct     numeric(5,2) not null default 12.00,

  -- Featured y métricas agregadas
  is_featured        boolean not null default false,
  rating_avg         numeric(3,2) not null default 0,
  rating_count       integer not null default 0,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create index stores_status_idx on public.stores(status) where deleted_at is null;
create index stores_category_idx on public.stores(category_id);
create index stores_featured_idx on public.stores(is_featured)
  where status = 'active' and deleted_at is null;
create index stores_name_trgm_idx on public.stores using gin (name gin_trgm_ops);

create trigger stores_set_updated_at
before update on public.stores
for each row execute procedure extensions.moddatetime(updated_at);

-- ============ STORE USERS ============
create table public.store_users (
  store_id     uuid not null references public.stores(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null check (role in ('owner', 'manager', 'staff')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index store_users_user_id_idx on public.store_users(user_id);

-- ============ STORE HOURS ============
create table public.store_hours (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  opens_at    time not null,
  closes_at   time not null
);

create index store_hours_store_idx on public.store_hours(store_id);

-- ============ HELPERS ============

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.store_users
    where store_id = p_store_id
      and user_id = (select auth.uid())
      and is_active = true
  );
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;
-- ================================================================
-- 0003 — Catálogo: categorías, productos, modificadores, promociones
-- ================================================================

-- ============ CATEGORIES (globales del marketplace) ============
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  icon_url     text,
  emoji        text,
  bg_class     text,                  -- ej: 'bg-primary-100' (Tailwind)
  sort_order   integer not null default 0,
  is_active    boolean not null default true
);

-- Ahora podemos cerrar la FK de stores.category_id
alter table public.stores
  add constraint stores_category_id_fkey
  foreign key (category_id) references public.categories(id) on delete set null;

-- ============ PRODUCT CATEGORIES (menú interno del comercio) ============
create table public.product_categories (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  name         text not null,
  sort_order   integer not null default 0
);

create index product_categories_store_idx on public.product_categories(store_id);

-- ============ PRODUCTS ============
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores(id) on delete cascade,
  product_category_id uuid references public.product_categories(id) on delete set null,
  name                text not null,
  description         text,
  image_url           text,
  price               numeric(12,2) not null check (price >= 0),
  compare_at_price    numeric(12,2),     -- precio anterior tachado
  sku                 text,
  is_active           boolean not null default true,
  is_available        boolean not null default true,
  has_quantity_options boolean not null default false,
  hide_manual_quantity boolean not null default false,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index products_store_idx on public.products(store_id)
  where deleted_at is null and is_active = true;
create index products_category_idx on public.products(product_category_id);
create index products_search_idx on public.products
  using gin (to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,'')));

create trigger products_set_updated_at
before update on public.products
for each row execute procedure extensions.moddatetime(updated_at);

-- ============ PRODUCT MODIFIERS ============
create table public.product_modifiers (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  name         text not null,
  is_required  boolean not null default false,
  min_select   integer not null default 0,
  max_select   integer not null default 1
);

create table public.product_modifier_options (
  id            uuid primary key default gen_random_uuid(),
  modifier_id   uuid not null references public.product_modifiers(id) on delete cascade,
  name          text not null,
  price_delta   numeric(12,2) not null default 0,
  is_removal    boolean not null default false
);

create index product_modifiers_product_idx on public.product_modifiers(product_id);
create index pmo_modifier_idx on public.product_modifier_options(modifier_id);

-- ============ PRODUCT QUANTITY OPTIONS ============
create table public.product_quantity_options (
  id            uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  quantity    integer not null check (quantity > 0),
  price       numeric(12,2) not null check (price >= 0),
  is_default  boolean not null default false,
  sort_order  integer not null default 0
);

create index pqo_product_idx on public.product_quantity_options(product_id);

-- ============ INVENTORY (opcional) ============
create table public.inventory (
  product_id        uuid primary key references public.products(id) on delete cascade,
  quantity          integer not null default 0,
  track_inventory   boolean not null default false
);

-- ============ PROMOTIONS ============
create table public.promotions (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid references public.stores(id) on delete cascade, -- null = global
  code              text unique,
  type              public.promo_type not null,
  value             numeric(12,2),
  min_order_amount  numeric(12,2),
  max_uses          integer,
  uses_count        integer not null default 0,
  per_user_limit    integer not null default 1,
  starts_at         timestamptz,
  ends_at           timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create index promotions_store_idx on public.promotions(store_id);
create index promotions_active_idx on public.promotions(is_active)
  where is_active = true;
-- ================================================================
-- 0004 — Carritos y pedidos
-- ================================================================

-- ============ CARTS ============
create table public.carts (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.profiles(id) on delete cascade,
  store_id      uuid not null references public.stores(id) on delete cascade,
  status        text not null default 'active'
                  check (status in ('active', 'converted', 'abandoned')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Solo un carrito activo por (cliente, comercio)
create unique index carts_one_active_per_customer_store
  on public.carts(customer_id, store_id) where status = 'active';

create trigger carts_set_updated_at
before update on public.carts
for each row execute procedure extensions.moddatetime(updated_at);

create table public.cart_items (
  id              uuid primary key default gen_random_uuid(),
  cart_id         uuid not null references public.carts(id) on delete cascade,
  product_id      uuid not null references public.products(id),
  quantity        integer not null check (quantity > 0),
  unit_price      numeric(12,2) not null,
  modifiers_json  jsonb not null default '[]'::jsonb,
  notes           text
);

create index cart_items_cart_idx on public.cart_items(cart_id);

-- ============ ORDERS ============
create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  order_number             bigserial unique,
  customer_id              uuid not null references public.profiles(id),
  store_id                 uuid not null references public.stores(id),
  driver_id                uuid references public.profiles(id),
  delivery_address_id      uuid references public.addresses(id),

  -- Snapshot de dirección (por si el cliente la borra)
  delivery_address_text    text not null,
  delivery_lat             double precision,
  delivery_lng             double precision,

  -- Importes
  subtotal                 numeric(12,2) not null check (subtotal >= 0),
  delivery_fee             numeric(12,2) not null default 0,
  discount                 numeric(12,2) not null default 0,
  total                    numeric(12,2) not null check (total >= 0),
  commission_amount        numeric(12,2) not null default 0,

  -- Estado y pago
  status                   public.order_status not null default 'pending',
  payment_method           public.payment_method not null,
  payment_status           public.payment_status not null default 'pending',

  -- Operación
  estimated_ready_at       timestamptz,
  estimated_delivery_at    timestamptz,
  customer_notes           text,
  cancel_reason            text,
  cancelled_by             text check (cancelled_by in ('customer','store','admin','system')),
  promotion_id             uuid references public.promotions(id),

  -- Eventos (timeline)
  confirmed_at             timestamptz,
  ready_at                 timestamptz,
  picked_up_at             timestamptz,
  delivered_at             timestamptz,
  completed_at             timestamptz,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index orders_customer_idx on public.orders(customer_id, created_at desc);
create index orders_store_status_idx on public.orders(store_id, status);
create index orders_driver_idx on public.orders(driver_id, status)
  where driver_id is not null;
create index orders_active_idx on public.orders(status)
  where status in ('pending','confirmed','preparing','ready','picked_up');

create trigger orders_set_updated_at
before update on public.orders
for each row execute procedure extensions.moddatetime(updated_at);

-- ============ ORDER ITEMS ============
create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid not null references public.products(id),
  product_name    text not null,         -- snapshot
  quantity        integer not null check (quantity > 0),
  unit_price      numeric(12,2) not null,
  modifiers_json  jsonb not null default '[]'::jsonb,
  total           numeric(12,2) not null,
  notes           text
);

create index order_items_order_idx on public.order_items(order_id);
-- ================================================================
-- 0005 — Delivery, pagos, notificaciones, auditoría, reseñas
-- ================================================================

-- ============ DELIVERIES ============
create table public.deliveries (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null unique references public.orders(id) on delete cascade,
  driver_id       uuid references public.profiles(id),
  status          public.delivery_status not null default 'unassigned',
  assigned_at     timestamptz,
  picked_up_at    timestamptz,
  delivered_at    timestamptz,
  pickup_lat      double precision,
  pickup_lng      double precision,
  dropoff_lat     double precision,
  dropoff_lng     double precision,
  distance_km     numeric(6,2),
  duration_minutes integer,
  driver_payout   numeric(12,2),
  notes           text
);

create index deliveries_driver_idx on public.deliveries(driver_id);

-- ============ DELIVERY TRACKING (snapshots GPS) ============
create table public.delivery_tracking (
  id            bigserial primary key,
  delivery_id   uuid not null references public.deliveries(id) on delete cascade,
  lat           double precision not null,
  lng           double precision not null,
  speed_kmh     numeric(5,2),
  recorded_at   timestamptz not null default now()
);

create index delivery_tracking_delivery_idx
  on public.delivery_tracking(delivery_id, recorded_at desc);

-- ============ DRIVER STATUS (online/offline) ============
create table public.driver_status (
  driver_id        uuid primary key references public.profiles(id) on delete cascade,
  is_online        boolean not null default false,
  current_lat      double precision,
  current_lng      double precision,
  last_seen_at     timestamptz not null default now(),
  active_order_id  uuid references public.orders(id)
);

-- ============ PAYMENTS ============
create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  method             public.payment_method not null,
  status             public.payment_status not null default 'pending',
  amount             numeric(12,2) not null,
  currency           text not null default 'ARS',

  -- Mercado Pago
  mp_preference_id   text,
  mp_payment_id      text unique,
  mp_status          text,
  mp_status_detail   text,
  raw_payload        jsonb,
  paid_at            timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index payments_order_idx on public.payments(order_id);

create trigger payments_set_updated_at
before update on public.payments
for each row execute procedure extensions.moddatetime(updated_at);

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  channel     public.notification_channel not null,
  title       text not null,
  body        text,
  data        jsonb,
  read_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications(user_id, read_at)
  where read_at is null;

-- ============ REVIEWS ============
create table public.reviews (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid unique references public.orders(id) on delete cascade,
  customer_id      uuid not null references public.profiles(id),
  store_id         uuid not null references public.stores(id),
  store_rating     smallint check (store_rating between 1 and 5),
  delivery_rating  smallint check (delivery_rating between 1 and 5),
  comment          text,
  created_at       timestamptz not null default now()
);

create index reviews_store_idx on public.reviews(store_id, created_at desc);

-- Trigger: actualizar rating_avg/rating_count del comercio al crear/borrar review
create or replace function public.update_store_rating()
returns trigger
language plpgsql
as $$
declare
  v_store_id uuid;
begin
  v_store_id := coalesce(new.store_id, old.store_id);
  update public.stores
  set
    rating_avg = coalesce((
      select avg(store_rating)::numeric(3,2)
      from public.reviews
      where store_id = v_store_id and store_rating is not null
    ), 0),
    rating_count = (
      select count(*) from public.reviews
      where store_id = v_store_id and store_rating is not null
    )
  where id = v_store_id;
  return null;
end;
$$;

create trigger reviews_update_store_rating
after insert or update or delete on public.reviews
for each row execute procedure public.update_store_rating();

-- ============ AUDIT LOGS ============
create table public.audit_logs (
  id          bigserial primary key,
  actor_id    uuid references public.profiles(id),
  actor_role  text,
  action      text not null,
  entity      text not null,
  entity_id   text,
  diff        jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs(entity, entity_id);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
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
-- ================================================================
-- 0007 — Storage buckets
-- ================================================================

-- Buckets públicos para imágenes
insert into storage.buckets (id, name, public)
values
  ('store-logos',   'store-logos',   true),
  ('store-covers',  'store-covers',  true),
  ('product-images','product-images', true),
  ('avatars',       'avatars',        true)
on conflict (id) do nothing;

-- Policies: lectura pública, escritura por miembros del comercio.
create policy "Public read store-logos"
  on storage.objects for select
  using (bucket_id = 'store-logos');

create policy "Public read store-covers"
  on storage.objects for select
  using (bucket_id = 'store-covers');

create policy "Public read product-images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Subir avatar propio: la primera carpeta debe ser el user id.
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Para imágenes de comercios la primera carpeta es el store_id.
-- Sólo miembros del comercio pueden escribir.
create policy "Store members upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'store-logos'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members upload covers"
  on storage.objects for insert
  with check (
    bucket_id = 'store-covers'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members upload products"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members update logos"
  on storage.objects for update
  using (
    bucket_id = 'store-logos'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members update covers"
  on storage.objects for update
  using (
    bucket_id = 'store-covers'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members update products"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );
-- ================================================================
-- 0008 — RPC apply_payment_webhook (idempotente)
-- ================================================================

create or replace function public.apply_payment_webhook(
  p_order_id        uuid,
  p_mp_payment_id   text,
  p_status          public.payment_status,
  p_status_detail   text,
  p_amount          numeric,
  p_raw             jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_approved boolean;
begin
  -- Idempotencia: si ya está aprobado y llega 'approved' otra vez, no hacer nada.
  select payment_status = 'approved'
    into v_already_approved
    from orders
   where id = p_order_id;

  -- Upsert payment usando mp_payment_id como clave de idempotencia
  insert into payments (
    order_id, method, status, amount, mp_payment_id, mp_status, mp_status_detail,
    raw_payload, paid_at
  )
  values (
    p_order_id, 'mercadopago', p_status, p_amount, p_mp_payment_id,
    p_status::text, p_status_detail, p_raw,
    case when p_status = 'approved' then now() else null end
  )
  on conflict (mp_payment_id) do update set
    status            = excluded.status,
    mp_status         = excluded.mp_status,
    mp_status_detail  = excluded.mp_status_detail,
    raw_payload       = excluded.raw_payload,
    paid_at           = case
                          when excluded.status = 'approved' and payments.paid_at is null
                          then now()
                          else payments.paid_at
                        end,
    updated_at        = now();

  -- Actualizar order según status
  if p_status = 'approved' and not coalesce(v_already_approved, false) then
    update orders
       set payment_status = 'approved',
           status = case
                      when status = 'pending' then 'confirmed'
                      else status
                    end,
           confirmed_at = coalesce(confirmed_at, now())
     where id = p_order_id;

    -- Crear delivery row si no existe (queda 'unassigned')
    insert into deliveries (order_id, status)
    values (p_order_id, 'unassigned')
    on conflict (order_id) do nothing;

  elsif p_status = 'rejected' then
    update orders set payment_status = 'rejected' where id = p_order_id;

  elsif p_status = 'refunded' then
    update orders
       set payment_status = 'refunded',
           status = case when status not in ('delivered','completed','cancelled')
                         then 'cancelled' else status end
     where id = p_order_id;

  elsif p_status = 'cancelled' then
    update orders
       set payment_status = 'cancelled',
           status = 'cancelled',
           cancelled_by = coalesce(cancelled_by, 'system')
     where id = p_order_id and status = 'pending';
  end if;
end;
$$;
