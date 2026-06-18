const { query, getClient } = require('../../config/db');
const { STATUS_TRANSITIONS, STATUS_LABELS, ORDER_STATUSES } = require('../../config/constants');
const { broadcastStatusUpdate } = require('../orders.controller');
const emailService = require('../../services/email.service');
const { logger } = require('../../config/logger');

async function list(req, res, next) {
  try {
    const { status, payment_method, payment_status, search, date_from, date_to } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);

    const conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`o.status = $${params.length}`); }
    if (payment_method) { params.push(payment_method); conditions.push(`o.payment_method = $${params.length}`); }
    if (payment_status) { params.push(payment_status); conditions.push(`o.payment_status = $${params.length}`); }
    if (date_from) { params.push(date_from); conditions.push(`o.created_at >= $${params.length}`); }
    if (date_to) { params.push(date_to + 'T23:59:59Z'); conditions.push(`o.created_at <= $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(o.first_name ILIKE $${params.length} OR o.last_name ILIKE $${params.length} OR o.email ILIKE $${params.length} OR o.order_number ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, (page - 1) * limit);

    const { rows } = await query(`
      SELECT
        o.id, o.order_number, o.tracking_token, o.first_name, o.last_name,
        o.email, o.phone, o.status, o.payment_status, o.payment_method,
        o.total, o.created_at,
        COUNT(oi.id) AS items_count,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'customer' AND m.is_read = false) AS unread_messages
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN messages m ON m.order_id = o.id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM orders o ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      success: true,
      orders: rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page, limit,
      },
    });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows: [order] } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const [items, payments, messages, events] = await Promise.all([
      query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [order.id]),
      query('SELECT id, payment_method, internal_ref, provider_ref, amount, status, bank_proof_url, created_at FROM payments WHERE order_id = $1 ORDER BY created_at DESC', [order.id]),
      query('SELECT * FROM messages WHERE order_id = $1 ORDER BY created_at ASC', [order.id]),
      query('SELECT * FROM order_events WHERE order_id = $1 ORDER BY created_at ASC', [order.id]),
    ]);

    // Mark customer messages as read
    await query(`UPDATE messages SET is_read = true WHERE order_id = $1 AND sender_type = 'customer'`, [order.id]);

    res.json({
      success: true,
      order: {
        ...order,
        items:    items.rows,
        payments: payments.rows,
        messages: messages.rows,
        events:   events.rows,
      },
    });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = Object.values(ORDER_STATUSES);
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status provided' });
    }

    await client.query('BEGIN');

    // Lock the row for update
    const { rows: [order] } = await client.query(
      'SELECT id, status, payment_method FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Enforce transition rules
    const allowedTransitions = STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Cannot move order from "${order.status}" to "${status}".`,
      });
    }

    // Update order status
    await client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // COD auto-payment — mark the order paid AND reconcile the payment record
    if (order.payment_method === 'cash_on_delivery' && status === 'delivered') {
      await client.query(
        'UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2',
        ['paid', id]
      );
      await client.query(
        `UPDATE payments SET status = 'successful', updated_at = NOW()
         WHERE order_id = $1 AND status NOT IN ('refunded','cancelled')`,
        [id]
      );
    }

    // Log the event
    await client.query(
      `INSERT INTO order_events (order_id, event_type, old_value, new_value, actor_type, actor_id)
       VALUES ($1, 'status_change', $2, $3, 'admin', $4)`,
      [id, order.status, status, req.admin.id]
    );

    await client.query('COMMIT');

    // Broadcast to SSE clients if function available
    if (typeof broadcastStatusUpdate === 'function') {
      broadcastStatusUpdate(id, status);
    }

    return res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    logger.error('updateStatus error:', { error: error.message, orderId: req.params.id });
    return res.status(500).json({ success: false, error: 'Failed to update order status' });
  } finally {
    client.release();
  }
}

async function sendMessage(req, res, next) {
  try {
    const { rows: [order] } = await query('SELECT id FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const { rows: [msg] } = await query(`
      INSERT INTO messages (order_id, sender_type, sender_id, body)
      VALUES ($1, 'admin', $2, $3)
      RETURNING id, created_at
    `, [order.id, req.admin.id, req.body.body]);

    res.status(201).json({ success: true, message_id: msg.id, created_at: msg.created_at });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, updateStatus, sendMessage };
