-- ================================================================
-- 0011 — Agregar sort_order a modificadores y opciones
-- ================================================================

alter table public.product_modifiers
  add column if not exists sort_order integer not null default 0;

alter table public.product_modifier_options
  add column if not exists sort_order integer not null default 0;
