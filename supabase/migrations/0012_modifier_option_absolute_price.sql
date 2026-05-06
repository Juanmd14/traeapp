-- ================================================================
-- 0012 — Add is_absolute_price to product_modifier_options
-- ================================================================

ALTER TABLE public.product_modifier_options
  ADD COLUMN IF NOT EXISTS is_absolute_price BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.product_modifier_options.is_absolute_price IS
  'When true, price_delta is treated as the total unit price (replacing product base price), not an additive delta.';
