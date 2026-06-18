// src/routes/admin/admin.messages.routes.js
'use strict';
const router    = require('express').Router();
const { query } = require('../../config/db');
const { requireStaff } = require('../../middleware/adminAuth');
const { validate } = require('../../middleware/validate');
const { z } = require('zod');
const { sendInquiryReply } = require('../../services/email.service');

const emailReplySchema = z.object({
  body: z.string().min(10, 'Reply must be at least 10 characters').max(5000),
});

// ── GET / — list all inquiry messages ────────────────────────────────────────
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
        u.email     AS user_email,
        (
          SELECT COUNT(*) FROM messages r
          WHERE r.sender_type = 'admin'
            AND (r.user_id = m.user_id OR r.order_id = m.order_id)
            AND r.created_at > m.created_at
        ) AS reply_count,
        (
          SELECT r.created_at FROM messages r
          WHERE r.sender_type = 'admin'
            AND (r.user_id = m.user_id OR r.order_id = m.order_id)
            AND r.created_at > m.created_at
          ORDER BY r.created_at DESC LIMIT 1
        ) AS last_replied_at
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

// ── PATCH /:id/read ───────────────────────────────────────────────────────────
router.patch('/:id/read', requireStaff, async (req, res, next) => {
  try {
    await query('UPDATE messages SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── POST /:id/email-reply — send branded email reply to inquiry sender ────────
router.post('/:id/email-reply', requireStaff, validate(emailReplySchema), async (req, res, next) => {
  try {
    const { body: replyBody } = req.body;

    const { rows: [msg] } = await query(
      `SELECT id, user_id, order_id, sender_name, sender_email, subject, body, is_direct
       FROM messages WHERE id = $1`,
      [req.params.id]
    );
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found.' });

    const toEmail = msg.sender_email || null;
    if (!toEmail) {
      return res.status(422).json({ success: false, error: 'This message has no email address to reply to.' });
    }

    // Send the branded email
    await sendInquiryReply({
      toEmail,
      toName:          msg.sender_name || null,
      subject:         msg.subject || null,
      originalMessage: msg.body,
      replyBody,
    });

    // Mark original as read and store admin reply record
    await query('UPDATE messages SET is_read = true WHERE id = $1', [req.params.id]);
    await query(`
      INSERT INTO messages (user_id, order_id, sender_type, sender_id, body, is_direct, is_read, sender_email)
      VALUES ($1, $2, 'admin', $3, $4, $5, true, $6)
    `, [
      msg.user_id,
      msg.order_id,
      req.admin.id,
      replyBody.trim(),
      msg.is_direct || false,
      toEmail,
    ]);

    res.status(200).json({ success: true, sent_to: toEmail });
  } catch (err) { next(err); }
});

module.exports = router;
