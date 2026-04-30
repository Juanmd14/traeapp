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
