const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/bcrypt.utils');
const authService = require('./auth.service');

class SuperAdminService {
  /**
   * Check if super admin already exists
   */
  async superAdminExists() {
    const superAdminRole = await prisma.role.findFirst({
      where: { roleCode: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      return false;
    }

    const superAdmin = await prisma.staff.findFirst({
      where: { 
        roleId: superAdminRole.id,
        isActive: true
      }
    });

    return !!superAdmin;
  }

  /**
   * Create initial super admin user
   */
  async createInitialSuperAdmin(userData, ipAddress, userAgent) {
    // Check if super admin already exists
    const exists = await this.superAdminExists();
    if (exists) {
      throw new Error('Super admin already exists');
    }

    // Check if email already exists
    const existingUser = await prisma.staff.findFirst({
      where: {
        personalDetails: {
          path: ['email'],
          equals: userData.email
        }
      }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Find or create super admin role
    let superAdminRole = await prisma.role.findFirst({
      where: { roleCode: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          roleCode: 'SUPER_ADMIN',
          roleName: 'Super Administrator',
          description: 'System super administrator with full access',
          isActive: true,
          hospitalSpecific: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create super admin user
    const user = await prisma.staff.create({
      data: {
        staffCode: `SA001`, // Super admin code
        personalDetails: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone || null
        },
        employmentDetails: {
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          joiningDate: new Date().toISOString().split('T')[0]
        },
        roleId: superAdminRole.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Create user credentials
    await prisma.userCredential.create({
      data: {
        userId: user.id,
        credentialType: 'email',
        credentialDataHash: hashedPassword,
        failedAttempts: 0,
        isActive: true,
        createdAt: new Date(),
        lastUsed: new Date()
      }
    });

    // Generate tokens using existing auth service
    const tokens = await authService.generateTokens(user, ipAddress, userAgent);

    return { user, tokens };
  }

  /**
   * Authenticate super admin with additional checks
   */
  async authenticateSuperAdmin(email, password, ipAddress, userAgent) {
    // Find user with credentials
    const userCredential = await prisma.userCredential.findFirst({
      where: {
        credentialType: 'email',
        user: {
          personalDetails: {
            path: ['email'],
            equals: email
          },
          isActive: true,
          role: {
            roleCode: 'SUPER_ADMIN' // Only super admin
          }
        }
      },
      include: {
        user: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userCredential) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await comparePassword(password, userCredential.credentialDataHash);
    if (!isValidPassword) {
      // Update failed attempts
      await prisma.userCredential.update({
        where: { id: userCredential.id },
        data: { 
          failedAttempts: { increment: 1 },
          lastUsed: new Date()
        }
      });
      throw new Error('Invalid email or password');
    }

    // Check if account is locked due to failed attempts
    if (userCredential.failedAttempts >= 5) {
      throw new Error('Account is locked due to multiple failed attempts');
    }

    // Reset failed attempts on successful login
    await prisma.userCredential.update({
      where: { id: userCredential.id },
      data: { 
        failedAttempts: 0,
        lastUsed: new Date()
      }
    });

    // Generate tokens
    const tokens = await authService.generateTokens(userCredential.user, ipAddress, userAgent);

    return { user: userCredential.user, tokens };
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics() {
    const [
      totalHospitals,
      activeHospitals,
      totalStaff,
      activeStaff,
      totalPatients,
      activePatients
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.hospital.count({ where: { isActive: true } }),
      prisma.staff.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.patient.count({ where: { isActive: true } })
    ]);

    return {
      hospitals: { total: totalHospitals, active: activeHospitals },
      staff: { total: totalStaff, active: activeStaff },
      patients: { total: totalPatients, active: activePatients }
    };
  }

  /**
   * Get all hospitals with pagination
   */
  async getAllHospitals({ page, limit, search, status }) {
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== undefined) {
      where.isActive = status === 'active';
    }

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        include: {
          _count: {
            select: {
              staff: true,
              patients: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.hospital.count({ where })
    ]);

    return {
      hospitals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Toggle hospital status
   */
  async toggleHospitalStatus(hospitalId, isActive) {
    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: { 
        isActive,
        updatedAt: new Date()
      }
    });

    return hospital;
  }

  /**
   * Get system logs (if you have logging implemented)
   */
  async getSystemLogs({ page, limit, level, startDate, endDate }) {
    // This would depend on your logging implementation
    // For now, returning mock data structure
    return {
      logs: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    };
  }
}

module.exports = new SuperAdminService();