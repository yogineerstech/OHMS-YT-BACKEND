const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superadmin'); // This path is causing the issue
const { checkAuthRateLimit, authenticateJWT, requireAuth } = require('../middleware/auth.middleware');

// Public routes (no auth required)
router.get('/exists', superAdminController.management.checkSuperAdminExists);
router.post('/setup', checkAuthRateLimit, superAdminController.initialSetup);
router.post('/login', checkAuthRateLimit, superAdminController.login);

// Protected routes (require super admin auth)
router.use(authenticateJWT);
router.use(requireAuth);
router.use(requireSuperAdmin); // Custom middleware to ensure super admin role

router.get('/stats', superAdminController.management.getSystemStats);
router.get('/hospitals', superAdminController.management.getAllHospitals);
router.patch('/hospitals/:hospitalId/status', superAdminController.management.toggleHospitalStatus);
router.get('/logs', superAdminController.management.getSystemLogs);

// Middleware to ensure user is super admin
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role?.roleCode !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
}

module.exports = router;