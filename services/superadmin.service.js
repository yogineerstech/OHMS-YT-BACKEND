const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/bcrypt.utils');
const authService = require('./auth.service');

class SuperAdminService {
  /**
   * Check if super admin already exists
   */
  async superAdminExists() {
    const superAdmin = await prisma.superAdmin.findFirst({
      where: { isActive: true }
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

    // Check if email already exists in SuperAdmin
    const existingSuperAdmin = await prisma.superAdmin.findFirst({
      where: { email: userData.email }
    });

    if (existingSuperAdmin) {
      throw new Error('Email already exists');
    }

    // Also check if email exists in Staff (to prevent conflicts)
    const allStaff = await prisma.staff.findMany({
      select: {
        id: true,
        personalDetails: true
      }
    });
    
    const existingStaff = allStaff.find(staff => 
      staff.personalDetails && 
      typeof staff.personalDetails === 'object' && 
      staff.personalDetails.email === userData.email
    );

    if (existingStaff) {
      throw new Error('Email already exists in staff records');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create super admin user
    const superAdmin = await prisma.superAdmin.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || null,
        isActive: true
      }
    });

    // Create super admin credentials
    await prisma.superAdminCredential.create({
      data: {
        superAdminId: superAdmin.id,
        credentialType: 'email',
        credentialDataHash: hashedPassword,
        isActive: true,
        lastUsed: new Date()
      }
    });

    // Generate tokens
    const tokens = await authService.generateTokensForSuperAdmin(superAdmin, ipAddress, userAgent);

    return { user: superAdmin, tokens };
  }

  /**
   * Authenticate super admin
   */

  async authenticateSuperAdmin(email, password, ipAddress, userAgent) {
    // Find super admin by email
    const superAdmin = await prisma.superAdmin.findFirst({
      where: {
        email: email,
        isActive: true
      },
      include: {
        credentials: {
          where: {
            credentialType: 'email',
            isActive: true
          }
        }
      }
    });

    if (!superAdmin || !superAdmin.credentials.length) {
      throw new Error('Invalid email or password');
    }

    const credential = superAdmin.credentials[0];
    
    const isValidPassword = await comparePassword(password, credential.credentialDataHash);
    if (!isValidPassword) {
      // Update failed attempts
      await prisma.superAdminCredential.update({
        where: { id: credential.id },
        data: { 
          failedAttempts: { increment: 1 },
          lastUsed: new Date()
        }
      });
      throw new Error('Invalid email or password');
    }

    // Check if account is locked due to failed attempts
    if (credential.failedAttempts >= 5) {
      throw new Error('Account is locked due to multiple failed attempts');
    }

    // Reset failed attempts on successful login
    await prisma.superAdminCredential.update({
      where: { id: credential.id },
      data: { 
        failedAttempts: 0,
        lastUsed: new Date()
      }
    });

    // Generate tokens
    const tokens = await authService.generateTokensForSuperAdmin(superAdmin, ipAddress, userAgent);

    return { user: superAdmin, tokens };
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
      activePatients,
      totalSuperAdmins,
      activeSuperAdmins
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.hospital.count({ where: { isActive: true } }),
      prisma.staff.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.patient.count({ where: { isActive: true } }),
      prisma.superAdmin.count(),
      prisma.superAdmin.count({ where: { isActive: true } })
    ]);

    return {
      hospitals: { total: totalHospitals, active: activeHospitals },
      staff: { total: totalStaff, active: activeStaff },
      patients: { total: totalPatients, active: activePatients },
      superAdmins: { total: totalSuperAdmins, active: activeSuperAdmins }
    };
  }

  /**
   * Get all hospitals with pagination
   */
  async getAllHospitals({ page = 1, limit = 10, search, status }) {
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }
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
   * Get system logs
   */
  async getSystemLogs({ page = 1, limit = 10, level, startDate, endDate }) {
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