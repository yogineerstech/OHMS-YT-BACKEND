const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/bcrypt.utils');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt.utils');
const crypto = require('crypto');

class AuthService {
  /**
   * Create a new user with credentials
   */
  async createUser(userData) {
    const { email, password, personalDetails, roleId, hospitalId, departmentId, createdBy } = userData;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Check if user already exists in Staff
    const allStaff = await prisma.staff.findMany({
      select: {
        id: true,
        personalDetails: true
      }
    });
    
    const existingStaff = allStaff.find(staff => 
      staff.personalDetails && 
      typeof staff.personalDetails === 'object' && 
      staff.personalDetails.email === email.toLowerCase()
    );

    if (existingStaff) {
      throw new Error('User with this email already exists');
    }

    // Check if email exists in SuperAdmin
    const existingSuperAdmin = await prisma.superAdmin.findFirst({
      where: { email: email.toLowerCase() }
    });

    if (existingSuperAdmin) {
      throw new Error('Email already exists in super admin records');
    }

    // Validate role exists and is active
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        isActive: true
      }
    });

    if (!role) {
      throw new Error('Invalid or inactive role');
    }

    // Validate hospital exists if provided
    if (hospitalId) {
      const hospital = await prisma.hospital.findFirst({
        where: {
          id: hospitalId,
          isActive: true
        }
      });

      if (!hospital) {
        throw new Error('Invalid or inactive hospital');
      }
    }

    // Validate department exists if provided
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          hospitalId: hospitalId,
          isActive: true
        }
      });

      if (!department) {
        throw new Error('Invalid or inactive department');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const salt = crypto.randomBytes(32).toString('hex');

    // Generate employee ID
    const employeeId = await this.generateEmployeeId(hospitalId);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create staff record
      const user = await tx.staff.create({
        data: {
          hospitalId,
          roleId,
          departmentId,
          employeeId,
          personalDetails: {
            ...personalDetails,
            email: email.toLowerCase()
          },
          contactDetails: {
            email: email.toLowerCase(),
            ...personalDetails.contactDetails
          },
          employmentDetails: {
            employmentType: 'permanent',
            employmentStatus: 'active',
            joiningDate: new Date(),
            probationPeriodMonths: 6
          },
          createdById: createdBy,
          isActive: true
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
          },
          hospital: true,
          department: true
        }
      });

      // Create user credentials
      await tx.userCredential.create({
        data: {
          userId: user.id,
          credentialType: 'email',
          credentialDataHash: hashedPassword,
          salt: salt,
          algorithm: 'bcrypt',
          isPrimary: true,
          isActive: true
        }
      });

      return user;
    });

    return result;
  }

  /**
   * Authenticate user with email and password (Staff)
   */
  async authenticateUser(email, password, ipAddress, userAgent) {
    // Find user with credentials
    const userCredentials = await prisma.userCredential.findMany({
      where: {
        credentialType: 'email',
        isActive: true
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
            },
            hospital: true,
            department: true
          }
        }
      }
    });

    // Filter by email and active user
    const userCredential = userCredentials.find(cred => 
      cred.user && 
      cred.user.isActive &&
      cred.user.personalDetails &&
      typeof cred.user.personalDetails === 'object' &&
      cred.user.personalDetails.email === email.toLowerCase()
    );

    if (!userCredential) {
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (userCredential.lockoutUntil && userCredential.lockoutUntil > new Date()) {
      const lockoutMinutes = Math.ceil((userCredential.lockoutUntil - new Date()) / 60000);
      throw new Error(`Account is locked. Try again in ${lockoutMinutes} minutes`);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, userCredential.credentialDataHash);
    
    if (!isValidPassword) {
      // Update failed attempts
      const failedAttempts = userCredential.failedAttempts + 1;
      const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 minutes lockout

      await prisma.userCredential.update({
        where: { id: userCredential.id },
        data: { 
          failedAttempts,
          lockoutUntil,
          lastUsed: new Date()
        }
      });

      if (lockoutUntil) {
        throw new Error('Account locked due to multiple failed attempts. Try again in 15 minutes');
      }

      throw new Error('Invalid email or password');
    }

    // Check if user's hospital is active
    if (userCredential.user.hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: userCredential.user.hospitalId },
        select: { isActive: true }
      });

      if (!hospital || !hospital.isActive) {
        throw new Error('Hospital access is currently disabled');
      }
    }

    // Reset failed attempts on successful login
    await prisma.userCredential.update({
      where: { id: userCredential.id },
      data: { 
        failedAttempts: 0,
        lockoutUntil: null,
        lastUsed: new Date()
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(userCredential.user, ipAddress, userAgent);

    return {
      user: userCredential.user,
      tokens
    };
  }

  /**
   * Authenticate SuperAdmin
   */
  async authenticateSuperAdmin(email, password, ipAddress, userAgent) {
    // Find super admin by email
    const superAdmin = await prisma.superAdmin.findFirst({
      where: {
        email: email.toLowerCase(),
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
    
    // Check if account is locked
    if (credential.lockoutUntil && credential.lockoutUntil > new Date()) {
      const lockoutMinutes = Math.ceil((credential.lockoutUntil - new Date()) / 60000);
      throw new Error(`Account is locked. Try again in ${lockoutMinutes} minutes`);
    }
    
    const isValidPassword = await comparePassword(password, credential.credentialDataHash);
    if (!isValidPassword) {
      // Update failed attempts
      const failedAttempts = credential.failedAttempts + 1;
      const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.superAdminCredential.update({
        where: { id: credential.id },
        data: { 
          failedAttempts,
          lockoutUntil,
          lastUsed: new Date()
        }
      });

      if (lockoutUntil) {
        throw new Error('Account locked due to multiple failed attempts. Try again in 15 minutes');
      }

      throw new Error('Invalid email or password');
    }

    // Reset failed attempts on successful login
    await prisma.superAdminCredential.update({
      where: { id: credential.id },
      data: { 
        failedAttempts: 0,
        lockoutUntil: null,
        lastUsed: new Date()
      }
    });

    // Generate tokens
    const tokens = await this.generateTokensForSuperAdmin(superAdmin, ipAddress, userAgent);

    return { user: superAdmin, tokens };
  }

  /**
   * Generate access and refresh tokens for Staff
   */
  async generateTokens(user, ipAddress, userAgent) {
    const payload = {
      userId: user.id,
      userType: 'staff',
      email: user.personalDetails?.email,
      roleId: user.roleId,
      hospitalId: user.hospitalId,
      departmentId: user.departmentId,
      roleCode: user.role?.roleCode
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Calculate expiration times
    const accessTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionTokenHash: accessToken,
        refreshTokenHash: refreshToken,
        ipAddress,
        userAgent,
        deviceInfo: this.parseUserAgent(userAgent),
        loginTimestamp: new Date(),
        lastActivity: new Date(),
        expiresAt: accessTokenExpiry,
        isActive: true,
        sessionType: 'web'
      }
    });

    return { 
      accessToken, 
      refreshToken, 
      expiresAt: accessTokenExpiry,
      refreshExpiresAt: refreshTokenExpiry
    };
  }

  /**
   * Generate tokens for SuperAdmin
   */
  async generateTokensForSuperAdmin(superAdmin, ipAddress, userAgent) {
    const payload = {
      userId: superAdmin.id,
      userType: 'super_admin',
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Calculate expiration times
    const accessTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create session
    await prisma.superAdminSession.create({
      data: {
        superAdminId: superAdmin.id,
        sessionTokenHash: accessToken,
        refreshTokenHash: refreshToken,
        ipAddress,
        userAgent,
        expiresAt: accessTokenExpiry,
      }
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24 hours in seconds
      expiresAt: accessTokenExpiry,
      refreshExpiresAt: refreshTokenExpiry
    };
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId, sessionToken, reason = 'user_logout', userType = 'staff') {
    if (userType === 'super_admin') {
      const result = await prisma.superAdminSession.updateMany({
        where: {
          superAdminId: userId,
          sessionTokenHash: sessionToken,
          isActive: true
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date()
        }
      });
      return result.count > 0;
    } else {
      const result = await prisma.userSession.updateMany({
        where: {
          userId,
          sessionTokenHash: sessionToken,
          isActive: true
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date(),
          logoutReason: reason
        }
      });
      return result.count > 0;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId, reason = 'user_logout_all', userType = 'staff') {
    if (userType === 'super_admin') {
      const result = await prisma.superAdminSession.updateMany({
        where: {
          superAdminId: userId,
          isActive: true
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date()
        }
      });
      return result.count;
    } else {
      const result = await prisma.userSession.updateMany({
        where: {
          userId,
          isActive: true
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date(),
          logoutReason: reason
        }
      });
      return result.count;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    // Try to find session in both staff and super admin sessions
    let session = await prisma.userSession.findFirst({
      where: {
        refreshTokenHash: refreshToken,
        isActive: true,
        expiresAt: {
          gt: new Date()
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
            },
            hospital: true,
            department: true
          }
        }
      }
    });

    let userType = 'staff';

    if (!session) {
      // Try super admin session
      session = await prisma.superAdminSession.findFirst({
        where: {
          refreshTokenHash: refreshToken,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          superAdmin: true
        }
      });
      userType = 'super_admin';
    }

    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = userType === 'super_admin' ? session.superAdmin : session.user;

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Generate new tokens
    const tokens = userType === 'super_admin' 
      ? await this.generateTokensForSuperAdmin(user, session.ipAddress, session.userAgent)
      : await this.generateTokens(user, session.ipAddress, session.userAgent);

    // Invalidate old session
    if (userType === 'super_admin') {
      await prisma.superAdminSession.update({
        where: { id: session.id },
        data: {
          isActive: false,
          logoutTimestamp: new Date()
        }
      });
    } else {
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          isActive: false,
          logoutTimestamp: new Date(),
          logoutReason: 'token_refresh'
        }
      });
    }

    return {
      user,
      tokens,
      userType
    };
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId, userType = 'staff') {
    if (userType === 'super_admin') {
      return await prisma.superAdminSession.findMany({
        where: {
          superAdminId: userId,
          isActive: true
        },
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          loginTimestamp: true,
          lastActivity: true
        },
        orderBy: {
          lastActivity: 'desc'
        }
      });
    } else {
      return await prisma.userSession.findMany({
        where: {
          userId,
          isActive: true
        },
        select: {
          id: true,
          ipAddress: true,
          deviceInfo: true,
          loginTimestamp: true,
          lastActivity: true,
          sessionType: true
        },
        orderBy: {
          lastActivity: 'desc'
        }
      });
    }
  }

  /**
   * Terminate specific session
   */
  async terminateSession(userId, sessionId, userType = 'staff') {
    if (userType === 'super_admin') {
      const result = await prisma.superAdminSession.updateMany({
        where: {
          id: sessionId,
          superAdminId: userId,
          isActive: true
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date()
        }
      });
      return result.count > 0;
    } else {
      const result = await prisma.userSession.updateMany({
        where: {
          id: sessionId,
          userId,
          isActive: true
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date(),
          logoutReason: 'session_terminated'
        }
      });
      return result.count > 0;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, oldPassword, newPassword, userType = 'staff') {
    if (userType === 'super_admin') {
      // Get current super admin credentials
      const credential = await prisma.superAdminCredential.findFirst({
        where: {
          superAdminId: userId,
          credentialType: 'email',
          isActive: true
        }
      });

      if (!credential) {
        throw new Error('User credentials not found');
      }

      // Verify old password
      const isValidOldPassword = await comparePassword(oldPassword, credential.credentialDataHash);
      if (!isValidOldPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.superAdminCredential.update({
        where: { id: credential.id },
        data: {
          credentialDataHash: hashedNewPassword,
          lastUsed: new Date()
        }
      });

      // Invalidate all sessions
      await this.logoutAll(userId, 'password_changed', 'super_admin');

      return true;
    } else {
      // Get current credentials
      const credential = await prisma.userCredential.findFirst({
        where: {
          userId,
          credentialType: 'email',
          isPrimary: true,
          isActive: true
        }
      });

      if (!credential) {
        throw new Error('User credentials not found');
      }

      // Verify old password
      const isValidOldPassword = await comparePassword(oldPassword, credential.credentialDataHash);
      if (!isValidOldPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      const newSalt = crypto.randomBytes(32).toString('hex');

      // Update password and add to history
      const passwordHistory = credential.passwordHistory || [];
      passwordHistory.push({
        hash: credential.credentialDataHash,
        changedAt: new Date()
      });

      await prisma.userCredential.update({
        where: { id: credential.id },
        data: {
          credentialDataHash: hashedNewPassword,
          salt: newSalt,
          passwordHistory: passwordHistory.slice(-5), // Keep last 5 passwords
          lastUsed: new Date()
        }
      });

      // Invalidate all other sessions
      await this.logoutAll(userId, 'password_changed');

      return true;
    }
  }

  /**
   * Generate unique employee ID
   */
  async generateEmployeeId(hospitalId) {
    let hospitalCode = 'HOS';
    
    if (hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { hospitalCode: true, name: true }
      });
      
      if (hospital?.hospitalCode) {
        hospitalCode = hospital.hospitalCode;
      } else if (hospital?.name) {
        hospitalCode = hospital.name.substring(0, 3).toUpperCase();
      }
    }

    // Get current year
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Find the last employee ID for this hospital
    const lastEmployee = await prisma.staff.findFirst({
      where: {
        hospitalId,
        employeeId: {
          startsWith: `${hospitalCode}${year}`
        }
      },
      orderBy: {
        employeeId: 'desc'
      }
    });

    let sequence = 1;
    if (lastEmployee?.employeeId) {
      const lastSequence = parseInt(lastEmployee.employeeId.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${hospitalCode}${year}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Parse user agent for device info
   */
  parseUserAgent(userAgent) {
    if (!userAgent) return {};

    const info = {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown'
    };

    // Simple parsing - you can use a library like 'ua-parser-js' for better results
    if (userAgent.includes('Chrome')) info.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) info.browser = 'Firefox';
    else if (userAgent.includes('Safari')) info.browser = 'Safari';
    else if (userAgent.includes('Edge')) info.browser = 'Edge';

    if (userAgent.includes('Windows')) info.os = 'Windows';
    else if (userAgent.includes('Mac')) info.os = 'macOS';
    else if (userAgent.includes('Linux')) info.os = 'Linux';
    else if (userAgent.includes('Android')) info.os = 'Android';
    else if (userAgent.includes('iOS')) info.os = 'iOS';

    if (userAgent.includes('Mobile')) info.device = 'Mobile';
    else if (userAgent.includes('Tablet')) info.device = 'Tablet';
    else info.device = 'Desktop';

    return info;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const [staffResult, superAdminResult] = await Promise.all([
      prisma.userSession.updateMany({
        where: {
          isActive: true,
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date(),
          logoutReason: 'session_expired'
        }
      }),
      prisma.superAdminSession.updateMany({
        where: {
          isActive: true,
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          isActive: false,
          logoutTimestamp: new Date()
        }
      })
    ]);

    return staffResult.count + superAdminResult.count;
  }
}

module.exports = new AuthService();