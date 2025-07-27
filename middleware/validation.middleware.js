const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for full patient registration
 */
const validatePatientRegistration = [
  // Personal Details Validation
  body('personal.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('personal.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('personal.dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const maxAge = new Date();
      maxAge.setFullYear(today.getFullYear() - 150);

      if (dob > today) {
        throw new Error('Date of birth cannot be in the future');
      }
      if (dob < maxAge) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),

  body('personal.gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),

  body('personal.bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),

  body('personal.maritalStatus')
    .optional()
    .isIn(['single', 'married', 'divorced', 'widowed', 'separated', 'domestic_partnership'])
    .withMessage('Invalid marital status'),

  body('personal.occupation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Occupation cannot exceed 100 characters'),

  body('personal.religion')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Religion cannot exceed 50 characters'),

  body('personal.nationality')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Nationality cannot exceed 50 characters'),

  body('personal.language')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Language cannot exceed 50 characters'),

  body('personal.abhaId')
    .optional()
    .matches(/^\d{2}-\d{4}-\d{4}-\d{4}$/)
    .withMessage('ABHA ID must be in format XX-XXXX-XXXX-XXXX'),

  // Contact Details Validation
  body('contact.phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),

  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('contact.address.street')
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),

  body('contact.address.city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),

  body('contact.address.state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State can only contain letters and spaces'),

  body('contact.address.pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be a 6-digit number'),

  body('contact.address.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('contact.emergencyContact.name')
    .notEmpty()
    .withMessage('Emergency contact name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),

  body('contact.emergencyContact.phone')
    .notEmpty()
    .withMessage('Emergency contact phone is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Emergency contact phone must be a valid 10-digit Indian mobile number'),

  body('contact.emergencyContact.relationship')
    .notEmpty()
    .withMessage('Emergency contact relationship is required')
    .isIn(['spouse', 'parent', 'child', 'sibling', 'friend', 'other'])
    .withMessage('Invalid relationship type'),

  // Medical History Validation (optional sections)
  body('medical.allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),

  body('medical.allergies.*.allergen')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Allergen name must be between 1 and 100 characters'),

  body('medical.allergies.*.severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Allergy severity must be mild, moderate, or severe'),

  body('medical.chronicConditions')
    .optional()
    .isArray()
    .withMessage('Chronic conditions must be an array'),

  body('medical.medicationHistory')
    .optional()
    .isArray()
    .withMessage('Medication history must be an array'),

  body('medical.surgicalHistory')
    .optional()
    .isArray()
    .withMessage('Surgical history must be an array'),

  // Insurance Details Validation (optional)
  body('insurance.hasPrimaryInsurance')
    .optional()
    .isBoolean()
    .withMessage('Primary insurance status must be boolean'),

  body('insurance.primaryInsurance.provider')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Insurance provider must be between 2 and 100 characters'),

  body('insurance.primaryInsurance.policyNumber')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('Policy number must be between 5 and 50 characters'),

  body('insurance.primaryInsurance.groupNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Group number cannot exceed 50 characters'),

  // Consent Validation
  body('consent.treatmentConsent')
    .notEmpty()
    .withMessage('Treatment consent is required')
    .isBoolean()
    .withMessage('Treatment consent must be boolean'),

  body('consent.privacyConsent')
    .notEmpty()
    .withMessage('Privacy consent is required')
    .isBoolean()
    .withMessage('Privacy consent must be boolean'),

  body('consent.dataProcessingConsent')
    .notEmpty()
    .withMessage('Data processing consent is required')
    .isBoolean()
    .withMessage('Data processing consent must be boolean'),

  // Hospital ID validation
  body('hospitalId')
    .optional()
    .isMongoId()
    .withMessage('Invalid hospital ID format')
];

/**
 * Validation rules for partial/quick patient registration
 */
const validatePartialRegistration = [
  // Personal Details Validation (minimal required)
  body('personal.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('personal.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('personal.dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const maxAge = new Date();
      maxAge.setFullYear(today.getFullYear() - 150);

      if (dob > today) {
        throw new Error('Date of birth cannot be in the future');
      }
      if (dob < maxAge) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),

  body('personal.gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),

  // Contact Details Validation (minimal required)
  body('contact.phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),

  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  // Hospital ID validation
  body('hospitalId')
    .optional()
    .isMongoId()
    .withMessage('Invalid hospital ID format')
];

/**
 * Validation rules for completing partial registration
 */
const validateCompleteRegistration = [
  // Medical History Validation
  body('medical.allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),

  body('medical.allergies.*.allergen')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Allergen name must be between 1 and 100 characters'),

  body('medical.allergies.*.severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Allergy severity must be mild, moderate, or severe'),

  body('medical.chronicConditions')
    .optional()
    .isArray()
    .withMessage('Chronic conditions must be an array'),

  body('medical.medicationHistory')
    .optional()
    .isArray()
    .withMessage('Medication history must be an array'),

  body('medical.surgicalHistory')
    .optional()
    .isArray()
    .withMessage('Surgical history must be an array'),

  // Insurance Details Validation
  body('insurance.hasPrimaryInsurance')
    .optional()
    .isBoolean()
    .withMessage('Primary insurance status must be boolean'),

  body('insurance.primaryInsurance.provider')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Insurance provider must be between 2 and 100 characters'),

  body('insurance.primaryInsurance.policyNumber')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('Policy number must be between 5 and 50 characters'),

  // Consent Validation
  body('consent.treatmentConsent')
    .notEmpty()
    .withMessage('Treatment consent is required')
    .isBoolean()
    .withMessage('Treatment consent must be boolean'),

  body('consent.privacyConsent')
    .notEmpty()
    .withMessage('Privacy consent is required')
    .isBoolean()
    .withMessage('Privacy consent must be boolean'),

  body('consent.dataProcessingConsent')
    .notEmpty()
    .withMessage('Data processing consent is required')
    .isBoolean()
    .withMessage('Data processing consent must be boolean')
];

/**
 * Validation rules for patient updates
 */
const validatePatientUpdate = [
  // Personal Details Validation (all optional for updates)
  body('personal.firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('personal.lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('personal.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (!value) return true;
      
      const dob = new Date(value);
      const today = new Date();
      const maxAge = new Date();
      maxAge.setFullYear(today.getFullYear() - 150);

      if (dob > today) {
        throw new Error('Date of birth cannot be in the future');
      }
      if (dob < maxAge) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),

  body('personal.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),

  body('personal.bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),

  body('personal.abhaId')
    .optional()
    .matches(/^\d{2}-\d{4}-\d{4}-\d{4}$/)
    .withMessage('ABHA ID must be in format XX-XXXX-XXXX-XXXX'),

  // Contact Details Validation
  body('contact.phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),

  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('contact.address.pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be a 6-digit number'),

  body('contact.emergencyContact.phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Emergency contact phone must be a valid 10-digit Indian mobile number'),

  body('contact.emergencyContact.relationship')
    .optional()
    .isIn(['spouse', 'parent', 'child', 'sibling', 'friend', 'other'])
    .withMessage('Invalid relationship type')
];

/**
 * Validation rules for patient ID parameter
 */
const validatePatientId = [
  param('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID format')
];

/**
 * Validation rules for patient search
 */
const validateSearchParams = [
  param('identifier')
    .notEmpty()
    .withMessage('Search identifier is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Search identifier must be between 1 and 50 characters')
];

/**
 * Validation rules for patient listing with pagination
 */
const validateListPatients = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'archived', 'partial_registration'])
    .withMessage('Invalid status value'),

  query('registrationMethod')
    .optional()
    .isIn(['full', 'partial'])
    .withMessage('Invalid registration method'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'patientNumber'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

/**
 * Validation rules for OTP sending
 */
const validateSendOTP = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

/**
 * Validation rules for OTP verification
 */
const validateVerifyOTP = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),

  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be a 6-digit number')
];

/**
 * Validation rules for ABHA ID verification
 */
const validateABHAId = [
  body('abhaId')
    .notEmpty()
    .withMessage('ABHA ID is required')
    .matches(/^\d{2}-\d{4}-\d{4}-\d{4}$/)
    .withMessage('ABHA ID must be in format XX-XXXX-XXXX-XXXX')
];

/**
 * Validation rules for status update
 */
const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'archived', 'partial_registration'])
    .withMessage('Invalid status value'),

  body('reason')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Reason must be between 1 and 200 characters')
];

/**
 * Validation rules for registration statistics
 */
const validateStatsQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Group by must be day, week, month, or year')
];

/**
 * Middleware to check validation results
 */
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Custom validation for file uploads
 */
const validateFileUploads = (req, res, next) => {
  const errors = [];

  // Check if files exist when required
  if (req.files) {
    const files = req.files;
    
    // Validate profile photo
    if (files.profilePhoto) {
      const profilePhoto = files.profilePhoto[0];
      if (!profilePhoto.mimetype.startsWith('image/')) {
        errors.push({
          field: 'profilePhoto',
          message: 'Profile photo must be an image file'
        });
      }
      if (profilePhoto.size > 5 * 1024 * 1024) { // 5MB
        errors.push({
          field: 'profilePhoto',
          message: 'Profile photo must be less than 5MB'
        });
      }
    }

    // Validate government ID documents
    if (files.governmentId) {
      files.governmentId.forEach((file, index) => {
        if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
          errors.push({
            field: `governmentId[${index}]`,
            message: 'Government ID must be an image or PDF file'
          });
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
          errors.push({
            field: `governmentId[${index}]`,
            message: 'Government ID file must be less than 10MB'
          });
        }
      });
    }

    // Validate insurance cards
    if (files.insuranceCard) {
      files.insuranceCard.forEach((file, index) => {
        if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
          errors.push({
            field: `insuranceCard[${index}]`,
            message: 'Insurance card must be an image or PDF file'
          });
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
          errors.push({
            field: `insuranceCard[${index}]`,
            message: 'Insurance card file must be less than 10MB'
          });
        }
      });
    }

    // Validate medical records
    if (files.medicalRecords) {
      files.medicalRecords.forEach((file, index) => {
        if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
          errors.push({
            field: `medicalRecords[${index}]`,
            message: 'Medical record must be an image or PDF file'
          });
        }
        if (file.size > 20 * 1024 * 1024) { // 20MB
          errors.push({
            field: `medicalRecords[${index}]`,
            message: 'Medical record file must be less than 20MB'
          });
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'File validation failed',
      errors
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
  checkValidationResult
};
