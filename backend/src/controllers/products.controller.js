const { query } = require('../config/db');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../config/constants');

// Fixed UUID for the virtual Box Office product — must match orders.controller.js
const BOX_OFFICE_PRODUCT_UUID = '00000000-0000-4000-a000-000000000001';
const BOX_OFFICE_VARIANT_UUID = '00000000-0000-4000-a000-000000000002';

const PRODUCT_SELECT = `
  SELECT
    p.id, p.slug, p.name, p.subtitle, p.description, p.tasting_notes,
    p.base_price, p.off_peak_price, p.is_active, p.is_featured, p.is_limited,
    p.is_box_item, p.sort_order, p.created_at, p.updated_at,
    json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
    COALESCE(
      json_agg(DISTINCT jsonb_build_object(
        'id', pi.id, 'url', pi.url, 'alt_text', pi.alt_text, 'sort_order', pi.sort_order
      )) FILTER (WHERE pi.id IS NOT NULL), '[]'
    ) AS images,
    COALESCE(
      json_agg(DISTINCT jsonb_build_object(
        'id', pv.id, 'label', pv.label, 'price', pv.price,
        'stock_qty', pv.stock_qty, 'is_default', pv.is_default, 'sku', pv.sku
      )) FILTER (WHERE pv.id IS NOT NULL), '[]'
    ) AS variants,
    COALESCE(
      json_agg(DISTINCT jsonb_build_object(
        'label', pit.label, 'sort_order', pit.sort_order
      ) ORDER BY jsonb_build_object('label', pit.label, 'sort_order', pit.sort_order)) FILTER (WHERE pit.id IS NOT NULL), '[]'
    ) AS items
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_images pi ON pi.product_id = p.id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  LEFT JOIN product_items pit ON pit.product_id = p.id
`;

async function list(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    const conditions = ['p.is_active = true'];
    const params = [];

    if (req.query.category) {
      params.push(req.query.category);
      conditions.push(`c.slug = $${params.length}`);
    }
    if (req.query.featured === 'true') conditions.push('p.is_featured = true');

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sortMap = {
      price_asc:  'p.base_price ASC',
      price_desc: 'p.base_price DESC',
      name_asc:   'p.name ASC',
      sort_order: 'p.sort_order ASC',
    };
    const orderBy = sortMap[req.query.sort] || 'p.sort_order ASC';

    params.push(limit, offset);

    const { rows } = await query(`
      ${PRODUCT_SELECT}
      ${whereClause}
      GROUP BY p.id, c.id
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) AS total FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
    `, params.slice(0, -2));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      products: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
}

async function featured(req, res, next) {
  try {
    const { rows } = await query(`
      ${PRODUCT_SELECT}
      WHERE p.is_active = true AND p.is_featured = true
      GROUP BY p.id, c.id
      ORDER BY p.sort_order ASC
      LIMIT 3
    `);
    res.json({ success: true, products: rows });
  } catch (err) { next(err); }
}

async function getBySlug(req, res, next) {
  try {
    const { rows } = await query(`
      ${PRODUCT_SELECT}
      WHERE p.slug = $1 AND p.is_active = true
      GROUP BY p.id, c.id
    `, [req.params.slug]);

    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: rows[0] });
  } catch (err) { next(err); }
}

async function boxOffice(req, res, next) {
  // Returns the virtual Box Office product for Build Your Box feature.
  // IDs are fixed well-known UUIDs so they pass Zod uuid() validation at order time.
  const product = {
    id: BOX_OFFICE_PRODUCT_UUID,
    slug: 'box-office',
    name: 'Box Office',
    subtitle: 'Build Your Own Box',
    description: 'Create your perfect box of 4 cookies',
    tasting_notes: '',
    base_price: 40000,
    off_peak_price: 80000,
    is_active: true,
    is_featured: false,
    is_limited: false,
    sort_order: 999,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: null,
    images: [],
    variants: [
      { id: BOX_OFFICE_VARIANT_UUID, label: 'Standard Box', price: 80000, stock_qty: 999, is_default: true, sku: 'BOX-001' }
    ],
    items: []
  };
  res.json({ success: true, product });
}

module.exports = { list, featured, getBySlug, boxOffice };
