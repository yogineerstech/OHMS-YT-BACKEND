const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { 
  authenticate, 
  requireRole, 
  requireHospital,
  auditLog 
} = require('../middleware/auth');
const { requireAbility, ACTIONS, SUBJECTS } = require('../utils/casl');
const { 
  staffValidation, 
  commonRules, 
  handleValidationErrors 
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Get all staff
router.get('/',
  requireAbility(ACTIONS.READ, SUBJECTS.STAFF),
  requireHospital,
  ...commonRules.pagination,
  handleValidationErrors,
  staffController.getAllStaff
);

// Create staff
router.post('/',
  requireAbility(ACTIONS.CREATE, SUBJECTS.STAFF),
  requireHospital,
  staffValidation.create,
  handleValidationErrors,
  auditLog('CREATE', 'STAFF'),
  staffController.createStaff
);

// Get staff by ID
router.get('/:staffId',
  requireAbility(ACTIONS.READ, SUBJECTS.STAFF),
  commonRules.mongoId,
  handleValidationErrors,
  staffController.getStaffById
);

// Update staff
router.put('/:staffId',
  requireAbility(ACTIONS.UPDATE, SUBJECTS.STAFF),
  staffValidation.update,
  handleValidationErrors,
  auditLog('UPDATE', 'STAFF'),
  staffController.updateStaff
);

// Delete staff (soft delete)
router.delete('/:staffId',
  requireAbility(ACTIONS.DELETE, SUBJECTS.STAFF),
  commonRules.mongoId,
  handleValidationErrors,
  auditLog('DELETE', 'STAFF'),
  staffController.deleteStaff
);

// Assign role to staff
router.put('/:staffId/role',
  requireAbility(ACTIONS.ASSIGN, SUBJECTS.STAFF),
  body('roleId').isMongoId().withMessage('Valid role ID is required'),
  handleValidationErrors,
  auditLog('ASSIGN_ROLE', 'STAFF'),
  staffController.assignRole
);

// Transfer staff to department
router.put('/:staffId/transfer',
  requireAbility(ACTIONS.TRANSFER, SUBJECTS.STAFF),
  body('departmentId').isMongoId().withMessage('Valid department ID is required'),
  body('transferDate').optional().isISO8601(),
  body('reason').optional().isString(),
  handleValidationErrors,
  auditLog('TRANSFER', 'STAFF'),
  staffController.transferStaff
);

module.exports = router;