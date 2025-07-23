const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const authConfig = require('../config/auth');
const { defineAbilitiesFor } = require('../utils/casl');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Extract token from request
const extractToken = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check query parameter (for websocket connections)
  if (req.query.token) {
    return req.query.token;
  }
  
  // Check cookie (for browser-based apps)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  
  return null;
};

// Verify JWT token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('INVALID_TOKEN');
    } else {
      throw new Error('TOKEN_VERIFICATION_FAILED');
    }
  }
};

// Main authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify token
    const decoded = await verifyToken(token);
    
    // Validate session
    const session = await prisma.userSession.findFirst({
      where: {
        id: decoded.sessionId,
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
                  where: {
                    granted: true,
                    OR: [
                      { expiresAt: null },
                      { expiresAt: { gt: new Date() } }
                    ]
                  },
                  include: {
                    permission: true
                  }
                }
              }
            },
            hospital: {
              select: {
                id: true,
                name: true,
                hospitalCode: true,
                isActive: true,
                timezone: true
              }
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            doctor: true,
            nurse: true
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
    }

    // Check if user is active
    if (!session.user.isActive || session.user.employmentStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
        code: 'INACTIVE_USER'
      });
    }

    // Check if hospital is active
    if (!session.user.hospital?.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hospital is inactive',
        code: 'INACTIVE_HOSPITAL'
      });
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    });

    // Build user abilities
    const ability = defineAbilitiesFor(session.user);

    // Attach user info and abilities to request
    req.user = session.user;
    req.session = session;
    req.ability = ability;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    let statusCode = 401;
    let message = 'Authentication failed';
    let code = 'AUTH_FAILED';

    switch (error.message) {
      case 'TOKEN_EXPIRED':
        message = 'Access token expired';
        code = 'TOKEN_EXPIRED';
        break;
      case 'INVALID_TOKEN':
        message = 'Invalid access token';
        code = 'INVALID_TOKEN';
        break;
      case 'TOKEN_VERIFICATION_FAILED':
        message = 'Token verification failed';
        code = 'TOKEN_VERIFICATION_FAILED';
        break;
      default:
        statusCode = 500;
        message = 'Internal authentication error';
        code = 'INTERNAL_AUTH_ERROR';
    }

    res.status(statusCode).json({
      success: false,
      message,
      code
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      req.user = null;
      req.ability = defineAbilitiesFor(null);
      return next();
    }

    // Use the same logic as authenticate but don't fail
    await authenticate(req, res, next);
  } catch (error) {
    req.user = null;
    req.ability = defineAbilitiesFor(null);
    next();
  }
};

// Check if user has specific role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role?.roleCode;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions',
        code: 'INSUFFICIENT_ROLE_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Check if user belongs to specific hospital
const requireHospital = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const userHospitalId = req.user.hospitalId;
  const requestedHospitalId = req.params.hospitalId || req.body.hospitalId || req.query.hospitalId;

  // Super admin can access any hospital
  if (req.user.role?.roleCode === 'SUPER_ADMIN') {
    return next();
  }

  if (requestedHospitalId && userHospitalId !== requestedHospitalId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this hospital',
      code: 'HOSPITAL_ACCESS_DENIED'
    });
  }

  next();
};

// Check if user belongs to specific department
const requireDepartment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const userDepartmentId = req.user.departmentId;
  const requestedDepartmentId = req.params.departmentId || req.body.departmentId || req.query.departmentId;

  // Admin roles can access any department in their hospital
  if (['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role?.roleCode)) {
    return next();
  }

  if (requestedDepartmentId && userDepartmentId !== requestedDepartmentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this department',
      code: 'DEPARTMENT_ACCESS_DENIED'
    });
  }

  next();
};

// Audit logging middleware
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      setImmediate(async () => {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.id,
              action,
              resource,
              resourceId: req.params.id || req.body.id,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              requestData: {
                method: req.method,
                url: req.originalUrl,
                body: req.body,
                query: req.query,
                params: req.params
              },
              responseStatus: res.statusCode,
              timestamp: new Date()
            }
          });
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  if (!req.user || !req.session) {
    return next();
  }

  try {
    // Check for concurrent sessions limit
    const activeSessions = await prisma.userSession.count({
      where: {
        userId: req.user.id,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    const maxConcurrentSessions = req.user.role?.maxConcurrentSessions || 5;
    
    if (activeSessions > maxConcurrentSessions) {
      // Deactivate oldest sessions
      const oldestSessions = await prisma.userSession.findMany({
        where: {
          userId: req.user.id,
          isActive: true,
          id: { not: req.session.id }
        },
        orderBy: { lastActivity: 'asc' },
        take: activeSessions - maxConcurrentSessions
      });

      await prisma.userSession.updateMany({
        where: {
          id: { in: oldestSessions.map(s => s.id) }
        },
        data: {
          isActive: false,
          logoutReason: 'session_limit_exceeded'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    next();
  }
};

// Device trust middleware
const deviceTrust = async (req, res, next) => {
  if (!req.user || !req.session) {
    return next();
  }

  try {
    const deviceFingerprint = req.headers['x-device-fingerprint'];
    const currentDevice = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      fingerprint: deviceFingerprint
    };

    // Check if device is trusted
    const trustedDevices = req.session.deviceInfo?.trustedDevices || [];
    const isDeviceTrusted = trustedDevices.some(device => 
      device.fingerprint === deviceFingerprint ||
      (device.userAgent === currentDevice.userAgent && device.ipAddress === currentDevice.ipAddress)
    );

    req.deviceTrusted = isDeviceTrusted;
    req.deviceInfo = currentDevice;

    next();
  } catch (error) {
    console.error('Device trust check error:', error);
    req.deviceTrusted = false;
    next();
  }
};

// Two-factor authentication middleware
const requireTwoFactor = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    // Check if 2FA is enabled for user
    const mfaConfig = await prisma.mfaConfiguration.findFirst({
      where: {
        userId: req.user.id,
        isEnabled: true
      }
    });

    if (!mfaConfig) {
      return next(); // 2FA not required
    }

    // Check if current session has passed 2FA
    if (!req.session.twoFactorAuthenticated) {
      return res.status(403).json({
        success: false,
        message: 'Two-factor authentication required',
        code: 'TWO_FACTOR_REQUIRED'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Two-factor authentication check failed',
      code: 'TWO_FACTOR_CHECK_FAILED'
    });
  }
};

// IP whitelist middleware
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        code: 'IP_NOT_ALLOWED'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireHospital,
  requireDepartment,
  auditLog,
  validateSession,
  deviceTrust,
  requireTwoFactor,
  ipWhitelist,
  authRateLimit,
  generalRateLimit
};