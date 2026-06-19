// src/routes/admin/admin.loyalty.routes.js
'use strict';
const router        = require('express').Router();
const { query }     = require('../../config/db');
const { requireStaff, requireSuperAdmin } = require('../../middleware/adminAuth');
const emailService  = require('../../services/email.service');
const { logger }    = require('../../config/logger');

// ── GET / — list cards (optional ?status=pending|approved|dispatched|delivered) ──
router.get('/', requireStaff, async (req, res, next) => {
  try {
    const { status } = req.query;
    const conditions = status ? `WHERE lc.status = $1` : '';
    const params     = status ? [status] : [];

    const { rows } = await query(`
      SELECT
        lc.id, lc.status, lc.card_number, lc.delivery_address, lc.contact_phone,
        lc.applied_at, lc.dispatched_at, lc.delivered_at,
        u.full_name, u.email, u.phone
      FROM loyalty_cards lc
      JOIN users u ON u.id = lc.user_id
      ${conditions}
      ORDER BY lc.applied_at DESC
    `, params);

    res.json({ success: true, cards: rows });
  } catch (err) { next(err); }
});

// ── PATCH /:id — approve / reject / dispatch / deliver ─────────────────────
router.patch('/:id', requireStaff, async (req, res, next) => {
  try {
    const { action, card_number, admin_notes } = req.body;

    const { rows: [card] } = await query(`
      SELECT lc.*, u.email, u.full_name
      FROM loyalty_cards lc
      JOIN users u ON u.id = lc.user_id
      WHERE lc.id = $1
    `, [req.params.id]);

    if (!card) return res.status(404).json({ success: false, error: 'Card not found.' });

    const transitions = {
      pending:    ['approve', 'reject'],
      approved:   ['dispatch'],
      dispatched: ['deliver'],
    };

    if (!transitions[card.status]?.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Cannot "${action}" a card with status "${card.status}".`,
      });
    }

    // Build update
    const updates = {};
    if (action === 'approve') {
      updates.status      = 'approved';
      updates.card_number = card_number?.trim() || `HAIQ-${Date.now().toString(36).toUpperCase()}`;
    } else if (action === 'reject') {
      updates.status = 'rejected';
    } else if (action === 'dispatch') {
      updates.status       = 'dispatched';
      updates.dispatched_at = 'NOW()';
    } else if (action === 'deliver') {
      updates.status      = 'delivered';
      updates.delivered_at = 'NOW()';
    }

    // Build dynamic SQL
    const setClauses = Object.entries(updates)
      .filter(([, v]) => v !== 'NOW()')
      .map(([k], i) => `${k} = $${i + 2}`)
    const setNow = Object.entries(updates)
      .filter(([, v]) => v === 'NOW()')
      .map(([k]) => `${k} = NOW()`)
    const allSet = [...setClauses, ...setNow].join(', ')
    const values = [req.params.id, ...Object.entries(updates).filter(([, v]) => v !== 'NOW()').map(([, v]) => v)]

    await query(`UPDATE loyalty_cards SET ${allSet} WHERE id = $1`, values);

    // Send email notification (non-blocking)
    const name = card.full_name?.split(' ')[0] || 'there';
    if (action === 'approve') {
      emailService.sendLoyaltyApproved({ email: card.email, name, cardNumber: updates.card_number })
        .catch(e => logger.warn('Loyalty approved email failed', { error: e.message }));
    } else if (action === 'reject') {
      emailService.sendLoyaltyRejected({ email: card.email, name })
        .catch(e => logger.warn('Loyalty rejected email failed', { error: e.message }));
    } else if (action === 'dispatch') {
      emailService.sendLoyaltyDispatched({ email: card.email, name, deliveryAddress: card.delivery_address })
        .catch(e => logger.warn('Loyalty dispatched email failed', { error: e.message }));
    }

    res.json({ success: true, action, card_id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;
