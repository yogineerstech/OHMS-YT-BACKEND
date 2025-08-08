const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for patient registration (simplified for new frontend structure)
 */

// Personal details validation
const validatePersonalDetails = [
  body('personal.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('personal.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('personal.dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  
  body('personal.gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
];

// Contact details validation
const validateContactDetails = [
  body('contact.primaryPhone')
    .notEmpty()
    .withMessage('Primary phone is required')
    .isMobilePhone('en-IN')
    .withMessage('Primary phone must be a valid Indian mobile number'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address'),
  
  body('contact.currentAddress.street')
    .notEmpty()
    .withMessage('Current address street is required'),
  
  body('contact.currentAddress.city')
    .notEmpty()
    .withMessage('Current address city is required'),
  
  body('contact.currentAddress.state')
    .notEmpty()
    .withMessage('Current address state is required'),
  
  body('contact.currentAddress.pinCode')
    .notEmpty()
    .withMessage('Current address pin code is required')
    .isPostalCode('IN')
    .withMessage('Pin code must be a valid Indian postal code'),
];

// Consent validation
const validateConsent = [
  body('consent.treatmentConsent')
    .equals('true')
    .withMessage('Treatment consent is required'),
  
  body('consent.dataProcessingConsent')
    .equals('true')
    .withMessage('Data processing consent is required'),
  
  body('consent.communicationConsent')
    .equals('true')
    .withMessage('Communication consent is required'),
];

// Hospital ID validation
const validateHospitalId = [
  body('hospitalId')
    .notEmpty()
    .withMessage('Hospital ID is required'),
];

// Patient registration validation (full)
const validatePatientRegistration = [
  ...validatePersonalDetails,
  ...validateContactDetails,
  ...validateConsent,
  ...validateHospitalId,
  body('contact.email')
    .notEmpty()
    .withMessage('Email is required for full registration')
    .isEmail()
    .withMessage('Email must be a valid email address'),
];

// Quick registration validation (minimal)
const validatePartialRegistration = [
  ...validatePersonalDetails,
  ...validateContactDetails,
  ...validateConsent,
  ...validateHospitalId,
];

// Complete registration validation
const validateCompleteRegistration = [
  // Optional medical fields
  body('medical').optional(),
  body('insurance').optional(),
  // Additional consent fields
  body('consent.medicalConsent').optional().isBoolean(),
  body('consent.privacyPolicy').optional().isBoolean(),
];

// Patient update validation
const validatePatientUpdate = [
  // Allow partial updates
  body('personal').optional(),
  body('contact').optional(),
  body('medical').optional(),
  body('insurance').optional(),
  body('consent').optional(),
];

// Patient ID validation
const validatePatientId = [
  param('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ObjectId'),
];

// Search parameters validation
const validateSearchParams = [
  param('identifier')
    .notEmpty()
    .withMessage('Search identifier is required'),
];

// List patients validation
const validateListPatients = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Invalid status'),
  query('registrationMethod').optional().isIn(['full', 'quick']).withMessage('Invalid registration method'),
];

// OTP validation
const validateSendOTP = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Phone must be a valid Indian mobile number'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
];

const validateVerifyOTP = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Phone must be a valid Indian mobile number'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be 4-6 digits'),
];

// ABHA validation
const validateABHAId = [
  body('abhaId')
    .notEmpty()
    .withMessage('ABHA ID is required')
    .matches(/^\d{2}-\d{4}-\d{4}-\d{4}$/)
    .withMessage('ABHA ID must be in format XX-XXXX-XXXX-XXXX'),
];

// Status update validation
const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'archived'])
    .withMessage('Status must be active, inactive, or archived'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
];

// Stats query validation
const validateStatsQuery = [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Group by must be day, week, or month'),
];

// File upload validation
const validateFileUploads = (req, res, next) => {
  // This will be handled by multer middleware
  // We can add custom file validation here if needed
  next();
};

// Staff validation functions
const validateCreateStaff = [
  body('personalDetails').notEmpty().withMessage('Personal details are required'),
  body('personalDetails.firstName').notEmpty().withMessage('First name is required'),
  body('personalDetails.lastName').notEmpty().withMessage('Last name is required'),
  body('personalDetails.email').isEmail().withMessage('Valid email is required'),
  body('roleId').notEmpty().withMessage('Role ID is required'),
  body('departmentId').notEmpty().withMessage('Department ID is required'),
  body('employmentType').isIn(['permanent', 'contract', 'consultant', 'temporary']).withMessage('Invalid employment type'),
];

const validateUpdateStaff = [
  param('staffId').notEmpty().withMessage('Staff ID is required'),
  body('personalDetails').optional(),
  body('roleId').optional(),
  body('departmentId').optional(),
  body('employmentStatus').optional().isIn(['active', 'inactive', 'terminated', 'suspended']).withMessage('Invalid employment status'),
];

const validatePasswordReset = [
  param('staffId').notEmpty().withMessage('Staff ID is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

// Check validation results
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param || error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Emergency contact fallback middleware
const handleEmergencyContactFallback = (req, res, next) => {
  try {
    // Ensure emergency contact exists in contact object
    if (req.body.contact && !req.body.contact.emergencyContact) {
      req.body.contact.emergencyContact = {
        name: 'Not Provided',
        phone: req.body.contact.primaryPhone,
        relationship: 'self'
      };
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Validate emergency contact exists
const validateEmergencyContactExists = (req, res, next) => {
  if (!req.body.contact?.emergencyContact?.name || !req.body.contact?.emergencyContact?.phone) {
    return res.status(400).json({
      success: false,
      message: 'Emergency contact name and phone are required'
    });
  }
  next();
};

module.exports = {
  validatePatientRegistration,
  validatePartialRegistration,
  validateCompleteRegistration,
  validatePatientUpdate,
  validatePatientId,
  validateSearchParams,
  validateListPatients,
  validateSendOTP,
  validateVerifyOTP,
  validateABHAId,
  validateStatusUpdate,
  validateStatsQuery,
  validateFileUploads,
  checkValidationResult,
  handleEmergencyContactFallback,
  validateEmergencyContactExists,
  // Staff validation functions
  validateCreateStaff,
  validateUpdateStaff,
  validatePasswordReset
};
