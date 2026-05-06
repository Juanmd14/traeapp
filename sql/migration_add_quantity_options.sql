-- Migration: Add quantity options and removal modifiers support
-- Date: 2026-05-06

-- 1. Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_quantity_options boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_manual_quantity boolean DEFAULT false;

-- 2. Add is_removal column to product_modifier_options
ALTER TABLE product_modifier_options 
ADD COLUMN IF NOT EXISTS is_removal boolean DEFAULT false;

-- 3. Create product_quantity_options table
CREATE TABLE IF NOT EXISTS product_quantity_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price integer NOT NULL,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_quantity_options_product_id 
ON product_quantity_options(product_id);

CREATE INDEX IF NOT EXISTS idx_product_modifier_options_is_removal 
ON product_modifier_options(is_removal);

-- 5. Enable Row Level Security (optional, based on existing policies)
ALTER TABLE product_quantity_options ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for product_quantity_options (similar to existing product policies)
-- Note: Adjust based on your existing RLS policies for products

/*
-- Example policy for allowing read access:
CREATE POLICY "Users can view quantity options" ON product_quantity_options
  FOR SELECT USING (true);

-- Example policy for allowing store owners to manage:
CREATE POLICY "Store owners can manage quantity options" ON product_quantity_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM store_users 
      WHERE store_users.store_id = products.store_id 
      AND store_users.user_id = auth.uid()
    )
  );
*/