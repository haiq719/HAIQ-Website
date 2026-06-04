'use strict';
// resend.webhook.js
// Handles Resend email event webhooks.
// Automatically unsubscribes bounced/complained contacts.
// Verifies webhook signature to prevent spoofing.

const crypto  = require('crypto');
const router  = require('express').Router();
const { query } = require('../../config/db');
const { logger } = require('../../config/logger');

/**
 * Verify Resend webhook signature using Svix verification.
 * Resend uses Svix for webhook delivery.
 *
 * @param {string} rawBody - Raw request body as string
 * @param {object} headers - Request headers
 * @returns {boolean}
 */
function verifyResendSignature(rawBody, headers) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('RESEND_WEBHOOK_SECRET not configured — skipping signature verification');
    return true;
  }

  const msgId        = headers['svix-id'];
  const msgTimestamp = headers['svix-timestamp'];
  const msgSignature = headers['svix-signature'];

  if (!msgId || !msgTimestamp || !msgSignature) {
    logger.warn('Resend webhook missing Svix headers');
    return false;
  }

  // Reject webhooks older than 5 minutes (replay attack prevention)
  const timestampMs = parseInt(msgTimestamp, 10) * 1000;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    logger.warn('Resend webhook timestamp too old (possible replay attack)', {
      timestamp: msgTimestamp,
      diff: Math.abs(Date.now() - timestampMs)
    });
    return false;
  }

  // Compute expected signature
  const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`;
  // Resend secrets are base64-encoded — strip the "whsec_" prefix
  const secretBytes   = Buffer.from(secret.replace('whsec_', ''), 'base64');
  const expectedSig   = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  // Compare against all provided signatures (there may be multiple)
  const provided = msgSignature.split(' ').map(s => s.split(',')[1]).filter(Boolean);
  return provided.some(sig => {
    try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig)); }
    catch { return false; }
  });
}

// Event types that should trigger automatic unsubscribe
const HARD_UNSUBSCRIBE_EVENTS = new Set(['email.bounced', 'email.complained']);

/**
 * POST /v1/webhooks/resend
 * Receives email delivery events from Resend.
 */
router.post('/', async (req, res) => {
  // Must use raw body for signature verification
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  // Verify signature
  if (!verifyResendSignature(rawBody, req.headers)) {
    logger.warn('Resend webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const eventType = payload.type;                        // e.g. "email.bounced"
  const email     = payload.data?.to?.[0] || payload.data?.to;
  const resendId  = payload.data?.email_id;

  logger.info('Resend webhook received', { eventType, email, resendId });

  // Always respond 200 first — Resend will retry if we take too long
  res.status(200).json({ received: true });

  // Process asynchronously after responding
  setImmediate(async () => {
    try {
      // Hard unsubscribe for bounces and spam complaints
      if (HARD_UNSUBSCRIBE_EVENTS.has(eventType) && email) {
        const normalised = email.toLowerCase();

        await query(
          `UPDATE newsletter_subscribers
           SET is_active = false, subscribed = false
           WHERE email = $1 AND is_active = true`,
          [normalised]
        );

        logger.info(`Auto-unsubscribed ${normalised} due to ${eventType}`);
      }

      // Log event for audit trail
      logger.info(`Email event processed: ${eventType}`, { email, resendId });

    } catch (processingErr) {
      logger.error('Error processing Resend webhook event', {
        eventType,
        email,
        error: processingErr.message
      });
    }
  });
});

module.exports = router;
