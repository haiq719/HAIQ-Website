// auth.controller.js — full version with updateProfile & changePassword
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');
const { logger } = require('../config/logger');
const { generateGuestToken, generateResetToken } = require('../utils/tokenGenerator');
const emailService = require('../services/email.service');

function signAccessToken(userId, email) {
  const jti = require('crypto').randomUUID();
  return jwt.sign(
    { sub: userId, email, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
}

// ── Split "Amara Nakato" → { first: "Amara", last: "Nakato" } ─────────────────
function splitFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] || '';
  const last  = parts.slice(1).join(' ') || '';
  return { first, last };
}

// ── Register ─────────────────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { email, password, full_name, first_name, last_name, phone } = req.body;

    const resolvedFullName = full_name
      ? full_name.trim()
      : `${first_name || ''} ${last_name || ''}`.trim();

    const { first: fn, last: ln } = splitFullName(resolvedFullName);

    if (!resolvedFullName || !resolvedFullName.includes(' ')) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your full name (first and last name).',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    if (!/[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?\/\\`~]/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must include at least one special character.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows: [user] } = await query(
      `INSERT INTO users
         (email, phone, first_name, last_name, full_name, password_hash, is_guest, consent_given)
       VALUES ($1, $2, $3, $4, $5, $6, false, true)
       RETURNING id, email, first_name, last_name, full_name`,
      [email.toLowerCase(), phone || null, fn, ln, resolvedFullName, password_hash]
    );

    emailService.sendWelcome(user).catch(err =>
      logger.error('Welcome email failed', { error: err.message })
    );

    res.status(201).json({
      success: true,
      message: 'Account created. Welcome to HAIQ!',
      user: { id: user.id, email: user.email },
    });
  } catch (err) { next(err); }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { rows: [user] } = await query(
      `SELECT id, email, first_name, last_name, full_name, password_hash,
              is_guest, loyalty_tier, loyalty_status
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const access_token  = signAccessToken(user.id, user.email);
    const refresh_token = signRefreshToken(user.id);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure:   true,
      sameSite: 'none',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      access_token,
      user: {
        id:             user.id,
        email:          user.email,
        full_name:      user.full_name || `${user.first_name} ${user.last_name}`.trim(),
        first_name:     user.first_name,
        last_name:      user.last_name,
        loyalty_tier:   user.loyalty_tier,
        loyalty_status: user.loyalty_status,
      },
    });
  } catch (err) { next(err); }
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    const payload = jwt.decode(req.headers.authorization?.slice(7));
    if (payload?.jti) {
      await query(
        'INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT DO NOTHING',
        [payload.jti, payload.exp]
      );
    }
    res.clearCookie('refresh_token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

// ── Refresh ───────────────────────────────────────────────────────────────────
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ success: false, error: 'No refresh token' });

    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const { rows: [user] } = await query('SELECT id, email FROM users WHERE id = $1', [payload.sub]);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const access_token = signAccessToken(user.id, user.email);
    const new_refresh_token = signRefreshToken(user.id);

    res.cookie('refresh_token', new_refresh_token, {
      httpOnly: true,
      secure:   true,
      sameSite: 'none',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, access_token });
  } catch {
    return res.status(401).json({ success: false, error: 'Refresh token invalid or expired' });
  }
}

// ── Forgot Password ───────────────────────────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const { rows: [user] } = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (user) {
      const token = generateResetToken();
      await query(
        'UPDATE users SET guest_token = $1, updated_at = NOW() WHERE id = $2',
        [token, user.id]
      );
      emailService.sendPasswordReset(email, token).catch(err =>
        logger.error('Reset email failed', { error: err.message })
      );
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
}

// ── Reset Password ────────────────────────────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const { rows: [user] } = await query('SELECT id FROM users WHERE guest_token = $1', [token]);
    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });

    const password_hash = await bcrypt.hash(password, 12);
    await query(
      'UPDATE users SET password_hash = $1, guest_token = NULL, updated_at = NOW() WHERE id = $2',
      [password_hash, user.id]
    );
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
}

// ── Get Me ────────────────────────────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const { rows: [user] } = await query(
      `SELECT id, email, first_name, last_name, full_name, phone,
              email_verified, loyalty_tier, loyalty_status, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.full_name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();

    res.json({ success: true, user });
  } catch (err) { next(err); }
}

// ── Update Profile ─────────────────────────────────────────────────────────────
async function updateProfile(req, res, next) {
  try {
    const { full_name, first_name, last_name, phone } = req.body;
    const userId = req.user.id;

    let finalFullName = full_name;
    if (!finalFullName && (first_name || last_name)) {
      finalFullName = `${first_name || ''} ${last_name || ''}`.trim();
    }

    const { rows: [user] } = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           phone = COALESCE($4, phone),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, full_name, phone`,
      [finalFullName, first_name || null, last_name || null, phone || null, userId]
    );

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
    });
  } catch (err) { next(err); }
}

// ── Change Password ────────────────────────────────────────────────────────────
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    const { rows: [user] } = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { next(err); }
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};