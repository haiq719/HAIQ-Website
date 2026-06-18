const { query } = require('../config/db');

async function create(req, res, next) {
  try {
    const { order_id, body, email, name, subject, first_name, last_name } = req.body;
    const sender_id = req.user?.id || null;

    // Determine sender type and fields
    const is_contact_form = !sender_id;  // Contact form has no authenticated user
    const sender_type = is_contact_form ? 'contact_form' : 'customer';

    // For contact forms, extract first/last names from name field or use the provided first_name/last_name
    const sender_name = is_contact_form
      ? (name || `${first_name || ''} ${last_name || ''}`.trim())
      : null;
    const sender_email = is_contact_form ? email : null;

    const { rows: [msg] } = await query(`
      INSERT INTO messages (
        order_id, sender_type, sender_id, body, sender_name, sender_email, subject, is_direct
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `, [
      order_id || null,
      sender_type,
      sender_id,
      body,
      sender_name,
      sender_email,
      subject || null,
      is_contact_form,
    ]);

    res.status(201).json({ success: true, message_id: msg.id, created_at: msg.created_at });
  } catch (err) { next(err); }
}

async function getThread(req, res, next) {
  try {
    // Allow access with tracking token header for guests
    const trackingToken = req.headers['x-tracking-token'];
    if (!req.user && trackingToken) {
      const { rows: [order] } = await query(
        'SELECT id FROM orders WHERE id = $1 AND tracking_token = $2',
        [req.params.order_id, trackingToken]
      );
      if (!order) return res.status(403).json({ success: false, error: 'Invalid access token' });
    } else if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { rows } = await query(`
      SELECT id, sender_type, body, is_read, created_at
      FROM messages WHERE order_id = $1 ORDER BY created_at ASC
    `, [req.params.order_id]);

    res.json({ success: true, messages: rows });
  } catch (err) { next(err); }
}

module.exports = { create, getThread };
