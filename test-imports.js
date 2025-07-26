// Test middleware imports
console.log('Testing middleware imports...');

try {
  const { authenticateJWT, optionalAuth } = require('./middleware/auth.middleware');
  console.log('Auth middleware:', {
    authenticateJWT: typeof authenticateJWT,
    optionalAuth: typeof optionalAuth
  });
} catch (error) {
  console.error('Auth middleware error:', error.message);
}

try {
  const { 
    patientRegistrationUpload, 
    handleUploadError 
  } = require('./middleware/upload.middleware');
  console.log('Upload middleware:', {
    patientRegistrationUpload: typeof patientRegistrationUpload,
    handleUploadError: typeof handleUploadError
  });
} catch (error) {
  console.error('Upload middleware error:', error.message);
}

try {
  const {
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
  } = require('./middleware/validation.middleware');
  
  console.log('Validation middleware:', {
    validatePatientRegistration: typeof validatePatientRegistration,
    validatePartialRegistration: typeof validatePartialRegistration,
    validateCompleteRegistration: typeof validateCompleteRegistration,
    validatePatientUpdate: typeof validatePatientUpdate,
    validatePatientId: typeof validatePatientId,
    validateSearchParams: typeof validateSearchParams,
    validateListPatients: typeof validateListPatients,
    validateSendOTP: typeof validateSendOTP,
    validateVerifyOTP: typeof validateVerifyOTP,
    validateABHAId: typeof validateABHAId,
    validateStatusUpdate: typeof validateStatusUpdate,
    validateStatsQuery: typeof validateStatsQuery,
    validateFileUploads: typeof validateFileUploads,
    checkValidationResult: typeof checkValidationResult
  });
} catch (error) {
  console.error('Validation middleware error:', error.message);
}

try {
  const patientController = require('./controllers/patient.controller');
  console.log('Patient controller loaded successfully');
  console.log('Controller methods:', Object.getOwnPropertyNames(patientController).filter(name => typeof patientController[name] === 'function'));
} catch (error) {
  console.error('Patient controller error:', error.message);
}

console.log('Test completed');
