// src/routes/admin/admin.newsletter.routes.js
'use strict';

const router    = require('express').Router();
const { query } = require('../../config/db');
const { requireStaff, requireSuperAdmin } = require('../../middleware/adminAuth');
const emailService = require('../../services/email.service');
const { logger }   = require('../../config/logger');

// ── GET /v1/admin/newsletter — list subscribers ──────────────────────────────
router.get('/', requireStaff, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        id, email, name,
        subscribed_at,
        is_active
      FROM   newsletter_subscribers
      ORDER  BY subscribed_at DESC NULLS LAST
    `);
    res.json({ success: true, subscribers: rows });
  } catch (err) { next(err); }
});

// ── POST /v1/admin/newsletter/campaign — send newsletter to all active subscribers
router.post('/campaign', requireSuperAdmin, async (req, res, next) => {
  try {
    const { subject, body_html } = req.body;
    if (!subject || !body_html) {
      return res.status(400).json({ success: false, error: 'subject and body_html are required.' });
    }

    // Get all active subscribers
    const { rows: subs } = await query(`
      SELECT email, name
      FROM   newsletter_subscribers
      WHERE  is_active = true
    `);

    if (subs.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No active subscribers.' });
    }

    // Record the campaign first
    const { rows: [campaign] } = await query(
      `INSERT INTO newsletter_campaigns (subject, body_html, sent_by, recipient_count, sent_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [subject, body_html, req.admin.id, subs.length]
    );

    // Send emails with unsubscribe footer
    let sent = 0;
    let failed = 0;
    const failedEmails = [];

    for (const sub of subs) {
      try {
        await emailService.sendCampaign({
          email:   sub.email,
          subject,
          html:    body_html,
        });
        sent++;
      } catch (e) {
        failed++;
        failedEmails.push({ email: sub.email, error: e.message });
        logger.warn('Campaign email failed', { email: sub.email, error: e.message });
      }
    }

    // Update campaign record with final counts
    await query(
      `UPDATE newsletter_campaigns
       SET sent_count = $1, failed_count = $2, failed_emails = $3
       WHERE id = $4`,
      [sent, failed, JSON.stringify(failedEmails), campaign.id]
    );

    res.json({
      success:     true,
      sent,
      failed,
      total:       subs.length,
      campaign_id: campaign.id,
      message:     failed > 0
        ? `${sent} delivered, ${failed} failed. Check logs for details.`
        : `All ${sent} emails delivered successfully.`,
    });
  } catch (err) { next(err); }
});

// ── POST /v1/admin/newsletter/whatsapp-invite — send WhatsApp group invite via email
router.post('/whatsapp-invite', requireSuperAdmin, async (req, res, next) => {
  try {
    const { invite_link, emails } = req.body;

    if (!invite_link || !emails?.length) {
      return res.status(400).json({ success: false, error: 'invite_link and emails array required.' });
    }

    // Build invite email
    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#1A0A00;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A0A00;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1A0A00;border:1px solid #3D2000;max-width:520px;width:100%;">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #3D2000;text-align:center;">
          <p style="margin:0;color:#B8752A;font-size:28px;font-weight:bold;letter-spacing:0.12em;">HAIQ</p>
          <p style="margin:6px 0 0;color:#8C7355;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;font-family:Arial,sans-serif;">Made For You</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="color:#F2EAD8;font-size:22px;margin:0 0 8px;">Join the HAIQ WhatsApp Group</h2>
          <div style="width:40px;height:2px;background:#B8752A;margin:14px 0 20px;"></div>
          <p style="color:#8C7355;font-size:14px;line-height:1.7;font-family:Arial,sans-serif;margin:0 0 16px;">
            You're invited to the HAIQ inner circle on WhatsApp.
            Get first access to new flavours, special day announcements, and offers — before anyone else.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
            <tr><td style="background:#B8752A;">
              <a href="${invite_link}" style="display:inline-block;padding:14px 32px;color:#1A0A00;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">
                Join WhatsApp Group
              </a>
            </td></tr>
          </table>
          <p style="color:#3D2000;font-size:11px;margin:20px 0 0;font-family:Arial,sans-serif;">
            ${invite_link}
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #3D2000;text-align:center;">
          <p style="margin:0;color:#8C7355;font-size:11px;font-family:Arial,sans-serif;">HAIQ Bakery · Muyenga, Kampala</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
    `;

    let sent = 0;
    for (const email of emails) {
      try {
        await emailService.send({ to: email, subject: 'You\'re invited — HAIQ WhatsApp Group', html });
        sent++;
      } catch (e) {
        logger.warn('WhatsApp invite email failed', { email, error: e.message });
      }
    }

    res.json({ success: true, sent, total: emails.length });
  } catch (err) { next(err); }
});

module.exports = router;
