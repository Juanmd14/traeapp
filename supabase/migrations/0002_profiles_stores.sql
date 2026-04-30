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
