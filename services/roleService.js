const prisma = require('../config/database');
const { ACTIONS, SUBJECTS, DEFAULT_ROLE_PERMISSIONS } = require('../utils/permissions');

class RoleService {
  // Create a new role
  async createRole(roleData, createdBy) {
    try {
      const role = await prisma.role.create({
        data: {
          ...roleData,
          createdAt: new Date(),
          isActive: true
        },
        include: {
          category: true,
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      // If default permissions are provided, apply them
      if (roleData.applyDefaultPermissions && DEFAULT_ROLE_PERMISSIONS[roleData.roleCode]) {
        await this.applyDefaultPermissions(role.id, roleData.roleCode, createdBy);
      }

      return role;
    } catch (error) {
      throw new Error(`Failed to create role: ${error.message}`);
    }
  }

  // Apply default permissions to a role
  async applyDefaultPermissions(roleId, roleCode, grantedBy) {
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[roleCode];
    if (!defaultPermissions) {
      throw new Error(`No default permissions found for role: ${roleCode}`);
    }

    const rolePermissions = [];

    for (const permissionData of defaultPermissions.permissions) {
      // Find or create permission
      let permission = await prisma.permission.findFirst({
        where: {
          action: permissionData.action,
          resource: permissionData.subject
        }
      });

      if (!permission) {
        permission = await prisma.permission.create({
          data: {
            permissionName: `${permissionData.action} ${permissionData.subject}`,
            permissionCode: `${permissionData.action}_${permissionData.subject}`.toUpperCase(),
            action: permissionData.action,
            resource: permissionData.subject,
            description: `Permission to ${permissionData.action} ${permissionData.subject}`,
            permissionType: 'functional',
            isSystem: true
          }
        });
      }

      // Create role permission
      const rolePermission = await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: permission.id,
          granted: true,
          conditions: permissionData.conditions || null,
          grantedBy,
          grantedAt: new Date()
        }
      });

      rolePermissions.push(rolePermission);
    }

    return rolePermissions;
  }

  // Get all roles with permissions
  async getAllRoles(filters = {}) {
    const where = {};
    
    if (filters.hospitalId) {
      where.hospitalSpecific = true;
      where.hospitalId = filters.hospitalId;
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters.roleType) {
      where.roleType = filters.roleType;
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        category: true,
        rolePermissions: {
          include: {
            permission: true,
            grantedByStaff: {
              select: {
                id: true,
                employeeId: true,
                personalDetails: true
              }
            }
          }
        },
        staff: {
          select: {
            id: true,
            employeeId: true,
            personalDetails: true,
            isActive: true
          }
        },
        _count: {
          select: {
            staff: true
          }
        }
      },
      orderBy: [
        { hierarchyLevel: 'asc' },
        { roleName: 'asc' }
      ]
    });

    return roles;
  }

  // Get role by ID with full details
  async getRoleById(roleId) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        category: true,
        rolePermissions: {
          include: {
            permission: true,
            grantedByStaff: {
              select: {
                id: true,
                employeeId: true,
                personalDetails: true
              }
            }
          }
        },
        staff: {
          select: {
            id: true,
            employeeId: true,
            personalDetails: true,
            isActive: true,
            departmentId: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  // Update role
  async updateRole(roleId, updateData, updatedBy) {
    try {
      const role = await prisma.role.update({
        where: { id: roleId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          category: true,
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      return role;
    } catch (error) {
      throw new Error(`Failed to update role: ${error.message}`);
    }
  }

  // Delete role (soft delete)
  async deleteRole(roleId) {
    // Check if role is in use
    const staffCount = await prisma.staff.count({
      where: { roleId, isActive: true }
    });

    if (staffCount > 0) {
      throw new Error(`Cannot delete role. ${staffCount} active staff members are assigned to this role.`);
    }

    await prisma.role.update({
      where: { id: roleId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return { message: 'Role deleted successfully' };
  }

  // Grant permission to role
  async grantPermission(roleId, permissionId, grantData, grantedBy) {
    try {
      // Check if permission already exists
      const existingPermission = await prisma.rolePermission.findFirst({
        where: {
          roleId,
          permissionId
        }
      });

      if (existingPermission) {
        // Update existing permission
        return await prisma.rolePermission.update({
          where: { id: existingPermission.id },
          data: {
            granted: true,
            conditions: grantData.conditions,
            timeRestrictions: grantData.timeRestrictions,
            locationRestrictions: grantData.locationRestrictions,
            dataRestrictions: grantData.dataRestrictions,
            expiresAt: grantData.expiresAt,
            grantedBy,
            grantedAt: new Date()
          },
          include: {
            permission: true
          }
        });
      } else {
        // Create new permission
        return await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
            granted: true,
            conditions: grantData.conditions,
            timeRestrictions: grantData.timeRestrictions,
            locationRestrictions: grantData.locationRestrictions,
            dataRestrictions: grantData.dataRestrictions,
            expiresAt: grantData.expiresAt,
            grantedBy,
            grantedAt: new Date()
          },
          include: {
            permission: true
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to grant permission: ${error.message}`);
    }
  }

  // Revoke permission from role
  async revokePermission(roleId, permissionId) {
    try {
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId,
          permissionId
        }
      });

      if (!rolePermission) {
        throw new Error('Permission not found for this role');
      }

      await prisma.rolePermission.update({
        where: { id: rolePermission.id },
        data: {
          granted: false,
          revokedAt: new Date()
        }
      });

      return { message: 'Permission revoked successfully' };
    } catch (error) {
      throw new Error(`Failed to revoke permission: ${error.message}`);
    }
  }

  // Get available permissions
  async getAvailablePermissions(filters = {}) {
    const where = {};
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.permissionType) {
      where.permissionType = filters.permissionType;
    }
    
    if (filters.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [
        { module: 'asc' },
        { permissionName: 'asc' }
      ]
    });

    return permissions;
  }

  // Create bulk permissions from actions and subjects
  async createSystemPermissions() {
    const permissions = [];
    
    for (const action of Object.values(ACTIONS)) {
      for (const subject of Object.values(SUBJECTS)) {
        if (subject === SUBJECTS.ALL) continue;
        
        const permissionCode = `${action}_${subject}`.toUpperCase();
        const existingPermission = await prisma.permission.findFirst({
          where: { permissionCode }
        });

        if (!existingPermission) {
          const permission = await prisma.permission.create({
            data: {
              permissionName: `${action} ${subject}`,
              permissionCode,
              action,
              resource: subject,
              description: `Permission to ${action} ${subject}`,
              permissionType: 'functional',
              isSystem: true,
              module: this.getModuleFromSubject(subject)
            }
          });
          permissions.push(permission);
        }
      }
    }

    return permissions;
  }

  // Helper method to determine module from subject
  getModuleFromSubject(subject) {
    const moduleMap = {
      [SUBJECTS.PATIENT]: 'Patient Management',
      [SUBJECTS.STAFF]: 'Staff Management',
      [SUBJECTS.DOCTOR]: 'Staff Management',
      [SUBJECTS.NURSE]: 'Staff Management',
      [SUBJECTS.EXAMINATION]: 'Clinical',
      [SUBJECTS.DIAGNOSIS]: 'Clinical',
      [SUBJECTS.PATIENT_VISIT]: 'Clinical',
      [SUBJECTS.LAB_RESULT]: 'Laboratory',
      [SUBJECTS.RADIOLOGY_RESULT]: 'Radiology',
      [SUBJECTS.MEDICATION]: 'Pharmacy',
      [SUBJECTS.PRESCRIPTION]: 'Pharmacy',
      [SUBJECTS.BILL]: 'Billing',
      [SUBJECTS.PAYMENT]: 'Billing',
      [SUBJECTS.ROLE]: 'Administration',
      [SUBJECTS.PERMISSION]: 'Administration',
      [SUBJECTS.HOSPITAL]: 'Administration',
      [SUBJECTS.DEPARTMENT]: 'Administration'
    };

    return moduleMap[subject] || 'General';
  }

  // Clone role with permissions
  async cloneRole(sourceRoleId, newRoleData, createdBy) {
    try {
      const sourceRole = await this.getRoleById(sourceRoleId);
      
      // Create new role
      const newRole = await prisma.role.create({
        data: {
          ...newRoleData,
          hierarchyLevel: sourceRole.hierarchyLevel,
          responsibilities: sourceRole.responsibilities,
          requiredQualifications: sourceRole.requiredQualifications,
          isActive: true
        }
      });

      // Copy permissions
      const rolePermissions = [];
      for (const rolePermission of sourceRole.rolePermissions) {
        if (rolePermission.granted) {
          const newRolePermission = await prisma.rolePermission.create({
            data: {
              roleId: newRole.id,
              permissionId: rolePermission.permissionId,
              granted: true,
              conditions: rolePermission.conditions,
              timeRestrictions: rolePermission.timeRestrictions,
              locationRestrictions: rolePermission.locationRestrictions,
              dataRestrictions: rolePermission.dataRestrictions,
              grantedBy: createdBy,
              grantedAt: new Date()
            }
          });
          rolePermissions.push(newRolePermission);
        }
      }

      return { newRole, copiedPermissions: rolePermissions.length };
    } catch (error) {
      throw new Error(`Failed to clone role: ${error.message}`);
    }
  }

  // Get role hierarchy
  async getRoleHierarchy(hospitalId) {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { hospitalSpecific: false },
          { hospitalId }
        ],
        isActive: true
      },
      orderBy: { hierarchyLevel: 'asc' },
      include: {
        category: true,
        _count: {
          select: {
            staff: true
          }
        }
      }
    });

    // Build hierarchy tree
    const hierarchy = roles.reduce((acc, role) => {
      const level = role.hierarchyLevel || 1;
      if (!acc[level]) acc[level] = [];
      acc[level].push(role);
      return acc;
    }, {});

    return hierarchy;
  }
}

module.exports = new RoleService();