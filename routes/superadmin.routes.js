const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superadmin'); // Make sure this path exists
const { checkAuthRateLimit, authenticateJWT, requireAuth } = require('../middleware/auth.middleware');
const hospitalController = require('../controllers/superadmin/hospital.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole, requirePermission } = require('../middleware/role.middleware');

// Middleware to ensure user is super admin (define before using)
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role?.roleCode !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
}

// Public routes (no auth required)
router.get('/exists', superAdminController.management.checkSuperAdminExists);
router.post('/setup', checkAuthRateLimit, superAdminController.initialSetup);
router.post('/login', checkAuthRateLimit, superAdminController.login);

// Protected routes (require super admin auth)
router.use(authenticateJWT);
router.use(requireAuth);
router.use(requireSuperAdmin); // Now this is defined above

// Super Admin management routes
router.get('/stats', superAdminController.management.getSystemStats);
router.get('/hospitals', superAdminController.management.getAllHospitals);
router.patch('/hospitals/:hospitalId/status', superAdminController.management.toggleHospitalStatus);
router.get('/logs', superAdminController.management.getSystemLogs);

// Hospital Network routes - Only Super Admin
router.post('/networks', hospitalController.createHospitalNetwork);
router.get('/networks', hospitalController.getHospitalNetworks);

// Hospital routes - Only Super Admin
router.post('/hospitals', hospitalController.createHospital);
router.get('/hospitals/:hospitalId', hospitalController.getHospitalById);
router.put('/hospitals/:hospitalId', hospitalController.updateHospital);

// Hospital Admin routes - Only Super Admin
router.post('/hospitals/:hospitalId/admins', hospitalController.createHospitalAdmin);
router.get('/hospitals/:hospitalId/admins', hospitalController.getHospitalAdmins);
router.post('/hospitals/admins/:adminId/reset-password', hospitalController.resetHospitalAdminPassword);
router.post('/hospitals/admins/:adminId/deactivate', hospitalController.deactivateHospitalAdmin);

module.exports = router;