// utils/validation.utils.js

const { body, param, query, validationResult } = require('express-validator');

// ============================================================================= 
// COMMON VALIDATION RULES
// ============================================================================= 

const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  // Password validations
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  strongPassword: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  newPassword: body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  oldPassword: body('oldPassword')
    .notEmpty()
    .withMessage('Old password is required'),

  confirmPassword: body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required'),

  // Common fields
  hospitalCode: body('hospitalCode')
    .optional()
    .isString()
    .withMessage('Hospital code must be a string'),

  rememberMe: body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean'),

  // ID validations
  mongoId: (field, location = 'param') => {
    const validator = location === 'param' ? param(field) : 
                     location === 'query' ? query(field) : body(field);
    return validator
      .isMongoId()
      .withMessage(`${field} must be a valid MongoDB ObjectId`);
  },

  // Required string fields
  requiredString: (field, minLength = 1) => body(field)
    .isString()
    .withMessage(`${field} must be a string`)
    .isLength({ min: minLength })
    .withMessage(`${field} must be at least ${minLength} character(s) long`)
    .trim(),

  // Optional string fields
  optionalString: (field, maxLength = null) => {
    let validator = body(field)
      .optional()
      .isString()
      .withMessage(`${field} must be a string`)
      .trim();
    
    if (maxLength) {
      validator = validator.isLength({ max: maxLength })
        .withMessage(`${field} must not exceed ${maxLength} characters`);
    }
    
    return validator;
  },

  // Phone number validation
  phone: body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  // Date validation
  date: (field, required = true) => {
    let validator = required ? body(field) : body(field).optional();
    return validator
      .isISO8601()
      .withMessage(`${field} must be a valid date`)
      .toDate();
  },

  // Boolean validation
  boolean: (field, required = false) => {
    let validator = required ? body(field) : body(field).optional();
    return validator
      .isBoolean()
      .withMessage(`${field} must be a boolean`);
  },

  // Number validation
  number: (field, required = false, min = null, max = null) => {
    let validator = required ? body(field) : body(field).optional();
    validator = validator
      .isNumeric()
      .withMessage(`${field} must be a number`);
    
    if (min !== null) {
      validator = validator.isFloat({ min }).withMessage(`${field} must be at least ${min}`);
    }
    if (max !== null) {
      validator = validator.isFloat({ max }).withMessage(`${field} must not exceed ${max}`);
    }
    
    return validator;
  },

  // Array validation
  array: (field, required = false) => {
    let validator = required ? body(field) : body(field).optional();
    return validator
      .isArray()
      .withMessage(`${field} must be an array`);
  }
};

// ============================================================================= 
// AUTHENTICATION VALIDATIONS
// ============================================================================= 

const authValidations = {
  // Basic login validation
  login: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.rememberMe
  ],

  // Hospital admin login validation
  hospitalAdminLogin: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.rememberMe
  ],

  // Super admin login validation
  superAdminLogin: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.rememberMe
  ],

  // Change password validation
  changePassword: [
    commonValidations.oldPassword,
    commonValidations.newPassword,
    commonValidations.confirmPassword
  ],

  // Reset password validation
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    commonValidations.newPassword,
    commonValidations.confirmPassword
  ],

  // Forgot password validation
  forgotPassword: [
    commonValidations.email
  ]
};

// ============================================================================= 
// HOSPITAL MANAGEMENT VALIDATIONS
// ============================================================================= 

const hospitalValidations = {
  // Create hospital validation
  createHospital: [
    commonValidations.requiredString('name', 2),
    commonValidations.optionalString('hospitalCode'),
    commonValidations.optionalString('hospitalType'),
    commonValidations.optionalString('address'),
    commonValidations.phone,
    commonValidations.boolean('emergencyServices'),
    commonValidations.boolean('teachingHospital'),
    commonValidations.boolean('researchFacility'),
    commonValidations.boolean('telemedicineEnabled'),
    body('facilities')
      .optional()
      .isObject()
      .withMessage('Facilities must be an object'),
    body('capacityDetails')
      .optional()
      .isObject()
      .withMessage('Capacity details must be an object')
  ],

  // Update hospital validation
  updateHospital: [
    commonValidations.mongoId('id'),
    commonValidations.optionalString('name', 2),
    commonValidations.optionalString('hospitalCode'),
    commonValidations.optionalString('hospitalType'),
    commonValidations.optionalString('address'),
    commonValidations.boolean('emergencyServices'),
    commonValidations.boolean('isActive')
  ]
};

// ============================================================================= 
// STAFF MANAGEMENT VALIDATIONS
// ============================================================================= 

const staffValidations = {
  // Create staff validation
  createStaff: [
    body('personalDetails')
      .isObject()
      .withMessage('Personal details are required'),
    body('personalDetails.firstName')
      .isString()
      .isLength({ min: 2 })
      .withMessage('First name must be at least 2 characters long'),
    body('personalDetails.lastName')
      .isString()
      .isLength({ min: 2 })
      .withMessage('Last name must be at least 2 characters long'),
    body('personalDetails.email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    commonValidations.mongoId('roleId', 'body'),
    commonValidations.mongoId('departmentId', 'body'),
    body('employmentType')
      .isIn(['permanent', 'contract', 'consultant', 'temporary'])
      .withMessage('Invalid employment type'),
    commonValidations.date('joiningDate')
  ],

  // Update staff validation
  updateStaff: [
    commonValidations.mongoId('id'),
    body('personalDetails')
      .optional()
      .isObject()
      .withMessage('Personal details must be an object'),
    commonValidations.mongoId('roleId', 'body'),
    commonValidations.mongoId('departmentId', 'body'),
    body('employmentStatus')
      .optional()
      .isIn(['active', 'inactive', 'terminated', 'suspended'])
      .withMessage('Invalid employment status')
  ]
};

// ============================================================================= 
// PATIENT MANAGEMENT VALIDATIONS
// ============================================================================= 

const patientValidations = {
  // Create patient validation
  createPatient: [
    body('personalDetails')
      .isObject()
      .withMessage('Personal details are required'),
    body('personalDetails.firstName')
      .isString()
      .isLength({ min: 2 })
      .withMessage('First name must be at least 2 characters long'),
    body('personalDetails.lastName')
      .isString()
      .isLength({ min: 2 })
      .withMessage('Last name must be at least 2 characters long'),
    body('personalDetails.dateOfBirth')
      .isISO8601()
      .withMessage('Valid date of birth is required')
      .toDate(),
    body('personalDetails.gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Invalid gender'),
    body('contactDetails')
      .optional()
      .isObject()
      .withMessage('Contact details must be an object'),
    body('bloodGroup')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood group'),
    body('patientType')
      .optional()
      .isIn(['regular', 'vip', 'staff', 'emergency', 'charity'])
      .withMessage('Invalid patient type')
  ],

  // Update patient validation
  updatePatient: [
    commonValidations.mongoId('id'),
    body('personalDetails')
      .optional()
      .isObject()
      .withMessage('Personal details must be an object'),
    body('contactDetails')
      .optional()
      .isObject()
      .withMessage('Contact details must be an object'),
    body('patientStatus')
      .optional()
      .isIn(['active', 'inactive', 'deceased'])
      .withMessage('Invalid patient status')
  ]
};

// ============================================================================= 
// DEPARTMENT MANAGEMENT VALIDATIONS
// ============================================================================= 

const departmentValidations = {
  // Create department validation
  createDepartment: [
    commonValidations.requiredString('name', 2),
    commonValidations.optionalString('code'),
    commonValidations.optionalString('departmentType'),
    commonValidations.mongoId('categoryId', 'body'),
    commonValidations.mongoId('floorId', 'body'),
    commonValidations.mongoId('parentDepartmentId', 'body'),
    commonValidations.boolean('emergencyAvailability'),
    commonValidations.boolean('telemedicineEnabled'),
    body('servicesOffered')
      .optional()
      .isArray()
      .withMessage('Services offered must be an array'),
    body('operationalHours')
      .optional()
      .isObject()
      .withMessage('Operational hours must be an object')
  ],

  // Update department validation
  updateDepartment: [
    commonValidations.mongoId('id'),
    commonValidations.optionalString('name', 2),
    commonValidations.optionalString('code'),
    commonValidations.optionalString('departmentType'),
    commonValidations.boolean('isActive')
  ]
};

// ============================================================================= 
// CLINICAL VALIDATIONS
// ============================================================================= 

const clinicalValidations = {
  // Create examination validation
  createExamination: [
    commonValidations.mongoId('visitId', 'body'),
    commonValidations.mongoId('templateId', 'body'),
    commonValidations.mongoId('doctorId', 'body'),
    commonValidations.optionalString('examinationType'),
    body('findings')
      .optional()
      .isObject()
      .withMessage('Findings must be an object'),
    body('vitalSigns')
      .optional()
      .isObject()
      .withMessage('Vital signs must be an object'),
    commonValidations.optionalString('clinicalImpressions'),
    body('preliminaryDiagnosis')
      .optional()
      .isArray()
      .withMessage('Preliminary diagnosis must be an array')
  ],

  // Create diagnosis validation
  createDiagnosis: [
    commonValidations.mongoId('visitId', 'body'),
    commonValidations.mongoId('examinationId', 'body'),
    commonValidations.mongoId('diseaseId', 'body'),
    commonValidations.mongoId('doctorId', 'body'),
    body('diagnosisType')
      .isIn(['primary', 'secondary', 'complication', 'comorbidity'])
      .withMessage('Invalid diagnosis type'),
    body('severity')
      .optional()
      .isString()
      .withMessage('Severity must be a string'),
    commonValidations.number('confidenceLevel', false, 0, 1),
    commonValidations.boolean('isPrimary')
  ]
};

// ============================================================================= 
// MIDDLEWARE FUNCTIONS
// ============================================================================= 

// Handle validation errors middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Custom validation for password confirmation
const validatePasswordConfirmation = (req, res, next) => {
  const { newPassword, confirmPassword } = req.body;
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{
        field: 'confirmPassword',
        message: 'Passwords do not match',
        value: confirmPassword
      }]
    });
  }
  
  next();
};

// Custom validation for unique fields (async)
const validateUniqueField = (model, field, excludeId = null) => {
  return async (req, res, next) => {
    try {
      const value = req.body[field];
      if (!value) return next();

      const { prisma } = require('../config/database');
      
      const whereClause = { [field]: value };
      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const existingRecord = await prisma[model].findFirst({
        where: whereClause
      });

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{
            field: field,
            message: `${field} already exists`,
            value: value
          }]
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
  };
};

// Export all validations and utilities
module.exports = {
  // Common validations
  commonValidations,
  
  // Specific validation groups
  authValidations,
  hospitalValidations,
  staffValidations,
  patientValidations,
  departmentValidations,
  clinicalValidations,
  
  // Middleware functions
  handleValidationErrors,
  validatePasswordConfirmation,
  validateUniqueField,
  
  // Express-validator functions for custom use
  body,
  param,
  query,
  validationResult
};