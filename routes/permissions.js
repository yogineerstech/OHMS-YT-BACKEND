const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { 
  authenticate, 
  requireRole, 
  auditLog 
} = require('../middleware/auth');
const { requireAbility, ACTIONS, SUBJECTS } = require('../utils/casl');
const { 
  permissionValidation, 
  commonRules, 
  handleValidationErrors 
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Get all permissions
router.get('/',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  ...commonRules.pagination,
  handleValidationErrors,
  permissionController.getAllPermissions
);

// Get permissions by category
router.get('/categories',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  permissionController.getPermissionsByCategory
);

// Get available actions
router.get('/actions',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  permissionController.getAvailableActions
);

// Get available subjects
router.get('/subjects',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  permissionController.getAvailableSubjects
);

// Create permission
router.post('/',
  requireAbility(ACTIONS.CREATE, SUBJECTS.PERMISSION),
  permissionValidation.create,
  handleValidationErrors,
  auditLog('CREATE', 'PERMISSION'),
  permissionController.createPermission
);

// Bulk create permissions
router.post('/bulk',
  requireRole('SUPER_ADMIN'),
  auditLog('BULK_CREATE', 'PERMISSION'),
  permissionController.bulkCreatePermissions
);

// Get permission by ID
router.get('/:permissionId',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  commonRules.mongoId,
  handleValidationErrors,
  permissionController.getPermissionById
);

// Update permission
router.put('/:permissionId',
  requireAbility(ACTIONS.UPDATE, SUBJECTS.PERMISSION),
  permissionValidation.update,
  handleValidationErrors,
  auditLog('UPDATE', 'PERMISSION'),
  permissionController.updatePermission
);

// Delete permission
router.delete('/:permissionId',
  requireAbility(ACTIONS.DELETE, SUBJECTS.PERMISSION),
  commonRules.mongoId,
  handleValidationErrors,
  auditLog('DELETE', 'PERMISSION'),
  permissionController.deletePermission
);

// Check permission dependencies
router.get('/:permissionId/dependencies',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  commonRules.mongoId,
  handleValidationErrors,
  permissionController.checkPermissionDependencies
);

module.exports = router;