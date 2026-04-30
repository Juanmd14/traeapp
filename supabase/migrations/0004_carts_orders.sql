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
