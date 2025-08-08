// routes/hospitalAdmin.auth.routes.js

const express = require('express');
const router = express.Router();
const hospitalAdminAuthController = require('../controllers/hospitalAdmin/auth.controller');
const {
    authenticateJWT,
    requireAuth,
    requireActiveSession,
    checkAuthRateLimit
} = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Import validation utilities
const {
    authValidations,
    handleValidationErrors,
    validatePasswordConfirmation
} = require('../utils/validation.utils');

// Middleware to ensure hospital admin role
const requireHospitalAdmin = requireRole('HOSPITAL_ADMIN');

/**
 * @route   POST /api/hospital-admin/auth/login
 * @desc    Hospital admin login
 * @access  Public
 */
router.post('/login',
    checkAuthRateLimit,
    authValidations.hospitalAdminLogin,
    handleValidationErrors,
    hospitalAdminAuthController.login
);

/**
 * @route   POST /api/hospital-admin/auth/logout
 * @desc    Hospital admin logout
 * @access  Private (Hospital Admin)
 */
router.post('/logout',
    authenticateJWT,
    requireAuth,
    requireHospitalAdmin,
    hospitalAdminAuthController.logout
);

/**
 * @route   POST /api/hospital-admin/auth/logout-all
 * @desc    Logout hospital admin from all devices
 * @access  Private (Hospital Admin)
 */
router.post('/logout-all',
    authenticateJWT,
    requireAuth,
    requireActiveSession,
    requireHospitalAdmin,
    hospitalAdminAuthController.logoutAll
);

/**
 * @route   POST /api/hospital-admin/auth/refresh-token
 * @desc    Refresh hospital admin access token
 * @access  Public
 */
router.post('/refresh-token',
    hospitalAdminAuthController.refreshToken
);

/**
 * @route   GET /api/hospital-admin/auth/profile
 * @desc    Get hospital admin profile with hospital details
 * @access  Private (Hospital Admin)
 */
router.get('/profile',
    authenticateJWT,
    requireAuth,
    requireActiveSession,
    requireHospitalAdmin,
    hospitalAdminAuthController.getProfile
);

/**
 * @route   GET /api/hospital-admin/auth/sessions
 * @desc    Get hospital admin active sessions
 * @access  Private (Hospital Admin)
 */
router.get('/sessions',
    authenticateJWT,
    requireAuth,
    requireActiveSession,
    requireHospitalAdmin,
    hospitalAdminAuthController.getSessions
);

/**
 * @route   PUT /api/hospital-admin/auth/change-password
 * @desc    Change hospital admin password
 * @access  Private (Hospital Admin)
 */
router.put('/change-password',
    authenticateJWT,
    requireAuth,
    requireActiveSession,
    requireHospitalAdmin,
    authValidations.changePassword,
    handleValidationErrors,
    validatePasswordConfirmation,
    hospitalAdminAuthController.changePassword
);

/**
 * @route   GET /api/hospital-admin/auth/verify-token
 * @desc    Verify hospital admin token
 * @access  Private (Hospital Admin)
 */
router.get('/verify-token',
    authenticateJWT,
    requireAuth,
    requireHospitalAdmin,
    hospitalAdminAuthController.verifyToken
);

module.exports = router;