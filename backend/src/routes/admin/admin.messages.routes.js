// src/routes/admin/admin.messages.routes.js
'use strict';
const router    = require('express').Router();
const { optionalAdminAuth, requireStaff } = require('../../middleware/adminAuth');
const messagesCtrl = require('../../controllers/admin/admin.messages.controller');
const { validate } = require('../../middleware/validate');
const { adminMessageReplySchema } = require('../../middleware/schemas');

// ── GET / — list all message threads (direct + order-linked + contact form) ──
router.get('/', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        m.id,
        m.order_id,
        m.user_id,
        m.sender_type,
        m.subject,
        m.body,
        m.is_read,
        m.is_direct,
        m.sender_name,
        m.sender_email,
        m.created_at,
        o.order_number,
        o.first_name || ' ' || o.last_name AS order_customer,
        u.full_name AS user_name,
        u.email     AS user_email
      FROM messages m
      LEFT JOIN orders o ON o.id = m.order_id
      LEFT JOIN users  u ON u.id = m.user_id
      WHERE m.sender_type IN ('customer', 'contact_form')
        AND (m.is_direct = true OR m.order_id IS NOT NULL OR m.sender_type = 'contact_form')
      ORDER BY m.created_at DESC
    `);

    res.json({ success: true, messages: rows });
  } catch (err) { next(err); }
});

// ── GET /thread/:user_id — direct message thread with a user ─────────────────
router.get('/thread/:user_id', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, sender_type, body, is_read, created_at, subject
      FROM messages
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [req.params.user_id]);

    // Mark all as read
    await query(
      `UPDATE messages SET is_read = true
       WHERE user_id = $1 AND sender_type = 'customer'`,
      [req.params.user_id]
    );

    res.json({ success: true, messages: rows });
  } catch (err) { next(err); }
});

// ── GET /order-thread/:order_id ───────────────────────────────────────────────
router.get('/order-thread/:order_id', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, sender_type, body, is_read, created_at
      FROM messages WHERE order_id = $1 ORDER BY created_at ASC
    `, [req.params.order_id]);

    await query(
      `UPDATE messages SET is_read = true WHERE order_id = $1 AND sender_type = 'customer'`,
      [req.params.order_id]
    );

    res.json({ success: true, messages: rows });
  } catch (err) { next(err); }
});

// ── PATCH /:id/read ───────────────────────────────────────────────────────────
router.patch('/:id/read', requireStaff, async (req, res, next) => {
  try {
    await query('UPDATE messages SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── POST /:id/reply — admin replies to a message ─────────────────────────────
router.post('/:id/reply', requireStaff, validate(adminMessageReplySchema), async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, error: 'Reply body required.' });

    // Get original message to get user_id / order_id
    const { rows: [original] } = await query(
      'SELECT user_id, order_id, is_direct FROM messages WHERE id = $1',
      [req.params.id]
    );
    if (!original) return res.status(404).json({ success: false, error: 'Message not found.' });

    const { rows: [reply] } = await query(`
      INSERT INTO messages (user_id, order_id, sender_type, sender_id, body, is_direct, is_read)
      VALUES ($1, $2, 'admin', $3, $4, $5, true)
      RETURNING id, created_at
    `, [
      original.user_id,
      original.order_id,
      req.admin.id,
      body.trim(),
      original.is_direct || false,
    ]);

    res.status(201).json({ success: true, reply });
  } catch (err) { next(err); }
});

module.exports = router;
