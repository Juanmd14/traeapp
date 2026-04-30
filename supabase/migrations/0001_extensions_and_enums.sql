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
