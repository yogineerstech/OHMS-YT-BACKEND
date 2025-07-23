const { validationResult } = require('express-validator');
const roleService = require('../services/roleService');
const permissionService = require('../services/permissionService');
const { ACTIONS, SUBJECTS } = require('../utils/casl');

class RoleController {
  // Create role
  async createRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const createdBy = req.user.id;
      const role = await roleService.createRole(req.body, createdBy);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'ROLE_CREATION_FAILED'
      });
    }
  }

  // Get all roles
  async getAllRoles(req, res) {
    try {
      const filters = {
        hospitalId: req.query.hospitalId || req.user.hospitalId,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        roleType: req.query.roleType
      };

      const roles = await roleService.getAllRoles(filters);

      res.json({
        success: true,
        data: roles,
        total: roles.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch roles',
        error: error.message
      });
    }
  }

  // Get role by ID
  async getRoleById(req, res) {
    try {
      const { roleId } = req.params;
      const role = await roleService.getRoleById(roleId);

      res.json({
        success: true,
        data: role
      });

    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'ROLE_NOT_FOUND'
      });
    }
  }

  // Update role
  async updateRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { roleId } = req.params;
      const updatedBy = req.user.id;
      
      const role = await roleService.updateRole(roleId, req.body, updatedBy);

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: role
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'ROLE_UPDATE_FAILED'
      });
    }
  }

  // Delete role
  async deleteRole(req, res) {
    try {
      const { roleId } = req.params;
      const result = await roleService.deleteRole(roleId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'ROLE_DELETION_FAILED'
      });
    }
  }

  // Grant permission to role
  async grantPermission(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { roleId } = req.params;
      const { permissionId, conditions, timeRestrictions, locationRestrictions, dataRestrictions, expiresAt } = req.body;
      const grantedBy = req.user.id;

      const grantData = {
        conditions,
        timeRestrictions,
        locationRestrictions,
        dataRestrictions,
        expiresAt
      };

      const rolePermission = await roleService.grantPermission(roleId, permissionId, grantData, grantedBy);

      res.json({
        success: true,
        message: 'Permission granted successfully',
        data: rolePermission
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'PERMISSION_GRANT_FAILED'
      });
    }
  }

  // Revoke permission from role
  async revokePermission(req, res) {
    try {
      const { roleId, permissionId } = req.params;
      const result = await roleService.revokePermission(roleId, permissionId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'PERMISSION_REVOKE_FAILED'
      });
    }
  }

  // Get available permissions
  async getAvailablePermissions(req, res) {
    try {
      const filters = {
        category: req.query.category,
        permissionType: req.query.permissionType,
        isSystem: req.query.isSystem !== undefined ? req.query.isSystem === 'true' : undefined
      };

      const permissions = await permissionService.getAllPermissions(filters);

      res.json({
        success: true,
        data: permissions
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions',
        error: error.message
      });
    }
  }

  // Get permissions grouped by category
  async getPermissionsByCategory(req, res) {
    try {
      const grouped = await permissionService.getPermissionsByCategory();

      res.json({
        success: true,
        data: grouped
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions by category',
        error: error.message
      });
    }
  }

  // Clone role
  async cloneRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { roleId } = req.params;
      const createdBy = req.user.id;
      
      const result = await roleService.cloneRole(roleId, req.body, createdBy);

      res.status(201).json({
        success: true,
        message: `Role cloned successfully. ${result.copiedPermissions} permissions copied.`,
        data: result.newRole
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'ROLE_CLONE_FAILED'
      });
    }
  }

  // Get role hierarchy
  async getRoleHierarchy(req, res) {
    try {
      const hospitalId = req.query.hospitalId || req.user.hospitalId;
      const hierarchy = await roleService.getRoleHierarchy(hospitalId);

      res.json({
        success: true,
        data: hierarchy
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role hierarchy',
        error: error.message
      });
    }
  }

  // Initialize system roles and permissions
  async initializeSystem(req, res) {
    try {
      // Create system permissions
      const permissions = await roleService.createSystemPermissions();
      
      // Create default roles
      const roles = [];
      for (const [roleCode, roleData] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        const existingRole = await prisma.role.findFirst({
          where: { roleCode }
        });
        
        if (!existingRole) {
          const role = await roleService.createRole({
            roleName: roleCode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            roleCode,
            roleType: this.getRoleType(roleCode),
            roleDescription: `Default ${roleCode.replace(/_/g, ' ').toLowerCase()} role`,
            applyDefaultPermissions: true
          }, req.user.id);
          roles.push(role);
        }
      }

      res.json({
        success: true,
        message: 'System initialized successfully',
        data: {
          permissionsCreated: permissions.length,
          rolesCreated: roles.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'System initialization failed',
        error: error.message
      });
    }
  }

  // Helper method to determine role type
  getRoleType(roleCode) {
    const clinicalRoles = ['DOCTOR', 'HEAD_DOCTOR', 'NURSE', 'HEAD_NURSE', 'RADIOLOGIST'];
    const administrativeRoles = ['HOSPITAL_ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'];
    const technicalRoles = ['LAB_TECHNICIAN', 'PHARMACIST'];
    const supportRoles = ['RECEPTIONIST', 'BILLING_CLERK'];

    if (clinicalRoles.includes(roleCode)) return 'clinical';
    if (administrativeRoles.includes(roleCode)) return 'administrative';
    if (technicalRoles.includes(roleCode)) return 'technical';
    if (supportRoles.includes(roleCode)) return 'support';
    
    return 'general';
  }
}

module.exports = new RoleController();