const { body, param, query, validationResult } = require('express-validator');

// Common validation rules
const commonRules = {
  mongoId: param('id').isMongoId().withMessage('Invalid ID format'),
  
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isString().withMessage('Sort field must be a string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],

  hospitalId: body('hospitalId').isMongoId().withMessage('Valid hospital ID is required')
};

// Auth validation rules
const authValidation = {
  login: [
    body('employeeId')
      .notEmpty()
      .withMessage('Employee ID is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Employee ID must be between 3 and 20 characters'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    body('hospitalId')
      .isMongoId()
      .withMessage('Valid hospital ID is required'),
    
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain uppercase, lowercase, number and special character'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      })
  ],

  resetPassword: [
    body('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain uppercase, lowercase, number and special character'),
    
    body('temporaryPassword')
      .optional()
      .isBoolean()
      .withMessage('Temporary password must be a boolean')
  ]
};

// Role validation rules
const roleValidation = {
  create: [
    body('roleName')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters'),
    
    body('roleCode')
      .notEmpty()
      .withMessage('Role code is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Role code must be between 2 and 50 characters')
      .matches(/^[A-Z_]+$/)
      .withMessage('Role code must contain only uppercase letters and underscores'),
    
    body('roleType')
      .optional()
      .isIn(['clinical', 'administrative', 'technical', 'support', 'general'])
      .withMessage('Invalid role type'),
    
    body('roleDescription')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Role description must not exceed 500 characters'),
    
    body('hierarchyLevel')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Hierarchy level must be between 1 and 10'),
    
    body('categoryId')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    body('responsibilities')
      .optional()
      .isArray()
      .withMessage('Responsibilities must be an array'),
    
    body('responsibilities.*')
      .optional()
      .isString()
      .withMessage('Each responsibility must be a string'),
    
    body('requiredQualifications')
      .optional()
      .isObject()
      .withMessage('Required qualifications must be an object'),
    
    body('isPatientFacing')
      .optional()
      .isBoolean()
      .withMessage('Patient facing must be a boolean'),
    
    body('isClinicalRole')
      .optional()
      .isBoolean()
      .withMessage('Clinical role must be a boolean'),
    
    body('applyDefaultPermissions')
      .optional()
      .isBoolean()
      .withMessage('Apply default permissions must be a boolean')
  ],

  update: [
    param('roleId').isMongoId().withMessage('Invalid role ID'),
    
    body('roleName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters'),
    
    body('roleDescription')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Role description must not exceed 500 characters'),
    
    body('hierarchyLevel')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Hierarchy level must be between 1 and 10'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Active status must be a boolean')
  ],

  grantPermission: [
    param('roleId').isMongoId().withMessage('Invalid role ID'),
    
    body('permissionId')
      .isMongoId()
      .withMessage('Valid permission ID is required'),
    
    body('conditions')
      .optional()
      .isObject()
      .withMessage('Conditions must be an object'),
    
    body('timeRestrictions')
      .optional()
      .isObject()
      .withMessage('Time restrictions must be an object'),
    
    body('timeRestrictions.startTime')
      .optional()
      .isInt({ min: 0, max: 1439 })
      .withMessage('Start time must be between 0 and 1439 minutes'),
    
    body('timeRestrictions.endTime')
      .optional()
      .isInt({ min: 0, max: 1439 })
      .withMessage('End time must be between 0 and 1439 minutes'),
    
    body('timeRestrictions.allowedDays')
      .optional()
      .isArray()
      .withMessage('Allowed days must be an array'),
    
    body('timeRestrictions.allowedDays.*')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Each day must be between 0 and 6'),
    
    body('locationRestrictions')
      .optional()
      .isObject()
      .withMessage('Location restrictions must be an object'),
    
    body('dataRestrictions')
      .optional()
      .isObject()
      .withMessage('Data restrictions must be an object'),
    
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be in ISO 8601 format')
  ],

  clone: [
    param('roleId').isMongoId().withMessage('Invalid role ID'),
    
    body('roleName')
      .notEmpty()
      .withMessage('New role name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters'),
    
    body('roleCode')
      .notEmpty()
      .withMessage('New role code is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Role code must be between 2 and 50 characters')
      .matches(/^[A-Z_]+$/)
      .withMessage('Role code must contain only uppercase letters and underscores'),
    
    body('roleDescription')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Role description must not exceed 500 characters')
  ]
};

// Permission validation rules
const permissionValidation = {
  create: [
    body('permissionName')
      .notEmpty()
      .withMessage('Permission name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Permission name must be between 2 and 100 characters'),
    
    body('permissionCode')
      .notEmpty()
      .withMessage('Permission code is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Permission code must be between 2 and 100 characters')
      .matches(/^[A-Z_]+$/)
      .withMessage('Permission code must contain only uppercase letters and underscores'),
    
    body('action')
      .notEmpty()
      .withMessage('Action is required')
      .isString()
      .withMessage('Action must be a string'),
    
    body('resource')
      .notEmpty()
      .withMessage('Resource is required')
      .isString()
      .withMessage('Resource must be a string'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    
    body('permissionType')
      .optional()
      .isIn(['system', 'functional', 'data', 'administrative'])
      .withMessage('Invalid permission type'),
    
    body('sensitivityLevel')
      .optional()
      .isIn(['public', 'internal', 'confidential', 'restricted'])
      .withMessage('Invalid sensitivity level'),
    
    body('module')
      .optional()
      .isString()
      .withMessage('Module must be a string'),
    
    body('auditRequired')
      .optional()
      .isBoolean()
      .withMessage('Audit required must be a boolean'),
    
    body('approvalRequired')
      .optional()
      .isBoolean()
      .withMessage('Approval required must be a boolean')
  ],

  update: [
    param('permissionId').isMongoId().withMessage('Invalid permission ID'),
    
    body('permissionName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Permission name must be between 2 and 100 characters'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    
    body('sensitivityLevel')
      .optional()
      .isIn(['public', 'internal', 'confidential', 'restricted'])
      .withMessage('Invalid sensitivity level')
  ]
};

// Staff validation rules
const staffValidation = {
  create: [
    body('employeeId')
      .notEmpty()
      .withMessage('Employee ID is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Employee ID must be between 3 and 20 characters'),
    
    body('hospitalId')
      .isMongoId()
      .withMessage('Valid hospital ID is required'),
    
    body('roleId')
      .isMongoId()
      .withMessage('Valid role ID is required'),
    
    body('personalDetails')
      .isObject()
      .withMessage('Personal details are required'),
    
    body('personalDetails.firstName')
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    
    body('personalDetails.lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    
    body('personalDetails.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    
    body('personalDetails.phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    
    body('personalDetails.dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Invalid date of birth format'),
    
    body('personalDetails.gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Invalid gender'),
    
    body('contactDetails')
      .optional()
      .isObject()
      .withMessage('Contact details must be an object'),
    
    body('employmentType')
      .isIn(['permanent', 'contract', 'consultant', 'temporary', 'intern'])
      .withMessage('Invalid employment type'),
    
    body('departmentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    
    body('joiningDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid joining date format'),
    
    body('probationPeriodMonths')
      .optional()
      .isInt({ min: 0, max: 24 })
      .withMessage('Probation period must be between 0 and 24 months'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character')
  ],

  update: [
    param('staffId').isMongoId().withMessage('Invalid staff ID'),
    
    body('personalDetails.firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    
    body('personalDetails.lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    
    body('personalDetails.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    
    body('personalDetails.phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    
    body('employmentStatus')
      .optional()
      .isIn(['active', 'inactive', 'suspended', 'terminated'])
      .withMessage('Invalid employment status'),
    
    body('roleId')
      .optional()
      .isMongoId()
      .withMessage('Invalid role ID'),
    
    body('departmentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID')
  ]
};

// Patient validation rules
const patientValidation = {
  create: [
    body('hospitalId')
      .isMongoId()
      .withMessage('Valid hospital ID is required'),
    
    body('personalDetails')
      .isObject()
      .withMessage('Personal details are required'),
    
    body('personalDetails.firstName')
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    
    body('personalDetails.lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    
    body('personalDetails.dateOfBirth')
      .isISO8601()
      .withMessage('Valid date of birth is required'),
    
    body('personalDetails.gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Invalid gender'),
    
    body('contactDetails.phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    
    body('contactDetails.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    
    body('bloodGroup')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood group'),
    
    body('abhaId')
      .optional()
      .isLength({ min: 14, max: 14 })
      .withMessage('ABHA ID must be 14 characters'),
    
    body('emergencyContacts')
      .optional()
      .isArray()
      .withMessage('Emergency contacts must be an array')
  ],

  update: [
    param('patientId').isMongoId().withMessage('Invalid patient ID'),
    
    body('personalDetails.firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    
    body('personalDetails.lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    
    body('contactDetails.phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    
    body('contactDetails.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    
    body('patientStatus')
      .optional()
      .isIn(['active', 'inactive', 'deceased'])
      .withMessage('Invalid patient status')
  ]
};

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Custom validation functions
const customValidations = {
  // Check if employee ID is unique within hospital
  isUniqueEmployeeId: async (employeeId, { req }) => {
    const existingStaff = await prisma.staff.findFirst({
      where: {
        employeeId,
        hospitalId: req.body.hospitalId,
        isActive: true
      }
    });
    
    if (existingStaff) {
      throw new Error('Employee ID already exists in this hospital');
    }
  },

  // Check if role code is unique
  isUniqueRoleCode: async (roleCode) => {
    const existingRole = await prisma.role.findFirst({
      where: { roleCode }
    });
    
    if (existingRole) {
      throw new Error('Role code already exists');
    }
  },

  // Check if permission code is unique
  isUniquePermissionCode: async (permissionCode) => {
    const existingPermission = await prisma.permission.findFirst({
      where: { permissionCode }
    });
    
    if (existingPermission) {
      throw new Error('Permission code already exists');
    }
  },

  // Validate date range
  isValidDateRange: (startDate, endDate) => {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error('Start date must be before end date');
    }
    return true;
  },

  // Validate time range
  isValidTimeRange: (startTime, endTime) => {
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }
    return true;
  }
};

module.exports = {
  commonRules,
  authValidation,
  roleValidation,
  permissionValidation,
  staffValidation,
  patientValidation,
  handleValidationErrors,
  customValidations
};