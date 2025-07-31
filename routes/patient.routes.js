const express = require('express');
const router = express.Router();

// Import middlewares
const { authenticateJWT, optionalAuth } = require('../middleware/auth.middleware');
const {
  patientRegistrationUpload,
  handleUploadError,
  parseFormDataJSON
} = require('../middleware/upload.middleware');
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
  checkValidationResult,
  handleEmergencyContactFallback,
  validateEmergencyContactExists
} = require('../middleware/validation.middleware');

// Import controller
const patientController = require('../controllers/patient.controller');

// ==============================================================================
// SPECIFIC ROUTES (NO PARAMETERS) - THESE MUST COME FIRST
// ==============================================================================

/**
 * @route   POST /api/patients/register
 * @desc    Register a new patient (full registration)
 * @access  Public
 * @body    RegistrationData + Files
 */
router.post(
  '/register',
  patientRegistrationUpload,
  handleUploadError,
  parseFormDataJSON,
  handleEmergencyContactFallback,
  ...validatePatientRegistration,
  checkValidationResult,
  validateFileUploads,
  validateEmergencyContactExists,
  patientController.registerPatient
);
// router.post(
//   '/register',
//   patientRegistrationUpload,
//   handleUploadError,
//   parseFormDataJSON,
//   validateFileUploads,
//   ...validatePatientRegistration,
//   checkValidationResult,
//   patientController.registerPatient
// );

/**
 * @route   POST /api/patients/register/quick
 * @desc    Quick patient registration (partial registration - personal + contact only)
 * @access  Public
 * @body    Partial RegistrationData
 */

router.post(
  '/register/quick',
  patientRegistrationUpload,
  handleUploadError,
  parseFormDataJSON,
  handleEmergencyContactFallback,
  validateFileUploads,
  ...validatePartialRegistration,
  checkValidationResult,
  patientController.quickRegisterPatient
);

/**
 * @route   GET /api/patients/search/:identifier
 * @desc    Search patient by phone, email, patient number, or QR code
 * @access  Private (Staff only)
 */
router.get(
  '/search/:identifier',
  authenticateJWT,
  ...validateSearchParams,
  checkValidationResult,
  patientController.searchPatient
);

/**
 * @route   POST /api/patients/verify-abha
 * @desc    Verify ABHA ID
 * @access  Public
 * @body    { abhaId: string }
 */
router.post(
  '/verify-abha',
  ...validateABHAId,
  checkValidationResult,
  patientController.verifyABHAId
);

/**
 * @route   POST /api/patients/send-otp
 * @desc    Send OTP for registration verification
 * @access  Public
 * @body    { phone: string, email?: string }
 */
router.post(
  '/send-otp',
  ...validateSendOTP,
  checkValidationResult,
  patientController.sendOTP
);

/**
 * @route   POST /api/patients/verify-otp
 * @desc    Verify OTP for registration
 * @access  Public
 * @body    { phone: string, otp: string }
 */
router.post(
  '/verify-otp',
  ...validateVerifyOTP,
  checkValidationResult,
  patientController.verifyOTP
);

/**
 * @route   GET /api/patients/stats/registration
 * @desc    Get registration statistics
 * @access  Private (Staff only)
 * @query   startDate, endDate, groupBy
 */
router.get(
  '/stats/registration',
  authenticateJWT,
  ...validateStatsQuery,
  checkValidationResult,
  patientController.getRegistrationStats
);

/**
 * @route   POST /api/patients/bulk-import
 * @desc    Bulk import patients from CSV/Excel
 * @access  Private (Admin only)
 */
router.post(
  '/bulk-import',
  authenticateJWT,
  patientController.bulkImportPatients
);

/**
 * @route   GET /api/patients/export
 * @desc    Export patients data
 * @access  Private (Staff only)
 * @query   format (csv, excel), filters
 */
router.get(
  '/export',
  authenticateJWT,
  patientController.exportPatients
);

/**
 * @route   GET /api/patients
 * @desc    Get all patients with pagination and filters
 * @access  Private (Staff only)
 * @query   page, limit, status, registrationMethod, search, sortBy, sortOrder
 */
router.get(
  '/',
  authenticateJWT,
  ...validateListPatients,
  checkValidationResult,
  patientController.getAllPatients
);

// ==============================================================================
// PARAMETER ROUTES - THESE MUST COME AFTER SPECIFIC ROUTES
// ==============================================================================

/**
 * @route   PUT /api/patients/:patientId/complete
 * @desc    Complete partial registration (convert quick registration to full)
 * @access  Public/Authenticated (optional auth)
 * @body    Remaining RegistrationData + Files
 */
router.put(
  '/:patientId/complete',
  optionalAuth,
  patientRegistrationUpload,
  handleUploadError,
  parseFormDataJSON,
  validateFileUploads,
  ...validatePatientId,
  ...validateCompleteRegistration,
  checkValidationResult,
  patientController.completeRegistration
);

/**
 * @route   POST /api/patients/:patientId/generate-qr
 * @desc    Generate new QR code for patient
 * @access  Private (Staff only)
 */
router.post(
  '/:patientId/generate-qr',
  authenticateJWT,
  ...validatePatientId,
  checkValidationResult,
  patientController.generateNewQRCode
);

/**
 * @route   GET /api/patients/:patientId/qr-code
 * @desc    Get patient QR code image
 * @access  Public (for patient access)
 */
router.get(
  '/:patientId/qr-code',
  ...validatePatientId,
  checkValidationResult,
  patientController.getQRCodeImage
);

/**
 * @route   GET /api/patients/:patientId/documents
 * @desc    Get patient documents
 * @access  Private (Staff only) or Patient with valid token
 */
router.get(
  '/:patientId/documents',
  optionalAuth,
  ...validatePatientId,
  checkValidationResult,
  patientController.getPatientDocuments
);

/**
 * @route   POST /api/patients/:patientId/documents
 * @desc    Add additional documents to existing patient
 * @access  Private (Staff only)
 */
router.post(
  '/:patientId/documents',
  authenticateJWT,
  patientRegistrationUpload,
  handleUploadError,
  validateFileUploads,
  ...validatePatientId,
  checkValidationResult,
  patientController.addPatientDocuments
);

/**
 * @route   DELETE /api/patients/:patientId/documents/:documentType
 * @desc    Delete a specific patient document
 * @access  Private (Staff only)
 */
router.delete(
  '/:patientId/documents/:documentType',
  authenticateJWT,
  ...validatePatientId,
  checkValidationResult,
  patientController.deletePatientDocument
);

/**
 * @route   PATCH /api/patients/:patientId/status
 * @desc    Update patient status (active, inactive, archived)
 * @access  Private (Staff only)
 * @body    { status: string, reason?: string }
 */
router.patch(
  '/:patientId/status',
  authenticateJWT,
  ...validatePatientId,
  ...validateStatusUpdate,
  checkValidationResult,
  patientController.updatePatientStatus
);

/**
 * @route   GET /api/patients/:patientId/visits-summary
 * @desc    Get patient visits summary
 * @access  Private (Staff only)
 */
router.get(
  '/:patientId/visits-summary',
  authenticateJWT,
  ...validatePatientId,
  checkValidationResult,
  patientController.getPatientVisitsSummary
);

/**
 * @route   POST /api/patients/:patientId/merge
 * @desc    Merge duplicate patient records
 * @access  Private (Admin only)
 * @body    { targetPatientId: string }
 */
router.post(
  '/:patientId/merge',
  authenticateJWT,
  ...validatePatientId,
  checkValidationResult,
  patientController.mergePatientRecords
);

/**
 * @route   PUT /api/patients/:patientId
 * @desc    Update patient information
 * @access  Private (Staff only)
 * @body    Updated patient data + Files
 */
router.put(
  '/:patientId',
  authenticateJWT,
  patientRegistrationUpload,
  handleUploadError,
  validateFileUploads,
  ...validatePatientId,
  ...validatePatientUpdate,
  checkValidationResult,
  patientController.updatePatient
);

/**
 * @route   GET /api/patients/:patientId
 * @desc    Get patient by ID
 * @access  Private (Staff only)
 */
router.get(
  '/:patientId',
  authenticateJWT,
  ...validatePatientId,
  checkValidationResult,
  patientController.getPatientById
);

module.exports = router;
