// middleware/validation.middleware.js

const { 
    staffValidations,
    handleValidationErrors,
    validatePasswordConfirmation,
    body 
} = require('../utils/validation.utils');

// Enhanced staff creation validation using your existing utils
const validateCreateStaff = [
    // Use existing staff validations from utils
    ...staffValidations.createStaff,
    
    // Additional custom validations
    body('roleCode')
        .isIn(['DOCTOR', 'NURSE', 'HOSPITAL_ADMIN', 'DEPARTMENT_HEAD', 'RECEPTIONIST', 'LAB_TECHNICIAN', 'PHARMACIST'])
        .withMessage('Invalid role code'),
    
    body('generatePassword')
        .optional()
        .isBoolean()
        .withMessage('Generate password must be a boolean'),
    
    // Doctor-specific validations
    body('doctorDetails.medicalRegistrationNumber')
        .if(body('roleCode').equals('DOCTOR'))
        .notEmpty()
        .withMessage('Medical registration number is required for doctors'),
    
    body('doctorDetails.specialization')
        .if(body('roleCode').equals('DOCTOR'))
        .notEmpty()
        .withMessage('Specialization is required for doctors'),
    
    // Nurse-specific validations
    body('nurseDetails.nursingRegistrationNumber')
        .if(body('roleCode').equals('NURSE'))
        .notEmpty()
        .withMessage('Nursing registration number is required for nurses'),
    
    body('nurseDetails.certificationLevel')
        .if(body('roleCode').equals('NURSE'))
        .notEmpty()
        .withMessage('Certification level is required for nurses'),
    
    handleValidationErrors
];

// Enhanced staff update validation
const validateUpdateStaff = [
    // Use existing staff update validations
    ...staffValidations.updateStaff,
    
    handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
    body('newPassword')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    
    body('generatePassword')
        .optional()
        .isBoolean()
        .withMessage('Generate password must be a boolean'),
    
    handleValidationErrors
];

module.exports = {
    validateCreateStaff,
    validateUpdateStaff,
    validatePasswordReset
};