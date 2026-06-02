-- ============================================================
-- Migration 012: Add Drinks category and assign Janlin to it
-- ============================================================

-- 1. Insert Drinks category (idempotent via ON CONFLICT)
INSERT INTO categories (name, slug, description, sort_order)
VALUES ('Drinks', 'drinks', 'Premium handcrafted beverages', 6)
ON CONFLICT (slug) DO NOTHING;

-- 2. Assign Janlin to Drinks category
UPDATE products
SET    category_id = (SELECT id FROM categories WHERE slug = 'drinks'),
       updated_at  = NOW()
WHERE  slug = 'janlin';
