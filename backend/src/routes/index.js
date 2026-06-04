// src/routes/index.js
'use strict';

const router = require('express').Router();
const { getServerTime, validateTimeSync, enforceTimeValidation } = require('../middleware/timeValidation');

// ── Time synchronization endpoint (no auth) ──────────────────────────────
// HEAD/GET /api/server-time — Returns server's authoritative time for client validation
// Used by frontend to detect incorrect system clock
router.head('/server-time', getServerTime);
router.get('/server-time', getServerTime);

// ── Webhook endpoints (no auth, no time validation) ─────────────────────────
// Must be before timeValidation middleware since they verify their own signatures
router.use('/webhooks/resend', require('./webhooks/resend.webhook'));

// ── Time validation middleware (applies to all routes) ──────────────────────
// Extracts X-Client-Time header and validates clock skew
router.use(validateTimeSync);

// ── Existing routes ────────────────────────────────────────────────────────
router.use('/auth',       require('./auth.routes'));
router.use('/products',   require('./products.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/orders',     require('./orders.routes'));
router.use('/payments',   require('./payments.routes'));
router.use('/messages',   require('./messages.routes'));

// ── New public routes added in Phase 1 & 5 ───────────────────────────────
router.use('/newsletter', require('./newsletter.routes'));
router.use('/loyalty',    require('./loyalty.routes'));

// ── Public special-days endpoint (no auth) ────────────────────────────────
// GET /v1/special-days/active-today — used by frontend to determine box price
router.use('/special-days', require('./specialdays.routes'));

// ── Public delivery-zones endpoint (no auth) ─────────────────────────────
// GET /v1/delivery-zones — returns active zones for checkout
router.use('/delivery-zones', require('./deliveryzones.routes'));

// ── All admin routes (protected inside each router) ───────────────────────
router.use('/admin', require('./admin'));

module.exports = router;
