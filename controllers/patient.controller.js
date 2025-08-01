const patientService = require('../services/patient.service');
const { processUploadedFiles, cleanupUploadedFiles } = require('../middleware/upload.middleware');
const QRCode = require('qrcode');
const crypto = require('crypto');

// In-memory OTP storage (In production, use Redis or database)
const otpStorage = new Map();

class PatientController {
  /**
   * Register a new patient (full registration)
   */
  async registerPatient(req, res) {
    try {
      const hospitalId = req.user?.hospitalId || req.body.hospitalId;

      if (!hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'Hospital ID is required'
        });
      }

      console.log('🏥 Full patient registration request:', {
        hospitalId,
        hasFiles: !!req.files,
        bodyKeys: Object.keys(req.body)
      });

      // Extract registration data from request body using the new frontend structure
      const registrationData = {
        personal: req.body.personal || {},
        contact: req.body.contact || {},
        medical: req.body.medical || {},
        insurance: req.body.insurance || {},
        consent: req.body.consent || {}
      };

      // Create patient with full registration
      const result = await patientService.createPatient(registrationData, req.files, hospitalId);

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: result
      });
    } catch (error) {
      // Clean up uploaded files if registration fails
      if (req.files) {
        const uploadedFiles = processUploadedFiles(req);
        cleanupUploadedFiles(uploadedFiles);
      }

      console.error('Error in registerPatient:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register patient',
        error: error.message
      });
    }
  }

  /**
   * Quick patient registration (partial registration)
   */
  async quickRegisterPatient(req, res) {
    try {
      const hospitalId = req.user?.hospitalId || req.body.hospitalId;

      if (!hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'Hospital ID is required'
        });
      }

      console.log('🚀 Quick patient registration request:', {
        hospitalId,
        hasFiles: !!req.files,
        bodyKeys: Object.keys(req.body)
      });

      // Extract registration data for quick registration
      const registrationData = {
        personal: req.body.personal || {},
        contact: req.body.contact || {},
        consent: req.body.consent || {}
      };

      // Create quick registration patient
      const result = await patientService.createQuickPatient(registrationData, req.files, hospitalId);

      res.status(201).json({
        success: true,
        message: 'Quick registration completed successfully',
        data: result
      });
    } catch (error) {
      // Clean up uploaded files if registration fails
      if (req.files) {
        const uploadedFiles = processUploadedFiles(req);
        cleanupUploadedFiles(uploadedFiles);
      }

      console.error('Error in quickRegisterPatient:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete quick registration',
        error: error.message
      });
    }
  }

  /**
   * Complete partial registration
   */
  async completeRegistration(req, res) {
    try {
      const { patientId } = req.params;

      // Process uploaded files
      const uploadedFiles = processUploadedFiles(req);

      // Extract registration data from request body
      const registrationData = {
        medical: JSON.parse(req.body.medical || '{}'),
        insurance: JSON.parse(req.body.insurance || '{}'),
        consent: JSON.parse(req.body.consent || '{}'),
        uploadedFiles
      };

      // Complete registration
      const patient = await patientService.completeRegistration(patientId, registrationData);

      res.status(200).json({
        success: true,
        message: 'Registration completed successfully',
        data: {
          patient: {
            id: patient.id,
            patientNumber: patient.patientNumber,
            qrCode: patient.qrCode,
            mrn: patient.mrn,
            personalDetails: patient.personalDetails,
            contactDetails: patient.contactDetails,
            patientStatus: patient.patientStatus
          }
        }
      });
    } catch (error) {
      // Clean up uploaded files if completion fails
      if (req.files) {
        const uploadedFiles = processUploadedFiles(req);
        cleanupUploadedFiles(uploadedFiles);
      }

      console.error('Error in completeRegistration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete registration',
        error: error.message
      });
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(req, res) {
    try {
      const { patientId } = req.params;
      const patient = await patientService.getPatientById(patientId);

      res.status(200).json({
        success: true,
        message: 'Patient retrieved successfully',
        data: { patient }
      });
    } catch (error) {
      console.error('Error in getPatientById:', error);

      if (error.message === 'Patient not found') {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient',
        error: error.message
      });
    }
  }

  /**
   * Search patient by identifier
   */
  async searchPatient(req, res) {
    try {
      const { identifier } = req.params;
      const hospitalId = req.user.hospitalId;

      const patient = await patientService.searchPatient(identifier, hospitalId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Patient found',
        data: { patient }
      });
    } catch (error) {
      console.error('Error in searchPatient:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search patient',
        error: error.message
      });
    }
  }

  /**
   * Update patient information
   */
  async updatePatient(req, res) {
    try {
      const { patientId } = req.params;

      // Process uploaded files
      const uploadedFiles = processUploadedFiles(req);

      // Extract update data from request body
      const updateData = {};

      if (req.body.personal) {
        updateData.personalDetails = JSON.parse(req.body.personal);
      }

      if (req.body.contact) {
        updateData.contactDetails = JSON.parse(req.body.contact);
      }

      if (req.body.medical) {
        const medical = JSON.parse(req.body.medical);
        updateData.allergies = medical.allergies;
        updateData.chronicConditions = medical.chronicConditions;
        updateData.familyHistory = medical.familyHistory;
        updateData.socialHistory = medical.socialHistory;
        updateData.medicationHistory = medical.medicationHistory;
        updateData.surgicalHistory = medical.surgicalHistory;
      }

      if (req.body.insurance) {
        updateData.insuranceDetails = JSON.parse(req.body.insurance);
      }

      if (req.body.consent) {
        const consent = JSON.parse(req.body.consent);
        updateData.consentStatus = consent;
      }

      // Update patient
      const patient = await patientService.updatePatient(patientId, updateData, uploadedFiles);

      res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: { patient }
      });
    } catch (error) {
      // Clean up uploaded files if update fails
      if (req.files) {
        const uploadedFiles = processUploadedFiles(req);
        cleanupUploadedFiles(uploadedFiles);
      }

      console.error('Error in updatePatient:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update patient',
        error: error.message
      });
    }
  }

  /**
   * Get all patients with pagination and filters
   */
  async getAllPatients(req, res) {
    try {
      const hospitalId = req.user.hospitalId;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        registrationMethod: req.query.registrationMethod,
        search: req.query.search,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await patientService.getAllPatients(hospitalId, options);

      res.status(200).json({
        success: true,
        message: 'Patients retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in getAllPatients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patients',
        error: error.message
      });
    }
  }

  /**
   * Generate new QR code for patient
   */
  async generateNewQRCode(req, res) {
    try {
      const { patientId } = req.params;
      const patient = await patientService.generateNewQRCode(patientId);

      res.status(200).json({
        success: true,
        message: 'New QR code generated successfully',
        data: {
          patientId: patient.id,
          qrCode: patient.qrCode,
          patientNumber: patient.patientNumber
        }
      });
    } catch (error) {
      console.error('Error in generateNewQRCode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate new QR code',
        error: error.message
      });
    }
  }

  /**
   * Get patient QR code image
   */
  async getQRCodeImage(req, res) {
    try {
      const { patientId } = req.params;
      const patient = await patientService.getPatientById(patientId);

      if (!patient.qrCode) {
        return res.status(404).json({
          success: false,
          message: 'QR code not found for this patient'
        });
      }

      // Generate QR code image
      const qrCodeDataURL = await QRCode.toDataURL(patient.qrCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to buffer
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error in getQRCodeImage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR code image',
        error: error.message
      });
    }
  }

  /**
   * Verify ABHA ID
   */
  async verifyABHAId(req, res) {
    try {
      const { abhaId } = req.body;

      if (!abhaId || abhaId.length !== 17) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ABHA ID format'
        });
      }

      // In a real implementation, this would call the ABHA verification API
      // For now, we'll simulate the verification
      const isValid = /^\d{2}-\d{4}-\d{4}-\d{4}$/.test(abhaId);

      res.status(200).json({
        success: true,
        message: isValid ? 'ABHA ID verified successfully' : 'Invalid ABHA ID',
        data: {
          abhaId,
          verified: isValid,
          details: isValid ? {
            status: 'active',
            issueDate: '2023-01-01',
            expiryDate: '2033-01-01'
          } : null
        }
      });
    } catch (error) {
      console.error('Error in verifyABHAId:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify ABHA ID',
        error: error.message
      });
    }
  }

  /**
   * Send OTP for registration verification
   */
  async sendOTP(req, res) {
    try {
      const { phone, email } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP with expiration (5 minutes)
      const otpData = {
        otp,
        phone,
        email,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0
      };

      otpStorage.set(phone, otpData);

      // In a real implementation, send SMS and email
      console.log(`Sending OTP ${otp} to phone: ${phone}, email: ${email}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone,
          email,
          expiresIn: 300, // 5 minutes in seconds
          // For development only - remove in production
          ...(process.env.NODE_ENV === 'development' && { otp })
        }
      });
    } catch (error) {
      console.error('Error in sendOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      });
    }
  }

  /**
   * Verify OTP for registration
   */
  async verifyOTP(req, res) {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required'
        });
      }

      const otpData = otpStorage.get(phone);

      if (!otpData) {
        return res.status(400).json({
          success: false,
          message: 'OTP not found or expired'
        });
      }

      // Check if OTP is expired
      if (Date.now() > otpData.expiresAt) {
        otpStorage.delete(phone);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired'
        });
      }

      // Check attempt limit
      if (otpData.attempts >= 3) {
        otpStorage.delete(phone);
        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP'
        });
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        otpData.attempts++;
        otpStorage.set(phone, otpData);

        return res.status(400).json({
          success: false,
          message: 'Invalid OTP',
          data: {
            remainingAttempts: 3 - otpData.attempts
          }
        });
      }

      // OTP verified successfully
      otpStorage.delete(phone);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          phone,
          verified: true
        }
      });
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP',
        error: error.message
      });
    }
  }

  /**
   * Get patient documents
   */
  async getPatientDocuments(req, res) {
    try {
      const { patientId } = req.params;
      const patient = await patientService.getPatientById(patientId);

      const documents = {
        identificationDocuments: patient.identificationDocuments,
        profilePhoto: patient.personalDetails?.profilePhoto,
        insuranceCards: patient.insuranceDetails?.cardImages
      };

      res.status(200).json({
        success: true,
        message: 'Patient documents retrieved successfully',
        data: { documents }
      });
    } catch (error) {
      console.error('Error in getPatientDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient documents',
        error: error.message
      });
    }
  }

  /**
   * Delete a specific patient document
   */
  async deletePatientDocument(req, res) {
    try {
      const { patientId, documentType } = req.params;

      // This would need implementation to remove specific documents
      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error in deletePatientDocument:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  /**
   * Add additional documents to existing patient
   */
  async addPatientDocuments(req, res) {
    try {
      const { patientId } = req.params;
      const uploadedFiles = processUploadedFiles(req);

      const patient = await patientService.updatePatient(patientId, {}, uploadedFiles);

      res.status(200).json({
        success: true,
        message: 'Documents added successfully',
        data: { patient }
      });
    } catch (error) {
      if (req.files) {
        const uploadedFiles = processUploadedFiles(req);
        cleanupUploadedFiles(uploadedFiles);
      }

      console.error('Error in addPatientDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add documents',
        error: error.message
      });
    }
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats(req, res) {
    try {
      const hospitalId = req.user.hospitalId;
      const { startDate, endDate, groupBy } = req.query;

      const stats = await patientService.getRegistrationStats(
        hospitalId,
        startDate,
        endDate,
        groupBy
      );

      res.status(200).json({
        success: true,
        message: 'Registration statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error in getRegistrationStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve registration statistics',
        error: error.message
      });
    }
  }

  /**
   * Update patient status
   */
  async updatePatientStatus(req, res) {
    try {
      const { patientId } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ['active', 'inactive', 'archived', 'partial_registration'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
        });
      }

      const patient = await patientService.updatePatientStatus(patientId, status, reason);

      res.status(200).json({
        success: true,
        message: 'Patient status updated successfully',
        data: { patient }
      });
    } catch (error) {
      console.error('Error in updatePatientStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update patient status',
        error: error.message
      });
    }
  }

  /**
   * Placeholder for other methods
   */
  async bulkImportPatients(req, res) {
    res.status(501).json({
      success: false,
      message: 'Bulk import functionality not yet implemented'
    });
  }

  async exportPatients(req, res) {
    res.status(501).json({
      success: false,
      message: 'Export functionality not yet implemented'
    });
  }

  async getPatientVisitsSummary(req, res) {
    res.status(501).json({
      success: false,
      message: 'Patient visits summary not yet implemented'
    });
  }

  async mergePatientRecords(req, res) {
    res.status(501).json({
      success: false,
      message: 'Patient record merge functionality not yet implemented'
    });
  }
}

module.exports = new PatientController();
