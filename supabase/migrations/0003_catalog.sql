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
  price_delta   numeric(12,2) not null default 0
);

create index product_modifiers_product_idx on public.product_modifiers(product_id);
create index pmo_modifier_idx on public.product_modifier_options(modifier_id);

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
