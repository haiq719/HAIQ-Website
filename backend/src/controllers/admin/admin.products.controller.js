const { query, getClient } = require('../../config/db');
const cloudinary = require('../../config/cloudinary');
const { logger } = require('../../config/logger');

async function list(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT p.*, c.name AS category_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS total_sold
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.sort_order ASC, p.created_at DESC
    `);
    res.json({ success: true, products: rows });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, slug, subtitle, description, tasting_notes, category_id, base_price, off_peak_price, is_featured, is_limited, is_box_item, variants, items } = req.body;

    const { rows: [product] } = await client.query(`
      INSERT INTO products (name, slug, subtitle, description, tasting_notes, category_id, base_price, off_peak_price, is_featured, is_limited, is_box_item)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [name, slug, subtitle, description, tasting_notes, category_id || null, base_price, off_peak_price ?? null, is_featured || false, is_limited || false, is_box_item || false]);

    if (variants?.length) {
      for (const v of variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, label, price, stock_qty, is_default) VALUES ($1,$2,$3,$4,$5)`,
          [product.id, v.label, v.price, v.stock_qty || 0, v.is_default || false]
        );
      }
    }
    if (items?.length) {
      for (let i = 0; i < items.length; i++) {
        await client.query(
          `INSERT INTO product_items (product_id, label, sort_order) VALUES ($1,$2,$3)`,
          [product.id, items[i], i]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, product });
  } catch (err) { 
    try { await client.query('ROLLBACK'); } catch (rollbackErr) {}
    logger.error('Product create error:', { 
      error: err.message,
      code: err.code,
      detail: err.detail,
      body: req.body
    });
    next(err); 
  } finally { 
    client.release(); 
  }
}

async function update(req, res, next) {
  try {
    const allowed = ['name','subtitle','description','tasting_notes','category_id','base_price','off_peak_price','is_featured','is_limited','is_box_item','is_active','sort_order'];
    const updates = [];
    const params = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        params.push(req.body[key]);
        updates.push(`${key} = $${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ success: false, error: 'No fields to update' });

    params.push(req.params.id);
    const { rows: [product] } = await query(
      `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
}

async function toggle(req, res, next) {
  try {
    const { rows: [product] } = await query(
      `UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, is_active`,
      [req.params.id]
    );
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, is_active: product.is_active });
  } catch (err) { next(err); }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image file provided' });
    const b64 = req.file.buffer.toString('base64');
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${b64}`,
      { folder: 'haiq/products', transformation: [{ width: 800, quality: 80, fetch_format: 'webp' }] }
    );
    const { rows: [image] } = await query(
      `INSERT INTO product_images (product_id, url, public_id, alt_text) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, result.secure_url, result.public_id, req.body.alt_text || null]
    );
    res.status(201).json({ success: true, image });
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    await query(`UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, toggle, uploadImage, softDelete };
