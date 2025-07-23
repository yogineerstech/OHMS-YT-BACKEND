const prisma = require('../config/database');
const { ACTIONS, SUBJECTS, PERMISSION_CATEGORIES } = require('../utils/permissions');

class PermissionService {
  // Create custom permission
  async createPermission(permissionData) {
    try {
      const permission = await prisma.permission.create({
        data: {
          ...permissionData,
          isSystem: false,
          createdAt: new Date()
        }
      });

      return permission;
    } catch (error) {
      throw new Error(`Failed to create permission: ${error.message}`);
    }
  }

  // Get all permissions with filtering
  async getAllPermissions(filters = {}) {
    const where = {};
    
    if (filters.module) {
      where.module = filters.module;
    }
    
    if (filters.permissionType) {
      where.permissionType = filters.permissionType;
    }
    
    if (filters.sensitivityLevel) {
      where.sensitivityLevel = filters.sensitivityLevel;
    }
    
    if (filters.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }
    
    if (filters.search) {
      where.OR = [
        { permissionName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { permissionCode: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                roleCode: true
              }
            }
          }
        },
        _count: {
          select: {
            rolePermissions: true
          }
        }
      },
      orderBy: [
        { module: 'asc' },
        { permissionName: 'asc' }
      ]
    });

    return permissions;
  }

  // Get permissions grouped by category
  async getPermissionsByCategory() {
    const permissions = await this.getAllPermissions();
    
    const grouped = {};
    
    permissions.forEach(permission => {
      const category = this.getPermissionCategory(permission);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });

    return grouped;
  }

  // Get permission by ID
  async getPermissionById(permissionId) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                roleCode: true
              }
            },
            grantedByStaff: {
              select: {
                id: true,
                employeeId: true,
                personalDetails: true
              }
            }
          }
        }
      }
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    return permission;
  }

  // Update permission
  async updatePermission(permissionId, updateData) {
    try {
      const permission = await prisma.permission.update({
        where: { id: permissionId },
        data: updateData,
        include: {
          rolePermissions: true
        }
      });

      return permission;
    } catch (error) {
      throw new Error(`Failed to update permission: ${error.message}`);
    }
  }

  // Delete permission
  async deletePermission(permissionId) {
    // Check if permission is in use
    const rolePermissionCount = await prisma.rolePermission.count({
      where: { 
        permissionId,
        granted: true
      }
    });

    if (rolePermissionCount > 0) {
      throw new Error(`Cannot delete permission. It is granted to ${rolePermissionCount} roles.`);
    }

    await prisma.permission.delete({
      where: { id: permissionId }
    });

    return { message: 'Permission deleted successfully' };
  }

  // Get available actions
  getAvailableActions() {
    return Object.values(ACTIONS).map(action => ({
      value: action,
      label: this.formatActionLabel(action)
    }));
  }

  // Get available subjects
  getAvailableSubjects() {
    return Object.values(SUBJECTS).map(subject => ({
      value: subject,
      label: this.formatSubjectLabel(subject)
    }));
  }

  // Get permission categories
  getPermissionCategories() {
    return Object.entries(PERMISSION_CATEGORIES).map(([key, value]) => ({
      value: key,
      label: value
    }));
  }

  // Helper method to determine permission category
  getPermissionCategory(permission) {
    const { action, resource } = permission;
    
    // Patient care related
    if (['Patient', 'PatientVisit', 'Examination', 'Diagnosis'].includes(resource)) {
      return PERMISSION_CATEGORIES.PATIENT_CARE;
    }
    
    // Medical records
    if (['MedicalRecord', 'Disease', 'ExaminationTemplate'].includes(resource)) {
      return PERMISSION_CATEGORIES.MEDICAL_RECORDS;
    }
    
    // Financial
    if (['Bill', 'Payment', 'Insurance', 'FinancialReport'].includes(resource)) {
      return PERMISSION_CATEGORIES.FINANCIAL;
    }
    
    // Administration
    if (['Role', 'Permission', 'Staff', 'Hospital', 'Department'].includes(resource)) {
      return PERMISSION_CATEGORIES.ADMINISTRATION;
    }
    
    // Inventory
    if (['Inventory', 'Equipment', 'Supply', 'PharmacyInventory'].includes(resource)) {
      return PERMISSION_CATEGORIES.INVENTORY;
    }
    
    // Reporting
    if (['Report', 'Dashboard', 'Analytics'].includes(resource)) {
      return PERMISSION_CATEGORIES.REPORTING;
    }
    
    // Security
    if (['UserSession', 'AuditLog', 'Configuration'].includes(resource)) {
      return PERMISSION_CATEGORIES.SECURITY;
    }
    
    // Emergency
    if (action === ACTIONS.EMERGENCY_ACCESS || resource === 'Emergency') {
      return PERMISSION_CATEGORIES.EMERGENCY;
    }
    
    return 'General';
  }

  // Format action label for display
  formatActionLabel(action) {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  // Format subject label for display
  formatSubjectLabel(subject) {
    // Handle camelCase subjects
    return subject.replace(/([A-Z])/g, ' $1').trim();
  }

  // Bulk create permissions
  async bulkCreatePermissions(permissionsData) {
    try {
      const results = [];
      
      for (const permissionData of permissionsData) {
        // Check if permission already exists
        const existing = await prisma.permission.findFirst({
          where: {
            permissionCode: permissionData.permissionCode
          }
        });
        
        if (!existing) {
          const permission = await prisma.permission.create({
            data: permissionData
          });
          results.push(permission);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to bulk create permissions: ${error.message}`);
    }
  }

  // Check permission dependencies
  async checkPermissionDependencies(permissionId) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        permissionId,
        granted: true
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            roleCode: true
          }
        }
      }
    });

    return {
      roleCount: rolePermissions.length,
      roles: rolePermissions.map(rp => rp.role)
    };
  }

  // Generate permission suggestions based on role type
  generatePermissionSuggestions(roleType) {
    const suggestions = [];
    
    switch (roleType) {
      case 'clinical':
        suggestions.push(
          { action: ACTIONS.READ, subject: SUBJECTS.PATIENT },
          { action: ACTIONS.UPDATE, subject: SUBJECTS.PATIENT },
          { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT },
          { action: ACTIONS.CREATE, subject: SUBJECTS.EXAMINATION },
          { action: ACTIONS.READ, subject: SUBJECTS.DIAGNOSIS }
        );
        break;
        
      case 'administrative':
        suggestions.push(
          { action: ACTIONS.READ, subject: SUBJECTS.STAFF },
          { action: ACTIONS.UPDATE, subject: SUBJECTS.STAFF },
          { action: ACTIONS.READ, subject: SUBJECTS.DEPARTMENT },
          { action: ACTIONS.READ, subject: SUBJECTS.REPORT }
        );
        break;
        
      case 'technical':
        suggestions.push(
          { action: ACTIONS.CREATE, subject: SUBJECTS.LAB_RESULT },
          { action: ACTIONS.UPDATE, subject: SUBJECTS.LAB_RESULT },
          { action: ACTIONS.READ, subject: SUBJECTS.PATIENT },
          { action: ACTIONS.READ, subject: SUBJECTS.EXAMINATION }
        );
        break;
        
      default:
        suggestions.push(
          { action: ACTIONS.READ, subject: SUBJECTS.STAFF },
          { action: ACTIONS.UPDATE, subject: SUBJECTS.STAFF }
        );
    }
    
    return suggestions;
  }
}

module.exports = new PermissionService();