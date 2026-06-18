// src/services/email.service.js
// Complete service — keeps original sendWelcome/sendOrderConfirmation
// and adds loyalty + newsletter emails from Phase 1.
'use strict';

const { Resend } = require('resend');
const { logger } = require('../config/logger');

let resend;
try {
  resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
} catch (e) {
  logger.warn('Failed to initialize Resend email client', { error: e.message });
}
// FROM address resolution: uses verified domain in production, sandbox in dev/when domain not set
const EMAIL_DOMAIN_VERIFIED = process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('gmail');
const FROM = EMAIL_DOMAIN_VERIFIED
  ? `${process.env.EMAIL_FROM_NAME || 'HAIQ Bakery'} <${process.env.EMAIL_FROM}>`
  : `${process.env.EMAIL_FROM_NAME || 'HAIQ Bakery'} <${process.env.EMAIL_FROM_DEV || 'onboarding@resend.dev'}>`;

async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !resend) {
    logger.info('Email skipped (no RESEND_API_KEY or client unavailable)', { to, subject });
    return;
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    logger.info('Email sent', { to, subject, id: result.id });
    return result;
  } catch (err) {
    logger.error('Email send failed', { to, subject, error: err.message });
    throw err;
  }
}

// ── Shared brand template ─────────────────────────────────────────────────────
const BRAND = {
  bg:      '#1A0A00',
  surface: '#2A1200',
  primary: '#B8752A',
  gold:    '#E8C88A',
  light:   '#F2EAD8',
  muted:   '#8C7355',
  border:  '#3D2000',
};

function baseLayout(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAIQ Bakery</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border:1px solid ${BRAND.border};max-width:520px;width:100%;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid ${BRAND.border};text-align:center;">
            <p style="margin:0;color:${BRAND.primary};font-family:'Georgia',serif;font-size:28px;font-weight:bold;letter-spacing:0.12em;">HAIQ</p>
            <p style="margin:6px 0 0;color:${BRAND.muted};font-family:'Arial',sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">Made For You</p>
          </td>
        </tr>
        <tr><td style="padding:36px 40px 32px;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid ${BRAND.border};text-align:center;">
            <p style="margin:0;color:${BRAND.muted};font-family:'Arial',sans-serif;font-size:11px;">
              HAIQ Bakery &middot; Muyenga, Kampala, Uganda
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const API_BASE = process.env.API_BASE_URL || 'https://haiq-api.onrender.com/v1';

function unsubscribeUrl(email) {
  return `${API_BASE}/newsletter/unsubscribe?token=${Buffer.from(email, 'utf-8').toString('base64url')}`;
}

function unsubscribeFooter(email) {
  return `<p style="margin:24px 0 0;text-align:center;">
    <a href="${unsubscribeUrl(email)}" style="color:${BRAND.muted};font-family:'Arial',sans-serif;font-size:11px;text-decoration:underline;">Unsubscribe</a>
  </p>`;
}

function ctaBtn(text, url) {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
    <tr><td style="background:${BRAND.primary};">
      <a href="${url}" style="display:inline-block;padding:14px 32px;color:${BRAND.bg};font-family:'Arial',sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">${text}</a>
    </td></tr>
  </table>`;
}

function heading(text) {
  return `<h2 style="margin:0 0 6px;color:${BRAND.light};font-family:'Georgia',serif;font-size:24px;font-weight:bold;">${text}</h2>
          <div style="width:40px;height:2px;background:${BRAND.primary};margin:14px 0 20px;"></div>`;
}

function para(text) {
  return `<p style="margin:0 0 16px;color:${BRAND.muted};font-family:'Arial',sans-serif;font-size:14px;line-height:1.7;">${text}</p>`;
}

// ── Customer account welcome (called by auth.controller.js on register) ───────
async function sendWelcome(user) {
  const firstName = user.first_name || user.full_name?.split(' ')[0] || 'there';
  const shopUrl   = `${process.env.FRONTEND_URL || 'https://haiq.ug'}/shop`;

  return send({
    to:      user.email,
    subject: 'Welcome to HAIQ — Made For You',
    html:    baseLayout(`
      ${heading(`Welcome, ${firstName}.`)}
      ${para('Your HAIQ account is ready. Browse our cookie collection, build your own box, or go straight for what you know you want.')}
      ${para('Every order is baked fresh that morning. Every pack is exactly 4 cookies. Every bite is personal.')}
      ${ctaBtn('Start Shopping', shopUrl)}
    `),
  });
}

// ── Order confirmation ─────────────────────────────────────────────────────────
async function sendOrderConfirmation({ order_number, tracking_token, email, first_name, total }) {
  const trackUrl = `${process.env.FRONTEND_URL || 'https://haiq.ug'}/track/${tracking_token}`;
  return send({
    to:      email,
    subject: `Order Confirmed — ${order_number}`,
    html:    baseLayout(`
      ${heading('Order Confirmed.')}
      ${para(`Hi ${first_name}, your order <strong style="color:${BRAND.gold};">${order_number}</strong> has been received.`)}
      ${para(`Total: <strong style="color:${BRAND.light};">UGX ${Number(total).toLocaleString()}</strong>`)}
      ${para('We\'re already getting started. Expect same-day delivery if ordered before noon.')}
      ${ctaBtn('Track My Order', trackUrl)}
    `),
  });
}

// ── Order status update ────────────────────────────────────────────────────────
async function sendStatusUpdate({ email, first_name, status }) {
  const msgs = {
    freshly_kneaded: { label: 'Your Order is Being Prepared',  body: 'Payment confirmed. Our bakers have started on your cookies right now.' },
    ovenbound:       { label: 'Into the Oven',                 body: 'Your cookies are in the oven. This is the part that makes everything worth it.' },
    on_the_cart:     { label: 'Packaged & Ready',              body: 'Perfectly packed and waiting for pickup.' },
    en_route:        { label: 'On Its Way',                    body: 'Your order is with our delivery team and heading to you now.' },
    delivered:       { label: 'Delivered.',                    body: 'Your cookies have arrived. Enjoy every bite — you deserve it.' },
    cancelled:       { label: 'Order Cancelled',               body: 'Your order has been cancelled. Contact us if this was unexpected.' },
  };
  const m = msgs[status] || { label: 'Order Update', body: 'Your order status has been updated.' };
  return send({
    to:      email,
    subject: m.label,
    html:    baseLayout(`${heading(m.label)}${para(`Hi ${first_name},`)}${para(m.body)}`),
  });
}

// ── Password reset ─────────────────────────────────────────────────────────────
async function sendPasswordReset(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://haiq.ug'}/reset-password?token=${token}`;
  return send({
    to:      email,
    subject: 'Reset your HAIQ password',
    html:    baseLayout(`
      ${heading('Reset Your Password.')}
      ${para('Click below to reset your password. This link expires in 1 hour.')}
      ${ctaBtn('Reset Password', resetUrl)}
      ${para('If you didn\'t request this, ignore this email.')}
    `),
  });
}

// ── Newsletter welcome ─────────────────────────────────────────────────────────
async function sendNewsletterWelcome({ email, name = 'Cookie Lover' }) {
  return send({
    to:      email,
    subject: 'Welcome to HAIQ — Made For You',
    html:    baseLayout(`
      ${heading(`Welcome, ${name}.`)}
      ${para('You\'re now in the HAIQ inner circle. You\'ll be the first to know about new flavours, special days, and everything that comes out of our kitchen.')}
      ${para('We bake fresh every morning. Every order is personal.')}
      ${ctaBtn('Shop Now', `${process.env.FRONTEND_URL || 'https://haiq.ug'}/shop`)}
      ${unsubscribeFooter(email)}
    `),
  });
}

// Detect plain text (no HTML tags) and convert each paragraph to a styled block.
// If HTML is provided, wrap it in a brand-styled div so unstyled elements inherit
// the right color/font instead of rendering as invisible black-on-dark.
function _renderCampaignBody(rawHtml) {
  const isPlainText = !/<[a-z][\s\S]*>/i.test(rawHtml.trim());
  if (isPlainText) {
    return rawHtml
      .split(/\n\n+/)
      .map(p => para(p.trim().replace(/\n/g, '<br>')))
      .join('');
  }
  return `<div style="color:${BRAND.light};font-family:'Arial',sans-serif;font-size:14px;line-height:1.7;">${rawHtml}</div>`;
}

async function sendCampaign({ email, subject, html }) {
  return send({
    to:      email,
    subject,
    html:    baseLayout(`
      ${heading(subject)}
      ${_renderCampaignBody(html)}
      ${unsubscribeFooter(email)}
    `),
  });
}

// ── Build campaign HTML for batch sending ──────────────────────────────────────
function buildCampaignHtml(subject, bodyHtml, recipientEmail) {
  return baseLayout(`
    ${heading(subject)}
    ${_renderCampaignBody(bodyHtml)}
    ${unsubscribeFooter(recipientEmail)}
  `);
}

// ── Loyalty card approved ──────────────────────────────────────────────────────
async function sendLoyaltyApproved({ email, name, cardNumber }) {
  return send({
    to:      email,
    subject: 'Your HAIQ Loyalty Card is Approved',
    html:    baseLayout(`
      ${heading('Your HAIQ Card is Approved.')}
      ${para(`${name}, your loyalty card application has been approved.`)}
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${BRAND.border};width:100%;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};">
          <span style="color:${BRAND.muted};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;font-family:'Arial',sans-serif;">Card Number</span><br>
          <span style="color:${BRAND.light};font-size:16px;font-weight:bold;font-family:'Georgia',serif;">${cardNumber}</span>
        </td></tr>
        <tr><td style="padding:12px 16px;">
          <span style="color:${BRAND.muted};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;font-family:'Arial',sans-serif;">Status</span><br>
          <span style="color:${BRAND.primary};font-size:14px;font-weight:bold;font-family:'Arial',sans-serif;">Being Prepared for Dispatch</span>
        </td></tr>
      </table>
      ${para('Your physical card will be dispatched to your delivery address shortly.')}
      ${ctaBtn('View My Account', `${process.env.FRONTEND_URL || 'https://haiq.ug'}/account`)}
    `),
  });
}

// ── Loyalty card rejected ──────────────────────────────────────────────────────
async function sendLoyaltyRejected({ email, name }) {
  return send({
    to:      email,
    subject: 'Your HAIQ Card Application — Update',
    html:    baseLayout(`
      ${heading('Your HAIQ Card Application.')}
      ${para(`${name}, after reviewing your application we are unable to approve your HAIQ loyalty card at this time.`)}
      ${para('Keep ordering and building your points. You can reapply once your account activity meets our criteria.')}
      ${ctaBtn('Contact Us', `${process.env.FRONTEND_URL || 'https://haiq.ug'}/contact`)}
    `),
  });
}

// ── Loyalty card dispatched ────────────────────────────────────────────────────
async function sendLoyaltyDispatched({ email, name, deliveryAddress }) {
  return send({
    to:      email,
    subject: 'Your HAIQ Loyalty Card is On Its Way',
    html:    baseLayout(`
      ${heading('Your HAIQ Card is On Its Way.')}
      ${para(`${name}, your physical HAIQ loyalty card has been dispatched.`)}
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${BRAND.border};width:100%;">
        <tr><td style="padding:12px 16px;">
          <span style="color:${BRAND.muted};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;font-family:'Arial',sans-serif;">Delivery Address</span><br>
          <span style="color:${BRAND.light};font-size:14px;font-family:'Arial',sans-serif;">${deliveryAddress}</span>
        </td></tr>
      </table>
      ${para('Present your card with future orders to earn and redeem points.')}
      ${ctaBtn('View My Account', `${process.env.FRONTEND_URL || 'https://haiq.ug'}/account`)}
    `),
  });
}

// ── Inquiry reply (admin → customer via email) ─────────────────────────────────
async function sendInquiryReply({ toEmail, toName, subject, originalMessage, replyBody }) {
  const displayName = toName || 'there';
  const replySubject = subject ? `Re: ${subject}` : 'Reply from HAIQ';
  return send({
    to:      toEmail,
    subject: replySubject,
    html:    baseLayout(`
      ${heading('We\'ve Heard You.')}
      ${para(`Hi ${displayName},`)}
      ${para(replyBody.replace(/\n/g, '<br>'))}
      <table cellpadding="0" cellspacing="0" style="margin:28px 0 0;border:1px solid ${BRAND.border};width:100%;">
        <tr>
          <td style="padding:8px 16px;border-bottom:1px solid ${BRAND.border};background:${BRAND.surface || '#2A1200'};">
            <span style="color:${BRAND.muted};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:'Arial',sans-serif;">Your Original Message</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;color:${BRAND.muted};font-family:'Arial',sans-serif;font-size:13px;line-height:1.6;font-style:italic;">${originalMessage.replace(/\n/g, '<br>')}</p>
          </td>
        </tr>
      </table>
    `),
  });
}

module.exports = {
  send,
  sendWelcome,
  sendOrderConfirmation,
  sendStatusUpdate,
  sendPasswordReset,
  sendNewsletterWelcome,
  sendCampaign,
  buildCampaignHtml,
  sendLoyaltyApproved,
  sendLoyaltyRejected,
  sendLoyaltyDispatched,
  sendInquiryReply,
};
