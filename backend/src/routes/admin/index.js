// src/routes/admin/index.js
const router = require('express').Router();
const { adminAuditMiddleware } = require('../../middleware/adminAudit');

// Apply audit logging to all admin routes
router.use(adminAuditMiddleware);

router.use('/auth',        require('./admin.auth.routes'));
router.use('/orders',      require('./admin.orders.routes'));
router.use('/products',    require('./admin.products.routes'));
router.use('/messages',    require('./admin.messages.routes'));
router.use('/analytics',   require('./admin.analytics.routes'));
router.use('/payments',    require('./admin.payments.routes'));
router.use('/loyalty',     require('./admin.loyalty.routes'));
router.use('/newsletter',   require('./admin.newsletter.routes'));
router.use('/special-days', require('./admin.special_days.routes'));
router.use('/delivery-zones', require('./admin.deliveryzones.routes'));

router.use('/staff',   require('./admin.staff.routes'));
router.use('/reviews', require('./admin.reviews.routes'));
router.use('/maintenance', require('./admin.maintenance.routes'));

module.exports = router;
