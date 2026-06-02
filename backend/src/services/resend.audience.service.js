'use strict';
// resend.audience.service.js
// Manages Resend Audiences/Contacts in sync with our newsletter_subscribers table.

const { Resend } = require('resend');
const { logger } = require('../config/logger');
const { query } = require('../config/db');

let resend = null;
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

function getClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Add a single contact to the Resend audience.
 * Called when a new subscriber joins the newsletter.
 * Silently skips if RESEND_AUDIENCE_ID is not configured.
 *
 * @param {string} email
 * @param {string} [name]
 */
async function addContact(email, name = '') {
  const client = getClient();
  if (!client || !AUDIENCE_ID) {
    logger.info('Resend Audience not configured — skipping addContact', { email });
    return;
  }

  try {
    const [firstName, ...rest] = (name || '').trim().split(' ');
    await client.contacts.create({
      audienceId:  AUDIENCE_ID,
      email:       email.toLowerCase(),
      firstName:   firstName || '',
      lastName:    rest.join(' ') || '',
      unsubscribed: false,
    });
    logger.info('Added contact to Resend Audience', { email });
  } catch (err) {
    // 422 = already exists — treat as success
    if (err?.statusCode === 422 || err?.message?.includes('already exists')) {
      logger.info('Contact already in Resend Audience', { email });
      return;
    }
    logger.warn('Failed to add contact to Resend Audience', { email, error: err.message });
    // Do not throw — Resend sync failure should never block subscription
  }
}

/**
 * Remove a contact from the Resend audience (on unsubscribe).
 *
 * @param {string} email
 */
async function removeContact(email) {
  const client = getClient();
  if (!client || !AUDIENCE_ID) return;

  try {
    // First find the contact by email to get their ID
    const contacts = await client.contacts.list({ audienceId: AUDIENCE_ID });
    const contact  = contacts?.data?.find(c => c.email === email.toLowerCase());

    if (!contact) {
      logger.info('Contact not found in Resend Audience (already removed)', { email });
      return;
    }

    await client.contacts.remove({ audienceId: AUDIENCE_ID, id: contact.id });
    logger.info('Removed contact from Resend Audience', { email });
  } catch (err) {
    logger.warn('Failed to remove contact from Resend Audience', { email, error: err.message });
  }
}

/**
 * Send a batch campaign using the Resend Batch API.
 * Sends up to 100 emails per API call.
 *
 * @param {Array<{email: string, name: string}>} subscribers
 * @param {string} subject
 * @param {Function} htmlBuilder - function(email, name) => html string
 * @param {string} from - FROM address
 * @returns {{ sent: number, failed: number, failedEmails: Array }}
 */
async function sendBatchCampaign(subscribers, subject, htmlBuilder, from) {
  const client = getClient();
  if (!client) throw new Error('Resend client not initialised — check RESEND_API_KEY');

  const BATCH_SIZE = 100;
  let sent   = 0;
  let failed = 0;
  const failedEmails = [];

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);

    const emails = chunk.map(sub => ({
      from,
      to:      sub.email,
      subject,
      html:    htmlBuilder(sub.email, sub.name),
    }));

    try {
      const result = await client.batch.send(emails);

      if (result?.data) {
        sent += result.data.length;
        const succeededEmails = new Set(result.data.map(r => Array.isArray(r.to) ? r.to[0] : r.to));
        chunk.forEach(sub => {
          if (!succeededEmails.has(sub.email)) {
            failed++;
            failedEmails.push({ email: sub.email, error: 'Not in batch response' });
          }
        });
      } else {
        failed += chunk.length;
        chunk.forEach(sub => failedEmails.push({ email: sub.email, error: 'Batch returned no data' }));
      }

      logger.info(`Campaign batch sent`, { batch: Math.floor(i / BATCH_SIZE) + 1, count: chunk.length });

    } catch (batchErr) {
      logger.warn(`Batch failed, falling back to individual sends for chunk`, { error: batchErr.message });

      for (const sub of chunk) {
        try {
          await client.emails.send({
            from,
            to:      sub.email,
            subject,
            html:    htmlBuilder(sub.email, sub.name),
          });
          sent++;
        } catch (individualErr) {
          failed++;
          failedEmails.push({ email: sub.email, error: individualErr.message });
          logger.warn('Individual fallback email failed', { email: sub.email, error: individualErr.message });
        }
      }
    }
  }

  return { sent, failed, failedEmails };
}

/**
 * Sync all active newsletter subscribers from PostgreSQL to Resend Audience.
 * One-time operation (or run when you want a full sync).
 *
 * @returns {{ synced: number, failed: number }}
 */
async function syncAllSubscribersToAudience() {
  const client = getClient();
  if (!client || !AUDIENCE_ID) {
    throw new Error('RESEND_AUDIENCE_ID not configured. Set it in .env first.');
  }

  const { rows: subs } = await query(`
    SELECT email, name FROM newsletter_subscribers
    WHERE is_active = true
    ORDER BY subscribed_at ASC
  `);

  logger.info(`Starting full subscriber sync to Resend Audience`, { count: subs.length });

  let synced = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await addContact(sub.email, sub.name);
      synced++;
    } catch (err) {
      failed++;
      logger.warn('Sync failed for subscriber', { email: sub.email, error: err.message });
    }
  }

  logger.info(`Subscriber sync complete`, { synced, failed });
  return { synced, failed };
}

module.exports = {
  addContact,
  removeContact,
  sendBatchCampaign,
  syncAllSubscribersToAudience,
};
