const { ForbiddenError } = require('@casl/ability');

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role.roleCode;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

const requirePermission = (action, subject, options = {}) => {
  return (req, res, next) => {
    if (!req.ability) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      // Build the subject with hospital scope if needed
      const subjectToCheck = options.withHospitalScope && req.user.hospitalId 
        ? { ...subject, hospitalId: req.user.hospitalId }
        : subject;

      if (!req.ability.can(action, subjectToCheck)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Cannot ${action} ${typeof subjectToCheck === 'string' ? subjectToCheck : JSON.stringify(subjectToCheck)}`
        });
      }
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
        error: error.message
      });
    }
  };
};

const requireHospitalAccess = (req, res, next) => {
  if (!req.user.hospitalId && req.user.role.roleCode !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'No hospital access'
    });
  }

  // Check if user is trying to access their own hospital's data
  const requestedHospitalId = req.params.hospitalId || req.body.hospitalId || req.query.hospitalId;
  
  if (requestedHospitalId && requestedHospitalId !== req.user.hospitalId) {
    if (req.user.role.roleCode !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this hospital',
        userHospital: req.user.hospitalId,
        requestedHospital: requestedHospitalId
      });
    }
  }

  next();
};

// Middleware to ensure data queries are scoped to user's hospital
const scopeToUserHospital = (req, res, next) => {
  if (req.user.hospitalId && req.user.role.roleCode !== 'SUPER_ADMIN') {
    // Add hospital filter to query parameters
    req.hospitalScope = { hospitalId: req.user.hospitalId };
    
    // For POST requests, ensure hospitalId is set
    if (req.method === 'POST' && req.body) {
      req.body.hospitalId = req.user.hospitalId;
    }
    
    // For PUT/PATCH requests, ensure hospitalId cannot be changed
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.body) {
      delete req.body.hospitalId; // Prevent changing hospital
    }
  }
  
  next();
};

const checkSuperAdminRole = (req, res, next) => {
  // Check if user is super admin
  if (req.user && req.user.userType === 'super_admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Super admin access required'
  });
};

module.exports = {
  requireRole,
  requirePermission,
  requireHospitalAccess,
  scopeToUserHospital,
  checkSuperAdminRole
};
