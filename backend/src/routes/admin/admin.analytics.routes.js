// src/routes/admin/admin.analytics.routes.js
// Replaces the original — adds /summary with all dashboard stat card values
// and /top-customers for the internal-only leaderboard.
'use strict';

const router    = require('express').Router();
const { query } = require('../../config/db');
const { requireStaff } = require('../../middleware/adminAuth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/summary
// All values needed for the 4 stat cards + 7-day revenue sparkline.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', requireStaff, async (req, res, next) => {
  try {
    const [
      revenueRow,
      ordersRow,
      customersRow,
      newsletterRow,
      revenue7dRows,
    ] = await Promise.all([

      // All-time total revenue
      query(`
        SELECT COALESCE(SUM(total), 0) AS total_revenue
        FROM   orders
        WHERE  payment_status = 'paid'
      `),

      // Orders today
      query(`
        SELECT COUNT(*) AS orders_today
        FROM   orders
        WHERE  created_at::date = CURRENT_DATE
      `),

      // Total registered customers
      query(`SELECT COUNT(*) AS total_customers FROM users`),

      // Active newsletter subscribers
      query(`
        SELECT COUNT(*) AS newsletter_count
        FROM   newsletter_subscribers
        WHERE  is_active = true
           OR  subscribed = true
      `),

      // Last 7 days revenue — one row per day
      query(`
        SELECT
          TO_CHAR(day, 'Dy')           AS label,
          COALESCE(SUM(o.total), 0)    AS total
        FROM   generate_series(
                 CURRENT_DATE - INTERVAL '6 days',
                 CURRENT_DATE,
                 INTERVAL '1 day'
               ) AS day
        LEFT   JOIN orders o
               ON  o.created_at::date = day::date
               AND o.payment_status   = 'paid'
        GROUP  BY day
        ORDER  BY day ASC
      `),
    ]);

    const revenue7d      = revenue7dRows.rows;
    const revenue7dTotal = revenue7d.reduce((s, r) => s + parseFloat(r.total), 0);

    res.json({
      success:          true,
      total_revenue:    parseFloat(revenueRow.rows[0].total_revenue),
      orders_today:     parseInt(ordersRow.rows[0].orders_today),
      total_customers:  parseInt(customersRow.rows[0].total_customers),
      newsletter_count: parseInt(newsletterRow.rows[0].newsletter_count),
      revenue_7d:       revenue7d,
      revenue_7d_total: revenue7dTotal,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/top-customers
// Top 10 customers by total spend — internal only, never shown on frontend.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/top-customers', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        u.id,
        COALESCE(u.full_name, u.first_name || ' ' || COALESCE(u.last_name, '')) AS full_name,
        u.email,
        u.phone,
        u.loyalty_points,
        u.loyalty_tier,
        COUNT(o.id)::int               AS order_count,
        COALESCE(SUM(o.total), 0)      AS total_spent,
        MAX(o.created_at)              AS last_order_at
      FROM   users u
      LEFT   JOIN orders o ON o.user_id = u.id AND o.payment_status = 'paid'
      GROUP  BY u.id
      HAVING COUNT(o.id) > 0
      ORDER  BY total_spent DESC
      LIMIT  10
    `);

    res.json({ success: true, customers: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// Keep existing routes: /revenue, /top-products, /payment-methods
// ─────────────────────────────────────────────────────────────────────────────
router.get('/revenue', requireStaff, async (req, res, next) => {
  try {
    const days = req.query.period === '7d' ? 7 : req.query.period === '90d' ? 90 : 30;
    const { rows } = await query(`
      SELECT
        DATE(created_at AT TIME ZONE 'Africa/Kampala') AS date,
        COALESCE(SUM(total), 0)                        AS revenue,
        COUNT(*)                                       AS order_count
      FROM   orders
      WHERE  payment_status = 'paid'
        AND  created_at >= NOW() - INTERVAL '${days} days'
      GROUP  BY DATE(created_at AT TIME ZONE 'Africa/Kampala')
      ORDER  BY date ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/top-products', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        p.id,
        p.name,
        COALESCE(first_img.url, '') AS image_url,
        SUM(oi.quantity)::int        AS units_sold,
        SUM(oi.line_total)           AS revenue
      FROM   order_items oi
      JOIN   products p ON p.id = oi.product_id
      JOIN   orders o   ON o.id = oi.order_id AND o.payment_status = 'paid'
      LEFT   JOIN LATERAL (
        SELECT url FROM product_images
        WHERE  product_id = p.id
        ORDER  BY sort_order ASC
        LIMIT  1
      ) first_img ON true
      GROUP  BY p.id, p.name, first_img.url
      ORDER  BY units_sold DESC
      LIMIT  6
    `);
    res.json({ success: true, products: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/orders-by-status
// Order count breakdown by status.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/orders-by-status', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/zone-breakdown
// Orders and delivery revenue per delivery zone (only zones with orders).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/zone-breakdown', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        dz.name                          AS zone_name,
        COUNT(o.id)::int                 AS order_count,
        COALESCE(SUM(o.delivery_fee), 0) AS delivery_revenue
      FROM delivery_zones dz
      LEFT JOIN orders o ON o.delivery_zone_id = dz.id
                        AND o.payment_status = 'paid'
      WHERE dz.is_active = true
      GROUP BY dz.id, dz.name
      HAVING COUNT(o.id) > 0
      ORDER BY order_count DESC
    `);

    res.json({ success: true, zones: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/heatmap
// Order activity heatmap: day of week × hour of day over last 90 days.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/heatmap', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        EXTRACT(DOW FROM created_at AT TIME ZONE 'Africa/Kampala')::int AS day_of_week,
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'Africa/Kampala')::int AS hour_of_day,
        COUNT(*) AS order_count
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= NOW() - interval '90 days'
      GROUP BY 1, 2
      ORDER BY 1, 2
    `);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/special-days-impact
// Average daily revenue and orders on special days vs normal days.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/special-days-impact', requireStaff, async (req, res, next) => {
  try {
    const [specialRes, normalRes] = await Promise.all([
      query(`
        SELECT
          AVG(daily_revenue) AS avg_revenue,
          AVG(daily_orders) AS avg_orders
        FROM (
          SELECT
            DATE(o.created_at) AS d,
            SUM(o.subtotal) AS daily_revenue,
            COUNT(o.id) AS daily_orders
          FROM orders o
          JOIN special_days sd ON o.created_at::date BETWEEN sd.date_from AND sd.date_to
          WHERE o.payment_status = 'paid' AND sd.is_active = true
          GROUP BY 1
        ) sub
      `),
      query(`
        SELECT
          AVG(daily_revenue) AS avg_revenue,
          AVG(daily_orders) AS avg_orders
        FROM (
          SELECT
            DATE(o.created_at) AS d,
            SUM(o.subtotal) AS daily_revenue,
            COUNT(o.id) AS daily_orders
          FROM orders o
          WHERE o.payment_status = 'paid'
            AND NOT EXISTS (
              SELECT 1 FROM special_days sd
              WHERE sd.is_active = true
                AND o.created_at::date BETWEEN sd.date_from AND sd.date_to
            )
          GROUP BY 1
        ) sub
      `),
    ]);

    res.json({
      success: true,
      special_days: {
        avg_revenue: parseFloat(specialRes.rows[0]?.avg_revenue || 0),
        avg_orders: parseFloat(specialRes.rows[0]?.avg_orders || 0),
      },
      normal_days: {
        avg_revenue: parseFloat(normalRes.rows[0]?.avg_revenue || 0),
        avg_orders: parseFloat(normalRes.rows[0]?.avg_orders || 0),
      },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/customer-growth
// Cumulative new customers over last 90 days.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/customer-growth', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        DATE(created_at AT TIME ZONE 'Africa/Kampala') AS day,
        COUNT(*) AS new_customers,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at AT TIME ZONE 'Africa/Kampala')) AS cumulative
      FROM users
      WHERE is_guest = false
        AND created_at >= NOW() - interval '90 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/admin/analytics/customer-tiers
// Customer breakdown by loyalty tier (Classic, Reserve, Crown).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/customer-tiers', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        loyalty_tier,
        COUNT(*)::int AS tier_count,
        ROUND(AVG(COALESCE(total_spent, 0))::NUMERIC, 0)::int AS avg_spent
      FROM (
        SELECT
          u.loyalty_tier,
          COALESCE(SUM(o.total), 0) AS total_spent
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id AND o.payment_status = 'paid'
        WHERE u.is_guest = false
        GROUP BY u.id, u.loyalty_tier
      ) sub
      GROUP BY loyalty_tier
      ORDER BY
        CASE loyalty_tier
          WHEN 'Crown' THEN 1
          WHEN 'Reserve' THEN 2
          WHEN 'Classic' THEN 3
          ELSE 4
        END
    `);

    res.json({ success: true, tiers: rows });
  } catch (err) { next(err); }
});

module.exports = router;
