// src/routes/admin/admin.reviews.routes.js
'use strict';

const router = require('express').Router();
const { query } = require('../../config/db');
const { requireStaff } = require('../../middleware/adminAuth');

// GET /v1/admin/reviews?status=pending
router.get('/', requireStaff, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';

    if (status) {
      params.push(status);
      where = `WHERE pr.status = $${params.length}`;
    }

    params.push(parseInt(limit));
    params.push(offset);

    const { rows } = await query(`
      SELECT
        pr.id,
        pr.product_id,
        pr.name,
        pr.rating,
        pr.comment,
        pr.status,
        pr.verified_purchase,
        pr.created_at,
        p.name AS product_name,
        p.slug AS product_slug
      FROM   product_reviews pr
      JOIN   products p ON p.id = pr.product_id
      ${where}
      ORDER  BY pr.created_at DESC
      LIMIT  $${params.length - 1}
      OFFSET $${params.length}
    `, params);

    const countParams = status ? [status] : [];
    const countWhere = status ? 'WHERE pr.status = $1' : '';
    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*) FROM product_reviews pr ${countWhere}`,
      countParams
    );

    res.json({ success: true, reviews: rows, total: parseInt(count) });
  } catch (err) { next(err); }
});

// PATCH /v1/admin/reviews/:id
router.patch('/:id', requireStaff, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be 'approved' or 'rejected'." });
    }

    const { rows: [review] } = await query(`
      UPDATE product_reviews
      SET status = $1
      WHERE id = $2
      RETURNING id, product_id, status
    `, [status, req.params.id]);

    if (!review) return res.status(404).json({ success: false, error: 'Review not found.' });
    res.json({ success: true, review });
  } catch (err) { next(err); }
});

// DELETE /v1/admin/reviews/:id
router.delete('/:id', requireStaff, async (req, res, next) => {
  try {
    const { rows: [review] } = await query(
      'DELETE FROM product_reviews WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!review) return res.status(404).json({ success: false, error: 'Review not found.' });
    res.json({ success: true, deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;