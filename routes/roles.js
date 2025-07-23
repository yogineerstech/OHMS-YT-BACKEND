const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { 
  authenticate, 
  requireRole, 
  requireHospital, 
  auditLog 
} = require('../middleware/auth');
const { requireAbility, ACTIONS, SUBJECTS } = require('../utils/casl');
const { 
  roleValidation, 
  commonRules, 
  handleValidationErrors 
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Get all roles
router.get('/',
  requireAbility(ACTIONS.READ, SUBJECTS.ROLE),
  ...commonRules.pagination,
  handleValidationErrors,
  roleController.getAllRoles
);

// Get role hierarchy
router.get('/hierarchy',
  requireAbility(ACTIONS.READ, SUBJECTS.ROLE),
  roleController.getRoleHierarchy
);

// Get available permissions
router.get('/permissions',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  roleController.getAvailablePermissions
);

// Get permissions grouped by category
router.get('/permissions/categories',
  requireAbility(ACTIONS.READ, SUBJECTS.PERMISSION),
  roleController.getPermissionsByCategory
);

// Initialize system (Super Admin only)
router.post('/initialize',
  requireRole('SUPER_ADMIN'),
  auditLog('INITIALIZE_SYSTEM', 'ROLE'),
  roleController.initializeSystem
);

// Create role
router.post('/',
  requireAbility(ACTIONS.CREATE, SUBJECTS.ROLE),
  roleValidation.create,
  handleValidationErrors,
  auditLog('CREATE', 'ROLE'),
  roleController.createRole
);

// Get role by ID
router.get('/:roleId',
  requireAbility(ACTIONS.READ, SUBJECTS.ROLE),
  commonRules.mongoId,
  handleValidationErrors,
  roleController.getRoleById
);

// Update role
router.put('/:roleId',
  requireAbility(ACTIONS.UPDATE, SUBJECTS.ROLE),
  roleValidation.update,
  handleValidationErrors,
  auditLog('UPDATE', 'ROLE'),
  roleController.updateRole
);

// Delete role
router.delete('/:roleId',
  requireAbility(ACTIONS.DELETE, SUBJECTS.ROLE),
  commonRules.mongoId,
  handleValidationErrors,
  auditLog('DELETE', 'ROLE'),
  roleController.deleteRole
);

// Clone role
router.post('/:roleId/clone',
  requireAbility(ACTIONS.CREATE, SUBJECTS.ROLE),
  roleValidation.clone,
  handleValidationErrors,
  auditLog('CLONE', 'ROLE'),
  roleController.cloneRole
);

// Grant permission to role
router.post('/:roleId/permissions',
  requireAbility(ACTIONS.ASSIGN, SUBJECTS.PERMISSION),
  roleValidation.grantPermission,
  handleValidationErrors,
  auditLog('GRANT_PERMISSION', 'ROLE_PERMISSION'),
  roleController.grantPermission
);

// Revoke permission from role
router.delete('/:roleId/permissions/:permissionId',
  requireAbility(ACTIONS.DELETE, SUBJECTS.PERMISSION),
  param('roleId').isMongoId(),
  param('permissionId').isMongoId(),
  handleValidationErrors,
  auditLog('REVOKE_PERMISSION', 'ROLE_PERMISSION'),
  roleController.revokePermission
);

module.exports = router;