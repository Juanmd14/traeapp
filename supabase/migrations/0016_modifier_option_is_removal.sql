-- ================================================================
-- 0016 — Add is_removal to product_modifier_options
-- ================================================================
-- El código (upsertModifiersAction + queries del shop/panel) inserta y lee
-- product_modifier_options.is_removal, pero ninguna migración previa creaba
-- la columna. Si la DB no la tenía, TODO insert de modificadores fallaba y,
-- como upsertModifiersAction borra antes de insertar, el comercio perdía los
-- modificadores (ej: sabores) sin ver ningún error.

ALTER TABLE public.product_modifier_options
  ADD COLUMN IF NOT EXISTS is_removal BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.product_modifier_options.is_removal IS
  'When true, the option represents removing an ingredient (no price impact), not adding one.';
