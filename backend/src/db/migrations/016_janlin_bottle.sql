-- ============================================================
-- Migration 016: Janlin is a drink — sold as a single bottle
-- Replaces the cookie-style "4-Pack / 12-Pack" variants with one
-- "1 Bottle" variant. order_items snapshots label + price and uses
-- ON DELETE SET NULL, so existing order history is preserved.
-- ============================================================

DO $$
DECLARE
  v_product_id UUID;
  v_stock      INT;
BEGIN
  SELECT id INTO v_product_id FROM products WHERE slug = 'janlin';
  IF v_product_id IS NULL THEN
    RETURN;
  END IF;

  -- Preserve whatever stock is currently on hand (max across old variants)
  SELECT COALESCE(MAX(stock_qty), 50) INTO v_stock
  FROM product_variants
  WHERE product_id = v_product_id;

  -- Remove the old pack-style variants
  DELETE FROM product_variants WHERE product_id = v_product_id;

  -- Single per-bottle variant
  INSERT INTO product_variants (product_id, label, price, stock_qty, is_default)
  VALUES (v_product_id, '1 Bottle', 5000, v_stock, true);

  -- Keep the product base price aligned to the bottle price
  UPDATE products SET base_price = 5000, updated_at = NOW() WHERE id = v_product_id;
END $$;
