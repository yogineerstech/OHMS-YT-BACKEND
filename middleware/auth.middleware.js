const passport = require('../config/passport');
const { defineAbilitiesFor } = require('../config/casl');
const { prisma } = require('../config/database');

const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: err.message
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: info?.message || 'Invalid token'
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if user's hospital is active (if they belong to one)
    if (user.hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.hospitalId },
        select: { isActive: true }
      });

      if (!hospital || !hospital.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Hospital access is deactivated'
        });
      }
    }

    // Update last activity in session
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const { hashToken } = require('../utils/token.utils');
        const tokenHash = hashToken(token);
        
        // Check if this is a super admin user (they don't have personalDetails)
        const isSuperAdmin = !user.personalDetails;
        
        if (isSuperAdmin) {
          // Update super admin session
          await prisma.superAdminSession.updateMany({
            where: {
              superAdminId: user.id,
              accessTokenHash: tokenHash,
              isActive: true
            },
            data: {
              lastActivity: new Date()
            }
          });
        } else {
          // Update staff session
          await prisma.userSession.updateMany({
            where: {
              userId: user.id,
              accessTokenHash: tokenHash,
              isActive: true
            },
            data: {
              lastActivity: new Date()
            }
          });
        }
      }
    } catch (sessionError) {
      // Don't fail authentication if session update fails
      console.warn('Failed to update session activity:', sessionError.message);
    }

    req.user = user;
    req.ability = defineAbilitiesFor(user);
    next();
  })(req, res, next);
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

// Check if user has valid session
const requireActiveSession = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const { hashToken } = require('../utils/token.utils');
    const tokenHash = hashToken(token);

    // Check if this is a super admin user
    const isSuperAdmin = !req.user.personalDetails;
    let activeSession = null;

    if (isSuperAdmin) {
      // Check super admin session
      activeSession = await prisma.superAdminSession.findFirst({
        where: {
          superAdminId: req.user.id,
          accessTokenHash: tokenHash,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });
    } else {
      // Check staff session
      activeSession = await prisma.userSession.findFirst({
        where: {
          userId: req.user.id,
          accessTokenHash: tokenHash,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });
    }

    if (!activeSession) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Session validation error',
      error: error.message
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    req.user = null;
    req.ability = defineAbilitiesFor(null);
    return next();
  }

  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err || !user) {
      req.user = null;
      req.ability = defineAbilitiesFor(null);
      return next();
    }

    req.user = user;
    req.ability = defineAbilitiesFor(user);
    next();
  })(req, res, next);
};

// Middleware to log user activities
const logUserActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // You can implement activity logging here
        console.log(`User ${req.user.id} performed ${action} at ${new Date().toISOString()}`);
        
        // Optional: Store in database
        // await prisma.userActivityLog.create({
        //   data: {
        //     userId: req.user.id,
        //     action,
        //     ipAddress: req.ip,
        //     userAgent: req.get('User-Agent'),
        //     timestamp: new Date()
        //   }
        // });
      }
    } catch (error) {
      console.warn('Failed to log user activity:', error.message);
    }
    next();
  };
};

// Rate limiting for authentication attempts
const authRateLimit = {
  attempts: new Map(),
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes

  check(identifier) {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || { count: 0, resetTime: now + this.windowMs };

    if (now > attempts.resetTime) {
      attempts.count = 0;
      attempts.resetTime = now + this.windowMs;
    }

    if (attempts.count >= this.maxAttempts) {
      return false;
    }

    attempts.count++;
    this.attempts.set(identifier, attempts);
    return true;
  },

  reset(identifier) {
    this.attempts.delete(identifier);
  }
};

const checkAuthRateLimit = (req, res, next) => {
  const identifier = req.ip + ':' + (req.body.email || 'unknown');
  
  if (!authRateLimit.check(identifier)) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil(authRateLimit.windowMs / 1000)
    });
  }

  // Reset rate limit on successful authentication
  res.on('finish', () => {
    if (res.statusCode === 200) {
      authRateLimit.reset(identifier);
    }
  });

  next();
};

module.exports = {
  authenticateJWT,
  requireAuth,
  requireActiveSession,
  optionalAuth,
  logUserActivity,
  checkAuthRateLimit
};
