'use strict';
// emailValidator.js — MX record check + disposable domain blocklist
// Used at registration and newsletter subscription.
// Fail OPEN on DNS errors (do not block real users due to network issues).

const dns = require('dns').promises;
const { logger } = require('../config/logger');

// Known disposable/throwaway email domains
// Extend this list as new services emerge
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.de',
  'guerrillamail.biz',
  'guerrillamail.info',
  'temp-mail.org',
  'tempmail.com',
  'throwaway.email',
  'throwam.com',
  'dispostable.com',
  'yopmail.com',
  'yopmail.fr',
  '10minutemail.com',
  '10minutemail.net',
  'trashmail.com',
  'trashmail.me',
  'trashmail.at',
  'trashmail.io',
  'sharklasers.com',
  'guerrillaemail.com',
  'grr.la',
  'spam4.me',
  'maildrop.cc',
  'getairmail.com',
  'fakeinbox.com',
  'discard.email',
  'mailnull.com',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'bccto.me',
  'mailzilla.com',
  'spambox.us',
  'cust.in',
  'example.com',
  'example.net',
  'example.org',
  'test.com',
]);

/**
 * Validate that an email address is likely to be real and deliverable.
 *
 * Returns:
 *   { valid: true }                          — passes all checks
 *   { valid: false, reason: string }         — failed a check (block registration)
 *   { valid: true, warning: string }         — DNS timed out (allow through)
 *
 * @param {string} email
 * @returns {Promise<{ valid: boolean, reason?: string, warning?: string }>}
 */
async function validateEmailDeliverability(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email address is required.' };
  }

  const normalised = email.trim().toLowerCase();
  const atIndex    = normalised.lastIndexOf('@');

  if (atIndex === -1 || atIndex === 0 || atIndex === normalised.length - 1) {
    return { valid: false, reason: 'Invalid email address format.' };
  }

  const domain = normalised.slice(atIndex + 1);

  // Block disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid:  false,
      reason: 'Disposable or temporary email addresses are not allowed. Please use your real email address.',
    };
  }

  // MX record lookup with 2-second timeout
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2000)
      ),
    ]);

    if (!records || records.length === 0) {
      return {
        valid:  false,
        reason: `The email domain "${domain}" does not appear to accept emails. Please check your email address.`,
      };
    }

    // Domain has MX records — looks legitimate
    return { valid: true };

  } catch (err) {
    if (err.message === 'DNS_TIMEOUT') {
      // DNS lookup timed out — fail open (do not block real users)
      logger.warn('Email MX lookup timed out — allowing through', { domain });
      return { valid: true, warning: 'Could not verify email domain (DNS timeout)' };
    }

    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      // Domain does not exist or has no DNS records at all
      return {
        valid:  false,
        reason: `The email domain "${domain}" does not exist. Please check your email address.`,
      };
    }

    // Unknown DNS error — fail open
    logger.warn('Email MX lookup failed with unexpected error — allowing through', {
      domain,
      error: err.message,
      code:  err.code,
    });
    return { valid: true, warning: `Email domain check failed: ${err.message}` };
  }
}

module.exports = { validateEmailDeliverability };
