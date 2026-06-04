'use strict';
// resend.contact.service.js
// Manages newsletter delivery via Resend.
// PostgreSQL is the source of truth for subscribers.

const { Resend } = require('resend');
const { logger } = require('../config/logger');
const { query } = require('../config/db');

let resend = null;

function getClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Send a batch campaign using the Resend Batch API.
 * Sends up to 100 emails per API call.
 * PostgreSQL subscribers table is the source of truth.
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
      logger.warn(`Batch failed, falling back to individual sends`, { error: batchErr.message });

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

module.exports = {
  sendBatchCampaign,
};
