const bcrypt = require('bcryptjs');
const { query } = require('../../config/db');

async function listStaff(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, email, full_name, role, is_active, last_login, created_at
       FROM admin_users
       ORDER BY created_at ASC`
    );
    res.json({ success: true, staff: rows });
  } catch (err) { next(err); }
}

async function createStaff(req, res, next) {
  try {
    const { email, full_name, password, role = 'staff' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, error: 'email, full_name and password are required' });
    }
    if (!['staff', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'role must be staff or superadmin' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const existing = await query('SELECT id FROM admin_users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with that email already exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows: [created] } = await query(
      `INSERT INTO admin_users (email, full_name, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [email.toLowerCase(), full_name.trim(), hash, role]
    );

    res.status(201).json({ success: true, staff: created });
  } catch (err) { next(err); }
}

async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    // Prevent a superadmin from demoting themselves
    if (id === req.admin.id && role === 'staff') {
      return res.status(400).json({ success: false, error: 'You cannot demote your own account' });
    }
    // Prevent deactivating your own account
    if (id === req.admin.id && is_active === false) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); values.push(full_name.trim()); }
    if (role      !== undefined) {
      if (!['staff', 'superadmin'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
      }
      fields.push(`role = $${idx++}`); values.push(role);
    }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'Nothing to update' });
    }

    values.push(id);
    const { rows: [updated] } = await query(
      `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, email, full_name, role, is_active, last_login, created_at`,
      values
    );

    if (!updated) return res.status(404).json({ success: false, error: 'Staff member not found' });
    res.json({ success: true, staff: updated });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    const { rows: [updated] } = await query(
      `UPDATE admin_users SET password_hash = $1 WHERE id = $2
       RETURNING id, email, full_name`,
      [hash, id]
    );

    if (!updated) return res.status(404).json({ success: false, error: 'Staff member not found' });
    res.json({ success: true, message: `Password reset for ${updated.email}` });
  } catch (err) { next(err); }
}

module.exports = { listStaff, createStaff, updateStaff, resetPassword };
