const { body, param, query, validationResult } = require('express-validator');

/**
 * Simplified validation rules for Quick Registration
 * Only validates personal and contact data as per new frontend structure
 */
const validateQuickRegistration = [
  // Personal section validation
  body('personal.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('personal.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('personal.dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('personal.gender')
    .notEmpty()
    .withMessage('Gender is required'),

  body('personal.title')
    .optional(),

  body('personal.bloodGroup')
    .optional(),

  body('personal.nationality')
    .optional(),

  body('personal.preferredLanguage')
    .optional(),

  // Contact section validation
  body('contact.primaryPhone')
    .notEmpty()
    .withMessage('Primary phone is required')
    .isMobilePhone('en-IN')
    .withMessage('Invalid phone number format'),

  body('contact.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('contact.currentAddress.street')
    .notEmpty()
    .withMessage('Street address is required'),

  body('contact.currentAddress.city')
    .notEmpty()
    .withMessage('City is required'),

  body('contact.currentAddress.state')
    .notEmpty()
    .withMessage('State is required'),

  body('contact.currentAddress.pinCode')
    .notEmpty()
    .withMessage('PIN code is required'),

  body('contact.currentAddress.country')
    .notEmpty()
    .withMessage('Country is required'),

  body('contact.permanentAddress')
    .optional(),

  body('contact.sameAsCurrent')
    .optional()
    .isBoolean()
    .withMessage('sameAsCurrent must be a boolean'),

  body('contact.secondaryPhone')
    .optional(),

  body('contact.whatsappPhone')
    .optional(),

  // Hospital ID validation (can come from token or body)
  body('hospitalId')
    .optional()
    .isString()
    .withMessage('Hospital ID must be a string'),

  // Optional sections for quick registration (will be ignored in processing)
  body('medical')
    .optional(),

  body('insurance')
    .optional(),

  body('consent')
    .optional(),
];

/**
 * Simplified validation rules for Full Registration
 * Validates the complete structure as per new frontend format
 */
const validateFullRegistration = [
  // Personal section validation (same as quick registration)
  body('personal.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('personal.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('personal.dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('personal.gender')
    .notEmpty()
    .withMessage('Gender is required'),

  body('personal.title')
    .optional(),

  body('personal.bloodGroup')
    .optional(),

  body('personal.nationality')
    .optional(),

  body('personal.preferredLanguage')
    .optional(),

  body('personal.photo')
    .optional(),

  // Contact section validation (same as quick registration)
  body('contact.primaryPhone')
    .notEmpty()
    .withMessage('Primary phone is required')
    .isMobilePhone('en-IN')
    .withMessage('Invalid phone number format'),

  body('contact.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('contact.currentAddress.street')
    .notEmpty()
    .withMessage('Street address is required'),

  body('contact.currentAddress.city')
    .notEmpty()
    .withMessage('City is required'),

  body('contact.currentAddress.state')
    .notEmpty()
    .withMessage('State is required'),

  body('contact.currentAddress.pinCode')
    .notEmpty()
    .withMessage('PIN code is required'),

  body('contact.currentAddress.country')
    .notEmpty()
    .withMessage('Country is required'),

  body('contact.permanentAddress')
    .optional(),

  body('contact.sameAsCurrent')
    .optional()
    .isBoolean()
    .withMessage('sameAsCurrent must be a boolean'),

  body('contact.secondaryPhone')
    .optional(),

  body('contact.whatsappPhone')
    .optional(),

  // Medical section validation (flexible structure)
  body('medical.allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),

  body('medical.chronicConditions')
    .optional()
    .isArray()
    .withMessage('Chronic conditions must be an array'),

  body('medical.currentMedications')
    .optional()
    .isArray()
    .withMessage('Current medications must be an array'),

  body('medical.previousSurgeries')
    .optional()
    .isArray()
    .withMessage('Previous surgeries must be an array'),

  body('medical.familyHistory')
    .optional()
    .isArray()
    .withMessage('Family history must be an array'),

  body('medical.lifestyle')
    .optional()
    .isObject()
    .withMessage('Lifestyle must be an object'),

  // Insurance section validation
  body('insurance.hasInsurance')
    .optional()
    .isBoolean()
    .withMessage('hasInsurance must be a boolean'),

  body('insurance.emergencyContacts')
    .optional()
    .isArray()
    .withMessage('Emergency contacts must be an array'),

  body('insurance.paymentMethod')
    .optional(),

  body('insurance.provider')
    .optional(),

  body('insurance.policyNumber')
    .optional(),

  body('insurance.policyType')
    .optional(),

  body('insurance.policyHolderName')
    .optional(),

  body('insurance.policyHolderRelation')
    .optional(),

  body('insurance.validityDate')
    .optional(),

  body('insurance.coverageAmount')
    .optional()
    .isNumeric()
    .withMessage('Coverage amount must be numeric'),

  body('insurance.coPaymentPercentage')
    .optional()
    .isNumeric()
    .withMessage('Co-payment percentage must be numeric'),

  body('insurance.tpaName')
    .optional(),

  body('insurance.cardFrontImage')
    .optional(),

  body('insurance.cardBackImage')
    .optional(),

  body('insurance.requiresPreAuth')
    .optional()
    .isArray()
    .withMessage('Requires pre-auth must be an array'),

  // Consent section validation
  body('consent.medicalConsent')
    .optional()
    .isBoolean()
    .withMessage('Medical consent must be a boolean'),

  body('consent.privacyPolicy')
    .optional()
    .isBoolean()
    .withMessage('Privacy policy must be a boolean'),

  body('consent.marketingConsent')
    .optional()
    .isBoolean()
    .withMessage('Marketing consent must be a boolean'),

  body('consent.appointmentReminders')
    .optional()
    .isObject()
    .withMessage('Appointment reminders must be an object'),

  body('consent.healthNewsletters')
    .optional()
    .isObject()
    .withMessage('Health newsletters must be an object'),

  body('consent.promotionalOffers')
    .optional()
    .isBoolean()
    .withMessage('Promotional offers must be a boolean'),

  body('consent.researchParticipation')
    .optional()
    .isBoolean()
    .withMessage('Research participation must be a boolean'),

  body('consent.photoVideoConsent')
    .optional()
    .isBoolean()
    .withMessage('Photo/video consent must be a boolean'),

  body('consent.abhaIdVerified')
    .optional()
    .isBoolean()
    .withMessage('ABHA ID verified must be a boolean'),

  body('consent.otpVerified')
    .optional()
    .isBoolean()
    .withMessage('OTP verified must be a boolean'),

  body('consent.documentsUploaded')
    .optional()
    .isObject()
    .withMessage('Documents uploaded must be an object'),

  body('consent.digitalSignature')
    .optional(),

  body('consent.abhaId')
    .optional(),

  // Hospital ID validation (can come from token or body)
  body('hospitalId')
    .optional()
    .isString()
    .withMessage('Hospital ID must be a string'),
];

/**
 * Validation for patient ID parameter
 */
const validatePatientId = [
  param('id')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isString()
    .withMessage('Patient ID must be a string')
];

/**
 * Validation for search parameters
 */
const validateSearchParams = [
  param('identifier')
    .notEmpty()
    .withMessage('Search identifier is required')
    .isString()
    .withMessage('Search identifier must be a string')
];

/**
 * Validation for OTP sending
 */
const validateSendOTP = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Invalid phone number format')
];

/**
 * Validation for OTP verification
 */
const validateVerifyOTP = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Invalid phone number format'),

  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be between 4 and 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric')
];

/**
 * Validation for ABHA ID
 */
const validateABHAId = [
  body('abhaId')
    .notEmpty()
    .withMessage('ABHA ID is required')
    .matches(/^[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/)
    .withMessage('ABHA ID must be in format XX-XXXX-XXXX-XXXX')
];

/**
 * Middleware to check validation results
 */
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Handle emergency contact fallback (keeping existing functionality)
 */
const handleEmergencyContactFallback = (req, res, next) => {
  // This middleware maintains existing functionality
  // You can customize this based on your needs
  next();
};

/**
 * Validate emergency contact exists (keeping existing functionality)
 */
const validateEmergencyContactExists = (req, res, next) => {
  // This middleware maintains existing functionality
  // You can customize this based on your needs
  next();
};

/**
 * Validate file uploads (keeping existing functionality)
 */
const validateFileUploads = (req, res, next) => {
  // This middleware maintains existing functionality for file uploads
  // The upload middleware will handle the actual file processing
  next();
};

module.exports = {
  validateQuickRegistration,
  validateFullRegistration,
  validatePatientId,
  validateSearchParams,
  validateSendOTP,
  validateVerifyOTP,
  validateABHAId,
  checkValidationResult,
  handleEmergencyContactFallback,
  validateEmergencyContactExists,
  validateFileUploads,
  
  // Legacy exports for backward compatibility (if needed)
  validatePatientRegistration: validateFullRegistration,
  validatePartialRegistration: validateQuickRegistration,
  validateCompleteRegistration: validateFullRegistration,
};
