-- Add quantity options feature tables and columns

-- Add columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS has_quantity_options boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_manual_quantity boolean NOT NULL DEFAULT false;

-- Create product_quantity_options table
CREATE TABLE IF NOT EXISTS public.product_quantity_options (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    integer NOT NULL CHECK (quantity > 0),
  price       numeric(12,2) NOT NULL CHECK (price >= 0),
  is_default  boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS pqo_product_idx ON public.product_quantity_options(product_id);

-- Enable RLS
ALTER TABLE public.product_quantity_options ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can read quantity options" ON public.product_quantity_options;
CREATE POLICY "Anyone can read quantity options" ON public.product_quantity_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store users can manage quantity options" ON public.product_quantity_options;
CREATE POLICY "Store users can manage quantity options" ON public.product_quantity_options FOR ALL USING (
  product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.store_users su ON p.store_id = su.store_id
    WHERE su.user_id = auth.uid()
  )
);