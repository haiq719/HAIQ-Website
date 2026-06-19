// admin.analytics.controller.js
const { query } = require('../../config/db');

// ── Summary card stats ────────────────────────────────────────────────────────
const summary = async (req, res, next) => {
  try {
    const [ordersRes, revenueRes, customersRes, pendingRes, todayRes, newsletterRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM orders`),
      query(`
        SELECT
          COALESCE(SUM(total), 0) AS total,
          COALESCE(SUM(subtotal), 0) AS product_total,
          COALESCE(SUM(delivery_fee), 0) AS delivery_total
        FROM orders
        WHERE payment_status = 'paid'
      `),
      query(`SELECT COUNT(*) AS total FROM users WHERE is_guest = false`),
      query(`SELECT COUNT(*) AS total FROM orders WHERE status NOT IN ('delivered','cancelled') AND payment_status = 'paid'`),
      query(`
        SELECT COUNT(*) AS total FROM orders
        WHERE DATE(created_at AT TIME ZONE 'Africa/Kampala') = DATE(NOW() AT TIME ZONE 'Africa/Kampala')
      `),
      query(`SELECT COUNT(*) AS total FROM newsletter_subscribers WHERE is_active = true`),
    ]);

    // This week vs last week revenue
    const thisWeek = await query(`
      SELECT COALESCE(SUM(total), 0) AS amount
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= date_trunc('week', NOW())
    `);
    const lastWeek = await query(`
      SELECT COALESCE(SUM(total), 0) AS amount
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= date_trunc('week', NOW()) - interval '7 days'
        AND created_at <  date_trunc('week', NOW())
    `);

    // Last 7 days revenue, one row per day (for dashboard sparkline).
    // Includes all non-cancelled orders (not just payment_status='paid') so
    // COD-heavy businesses see real activity — COD only flips to 'paid' on delivery.
    const last7 = await query(`
      SELECT
        d::date AS day,
        COALESCE(SUM(o.total), 0) AS total
      FROM generate_series(
        (NOW() AT TIME ZONE 'Africa/Kampala')::date - interval '6 days',
        (NOW() AT TIME ZONE 'Africa/Kampala')::date,
        interval '1 day'
      ) AS d
      LEFT JOIN orders o
        ON DATE(o.created_at AT TIME ZONE 'Africa/Kampala') = d::date
        AND o.status != 'cancelled'
      GROUP BY d::date
      ORDER BY d::date ASC
    `);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenue7d = last7.rows.map(r => ({
      label: dayLabels[new Date(r.day).getDay()],
      total: parseFloat(r.total),
    }));
    const revenue7dTotal = revenue7d.reduce((sum, d) => sum + d.total, 0);

    const thisRevenue = parseFloat(thisWeek.rows[0].amount);
    const lastRevenue = parseFloat(lastWeek.rows[0].amount);
    const weeklyChange = lastRevenue === 0
      ? null
      : Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100);

    res.json({
      success: true,
      summary: {
        total_orders:     parseInt(ordersRes.rows[0].total),
        total_revenue:    parseFloat(revenueRes.rows[0].total),
        product_revenue:  parseFloat(revenueRes.rows[0].product_total),
        delivery_revenue: parseFloat(revenueRes.rows[0].delivery_total),
        total_customers:  parseInt(customersRes.rows[0].total),
        active_orders:    parseInt(pendingRes.rows[0].total),
        orders_today:     parseInt(todayRes.rows[0].total),
        newsletter_count: parseInt(newsletterRes.rows[0].total),
        revenue_this_week: thisRevenue,
        revenue_last_week: lastRevenue,
        weekly_change_pct: weeklyChange,
        revenue_7d:        revenue7d,
        revenue_7d_total:  revenue7dTotal,
      },
    });
  } catch (err) { next(err); }
};

// ── Revenue chart (last 30 days) ──────────────────────────────────────────────
const revenue = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        DATE(created_at AT TIME ZONE 'Africa/Kampala') AS day,
        COALESCE(SUM(total), 0)          AS revenue,
        COALESCE(SUM(subtotal), 0)       AS product_revenue,
        COALESCE(SUM(delivery_fee), 0)   AS delivery_revenue,
        COUNT(*)                         AS orders
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= NOW() - interval '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── Top products by units sold ────────────────────────────────────────────────
const topProducts = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        p.id, p.name, p.slug,
        COALESCE((
          SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ), '') AS image_url,
        SUM(oi.quantity)   AS units_sold,
        SUM(oi.line_total) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders   o ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
      GROUP BY p.id, p.name, p.slug
      ORDER BY units_sold DESC
      LIMIT 6
    `);

    res.json({ success: true, products: rows });
  } catch (err) { next(err); }
};

// ── Top customers by spend ────────────────────────────────────────────────────
const topCustomers = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        u.id,
        COALESCE(u.full_name, u.first_name || ' ' || u.last_name) AS full_name,
        u.email,
        u.phone,
        u.loyalty_tier,
        COUNT(o.id)        AS total_orders,
        SUM(o.total)       AS total_spent,
        MAX(o.created_at)  AS last_order_at
      FROM users u
      JOIN orders o ON o.user_id = u.id
      WHERE o.payment_status = 'paid' AND u.is_guest = false
      GROUP BY u.id, u.full_name, u.first_name, u.last_name, u.email, u.phone,
               u.loyalty_tier
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    res.json({ success: true, customers: rows });
  } catch (err) { next(err); }
};

// ── Payment method breakdown ──────────────────────────────────────────────────
const paymentBreakdown = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        payment_method,
        COUNT(*)         AS count,
        SUM(total)       AS revenue
      FROM orders
      WHERE payment_status = 'paid'
      GROUP BY payment_method
      ORDER BY revenue DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── Orders by status ──────────────────────────────────────────────────────────
const ordersByStatus = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── Orders and revenue breakdown by delivery zone ────────────────────────────
const zoneBreakdown = async (req, res, next) => {
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
};

// ── Order activity heatmap (day of week × hour of day) ──────────────────────
const orderHeatmap = async (req, res, next) => {
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
};

// ── Special days revenue impact comparison ────────────────────────────────────
const specialDaysImpact = async (req, res, next) => {
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
};

// ── Customer growth over time (last 90 days, cumulative) ──────────────────────
const customerGrowth = async (req, res, next) => {
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
};

// ── Customer breakdown by loyalty tier ────────────────────────────────────────
const customerTiers = async (req, res, next) => {
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
};

module.exports = { summary, revenue, topProducts, topCustomers, paymentBreakdown, ordersByStatus, zoneBreakdown, orderHeatmap, specialDaysImpact, customerGrowth, customerTiers };
