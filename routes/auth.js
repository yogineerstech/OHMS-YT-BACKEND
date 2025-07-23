const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authRateLimit, auditLog } = require('../middleware/auth');
const { authValidation, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.post('/login', 
  authRateLimit,
  authValidation.login,
  handleValidationErrors,
  auditLog('LOGIN', 'USER_SESSION'),
  authController.login
);

router.post('/refresh-token',
  authRateLimit,
  authController.refreshToken
);

// Protected routes
router.use(authenticate);

router.post('/logout',
  auditLog('LOGOUT', 'USER_SESSION'),
  authController.logout
);

router.post('/logout-all',
  auditLog('LOGOUT_ALL', 'USER_SESSION'),
  authController.logoutAll
);

router.get('/profile',
  authController.getProfile
);

router.put('/change-password',
  authValidation.changePassword,
  handleValidationErrors,
  auditLog('CHANGE_PASSWORD', 'USER_CREDENTIAL'),
  authController.changePassword
);

router.post('/reset-password',
  authValidation.resetPassword,
  handleValidationErrors,
  auditLog('RESET_PASSWORD', 'USER_CREDENTIAL'),
  authController.resetPassword
);

router.get('/sessions',
  authController.getActiveSessions
);

module.exports = router;