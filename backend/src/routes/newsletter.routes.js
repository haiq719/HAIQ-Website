// src/routes/newsletter.routes.js
'use strict';
const router = require('express').Router();
const { query } = require('../config/db');
const { logger } = require('../config/logger');
const { optionalAuth } = require('../middleware/auth');
const { newsletterLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const { newsletterSubscribeSchema } = require('../middleware/schemas');
const { validateEmailDeliverability } = require('../utils/emailValidator');
const resendAudience = require('../services/resend.audience.service');

router.post('/subscribe', newsletterLimiter, optionalAuth, validate(newsletterSubscribeSchema), async (req, res, next) => {
  try {
    const { email, name } = req.body;

    const normalised = email.trim().toLowerCase();

    // Email deliverability check
    const emailCheck = await validateEmailDeliverability(normalised);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, error: emailCheck.reason });
    }

    // Check for existing subscription
    const { rows: [existing] } = await query(
      'SELECT id, is_active, subscribed FROM newsletter_subscribers WHERE email = $1',
      [normalised]
    );

    if (existing) {
      const isActive = existing.is_active ?? existing.subscribed;
      if (isActive) {
        // Already subscribed — return a clear message without re-sending email
        return res.json({
          success:  true,
          already:  true,
          message:  'This email is already subscribed.',
        });
      }
      // Was unsubscribed — reactivate
      await query(
        'UPDATE newsletter_subscribers SET is_active = true, subscribed = true, name = $1 WHERE id = $2',
        [name.trim(), existing.id]
      );
    } else {
      await query(
        'INSERT INTO newsletter_subscribers (email, name) VALUES ($1, $2)',
        [normalised, name.trim()]
      );
    }

    // Welcome email (non-blocking)
    try {
      const emailService = require('../services/email.service');
      await emailService.sendNewsletterWelcome({ email: normalised, name: name.trim() });
    } catch (emailErr) {
      logger.warn('Newsletter welcome email failed', { email: normalised, error: emailErr.message });
    }

    // Sync to Resend Audience (non-blocking)
    resendAudience.addContact(normalised, name.trim()).catch(err =>
      logger.warn('Resend Audience sync failed on subscribe', { email: normalised, error: err.message })
    );

    return res.status(201).json({ success: true, already: false, message: 'Subscribed successfully.' });
  } catch (err) {
    next(err);
  }
});

// ── GET /unsubscribe?token=<base64email> — one-click unsubscribe ─────────────
router.get('/unsubscribe', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token.');

    const email = Buffer.from(token, 'base64url').toString('utf-8').toLowerCase();
    const { rowCount } = await query(
      `UPDATE newsletter_subscribers SET is_active = false, subscribed = false WHERE email = $1`,
      [email]
    );

    // Sync unsubscribe to Resend Audience (non-blocking)
    resendAudience.removeContact(email).catch(err =>
      logger.warn('Resend Audience sync failed on unsubscribe', { email, error: err.message })
    );

    // Render a simple branded confirmation page
    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Unsubscribed | HAIQ</title></head>
<body style="margin:0;padding:60px 20px;background:#1A0A00;font-family:Georgia,serif;text-align:center;">
  <p style="color:#B8752A;font-size:28px;font-weight:bold;letter-spacing:0.12em;">HAIQ</p>
  <p style="color:#F2EAD8;font-size:20px;margin:24px 0 8px;">You've been unsubscribed.</p>
  <p style="color:#8C7355;font-size:14px;">${rowCount ? 'You will no longer receive newsletter emails from us.' : 'This email was not found in our list.'}</p>
  <a href="${process.env.FRONTEND_URL || 'https://haiqweb.vercel.app'}" style="display:inline-block;margin-top:32px;padding:14px 32px;background:#B8752A;color:#1A0A00;font-size:11px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">Back to HAIQ</a>
</body></html>`);
  } catch (err) { next(err); }
});

module.exports = router;
