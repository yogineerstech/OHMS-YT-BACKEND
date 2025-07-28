// routes/hospitalAdmin/staff.routes.js

const express = require('express');
const router = express.Router();
const staffController = require('../controllers/hospitalAdmin/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole, requireHospitalAccess, scopeToUserHospital } = require('../middleware/role.middleware');
const { validateCreateStaff, validateUpdateStaff, validatePasswordReset } = require('../middleware/validation.middleware');

// Apply authentication and hospital admin role to all routes
router.use(authenticate);
router.use(requireRole('HOSPITAL_ADMIN'));
router.use(requireHospitalAccess);
router.use(scopeToUserHospital);

// Staff CRUD operations
router.post('/', validateCreateStaff, staffController.createStaff);
router.get('/', staffController.getAllStaff);
router.get('/statistics', staffController.getStaffStatistics);
router.get('/roles', staffController.getAvailableRoles);
router.get('/:staffId', staffController.getStaffById);
router.put('/:staffId', validateUpdateStaff, staffController.updateStaff);
router.put('/:staffId/reset-password', validatePasswordReset, staffController.resetStaffPassword);
router.delete('/:staffId', staffController.deactivateStaff);

module.exports = router;