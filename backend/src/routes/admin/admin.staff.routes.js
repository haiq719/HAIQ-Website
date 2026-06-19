const router = require('express').Router();
const { requireSuperAdmin, requireStaff } = require('../../middleware/adminAuth');
const ctrl = require('../../controllers/admin/admin.staff.controller');

// All staff can see the list (so they know who else exists)
router.get('/',              requireStaff,      ctrl.listStaff);

// Only superadmins can create / modify / reset
router.post('/',             requireSuperAdmin, ctrl.createStaff);
router.patch('/:id',         requireSuperAdmin, ctrl.updateStaff);
router.post('/:id/reset-password', requireSuperAdmin, ctrl.resetPassword);

module.exports = router;
