const { PrismaClient } = require('../generated/prisma');
const { generatePatientNumber, generateMRN, generateQRCode } = require('../utils/patient.utils');
const { processUploadedFiles, cleanupUploadedFiles } = require('../middleware/upload.middleware');

const prisma = new PrismaClient();

/**
 * Patient Service - Handles all patient-related business logic
 */

/**
 * Create a new patient (full registration)
 */
const createPatient = async (patientData, files = {}, hospitalId) => {
  try {
    console.log('🏥 Creating patient with data:', JSON.stringify(patientData, null, 2));
    
    // Process uploaded files
    const processedFiles = files ? processUploadedFiles({ files }) : {};
    console.log('📁 Processed files:', processedFiles);

    // Generate unique identifiers
    const patientNumber = await generatePatientNumber(hospitalId);
    const mrn = await generateMRN(hospitalId);
    const qrCode = generateQRCode(patientNumber);

    // Prepare patient data structure matching the Prisma schema
    const patientRecord = {
      patientNumber,
      mrn,
      qrCode,
      hospitalId,
      
      // Personal Details (JSON field)
      personalDetails: {
        title: patientData.personal?.title || '',
        firstName: patientData.personal?.firstName || '',
        lastName: patientData.personal?.lastName || '',
        dateOfBirth: patientData.personal?.dateOfBirth || null,
        gender: patientData.personal?.gender || '',
        bloodGroup: patientData.personal?.bloodGroup || null,
        nationality: patientData.personal?.nationality || 'Indian',
        preferredLanguage: patientData.personal?.preferredLanguage || 'English',
        maritalStatus: patientData.personal?.maritalStatus || null,
        occupation: patientData.personal?.occupation || null,
        religion: patientData.personal?.religion || null
      },

      // Contact Details (JSON field)
      contactDetails: {
        primaryPhone: patientData.contact?.primaryPhone || '',
        secondaryPhone: patientData.contact?.secondaryPhone || null,
        whatsappPhone: patientData.contact?.whatsappPhone || null,
        email: patientData.contact?.email || null,
        currentAddress: patientData.contact?.currentAddress || {},
        permanentAddress: patientData.contact?.sameAsCurrent 
          ? patientData.contact?.currentAddress 
          : patientData.contact?.permanentAddress || {},
        emergencyContact: patientData.contact?.emergencyContact || {}
      },

      // ABHA ID (separate field)
      abhaId: patientData.personal?.abhaId || null,

      // Medical History (JSON field)
      medicalHistory: patientData.medical ? {
        allergies: patientData.medical.allergies || [],
        chronicConditions: patientData.medical.chronicConditions || [],
        currentMedications: patientData.medical.currentMedications || [],
        previousSurgeries: patientData.medical.previousSurgeries || [],
        familyHistory: patientData.medical.familyHistory || [],
        lifestyle: patientData.medical.lifestyle || {},
        vitals: patientData.medical.vitals || {}
      } : null,

      // Insurance Details (JSON field)
      insuranceDetails: patientData.insurance ? {
        hasInsurance: patientData.insurance.hasInsurance || false,
        paymentMethod: patientData.insurance.paymentMethod || 'cash',
        provider: patientData.insurance.provider || null,
        policyNumber: patientData.insurance.policyNumber || null,
        policyType: patientData.insurance.policyType || null,
        policyHolderName: patientData.insurance.policyHolderName || null,
        policyHolderRelation: patientData.insurance.policyHolderRelation || null,
        validityDate: patientData.insurance.validityDate || null,
        coverageAmount: patientData.insurance.coverageAmount || null,
        coPaymentPercentage: patientData.insurance.coPaymentPercentage || null,
        tpaName: patientData.insurance.tpaName || null,
        requiresPreAuth: patientData.insurance.requiresPreAuth || [],
        emergencyContacts: patientData.insurance.emergencyContacts || []
      } : { hasInsurance: false, paymentMethod: 'cash' },

      // Consent Status (JSON field)
      consentStatus: {
        medicalConsent: patientData.consent?.medicalConsent || patientData.consent?.treatmentConsent || false,
        privacyPolicy: patientData.consent?.privacyPolicy || patientData.consent?.dataProcessingConsent || false,
        marketingConsent: patientData.consent?.marketingConsent || patientData.consent?.communicationConsent || false,
        appointmentReminders: patientData.consent?.appointmentReminders || { sms: true, email: false, whatsapp: false },
        healthNewsletters: patientData.consent?.healthNewsletters || { daily: false, weekly: false, monthly: false },
        promotionalOffers: patientData.consent?.promotionalOffers || false,
        researchParticipation: patientData.consent?.researchParticipation || false,
        photoVideoConsent: patientData.consent?.photoVideoConsent || false,
        abhaIdVerified: patientData.consent?.abhaIdVerified || false,
        otpVerified: patientData.consent?.otpVerified || false,
        digitalSignature: patientData.consent?.digitalSignature || null,
        consentDate: patientData.consent?.consentDate ? new Date(patientData.consent.consentDate) : new Date(),
        consentBy: patientData.consent?.consentBy || `${patientData.personal?.firstName} ${patientData.personal?.lastName}`,
        consentMethod: patientData.consent?.consentMethod || 'digital'
      },

      // Document Storage (as part of personalDetails or separate JSON field)
      identificationDocuments: {
        profilePhoto: processedFiles.profilePhoto?.filename || null,
        governmentId: processedFiles.governmentId?.filename || null,
        addressProof: processedFiles.addressProof?.filename || null,
        insuranceCardFront: processedFiles.insuranceCardFront?.filename || null,
        insuranceCardBack: processedFiles.insuranceCardBack?.filename || null,
        medicalRecords: processedFiles.medicalRecords?.map(file => file.filename) || []
      },

      // Status and metadata
      patientStatus: 'active',
      patientType: 'regular',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Creating patient record:', JSON.stringify(patientRecord, null, 2));

    // Save to database
    const patient = await prisma.patient.create({
      data: patientRecord
    });

    console.log('✅ Patient created successfully:', patient.id);

    return {
      success: true,
      patient: {
        id: patient.id,
        patientNumber: patient.patientNumber,
        qrCode: patient.qrCode,
        mrn: patient.mrn,
        personalDetails: patient.personalDetails,
        contactDetails: patient.contactDetails,
        patientStatus: patient.patientStatus,
        createdAt: patient.createdAt
      }
    };

  } catch (error) {
    console.error('❌ Error creating patient:', error);
    
    // Clean up uploaded files if database save failed
    if (files) {
      cleanupUploadedFiles(processUploadedFiles({ files }));
    }
    
    throw new Error(`Failed to create patient: ${error.message}`);
  }
};

/**
 * Create a quick patient registration (minimal data)
 */
const createQuickPatient = async (patientData, files = {}, hospitalId) => {
  try {
    console.log('🚀 Creating quick patient registration:', JSON.stringify(patientData, null, 2));
    
    // Process uploaded files (optional for quick registration)
    const processedFiles = files ? processUploadedFiles({ files }) : {};

    // Generate unique identifiers
    const patientNumber = await generatePatientNumber(hospitalId);
    const mrn = await generateMRN(hospitalId);
    const qrCode = generateQRCode(patientNumber);

    // Prepare minimal patient data structure for quick registration
    const patientRecord = {
      patientNumber,
      mrn,
      qrCode,
      hospitalId,
      
      // Essential personal details only
      personalDetails: {
        title: patientData.personal?.title || '',
        firstName: patientData.personal?.firstName || '',
        lastName: patientData.personal?.lastName || '',
        dateOfBirth: patientData.personal?.dateOfBirth || null,
        gender: patientData.personal?.gender || '',
        bloodGroup: patientData.personal?.bloodGroup || null,
        nationality: patientData.personal?.nationality || 'Indian',
        preferredLanguage: patientData.personal?.preferredLanguage || 'English'
      },

      // Essential contact details only
      contactDetails: {
        primaryPhone: patientData.contact?.primaryPhone || '',
        email: patientData.contact?.email || null,
        currentAddress: patientData.contact?.currentAddress || {},
        permanentAddress: patientData.contact?.sameAsCurrent 
          ? patientData.contact?.currentAddress 
          : patientData.contact?.permanentAddress || patientData.contact?.currentAddress || {},
        emergencyContact: patientData.contact?.emergencyContact || {}
      },

      // Empty medical history (to be completed later)
      medicalHistory: null,

      // Basic insurance info
      insuranceDetails: {
        hasInsurance: false,
        paymentMethod: 'cash'
      },

      // Basic consent (minimal required)
      consentStatus: {
        medicalConsent: patientData.consent?.treatmentConsent === 'true' || patientData.consent?.treatmentConsent === true,
        privacyPolicy: patientData.consent?.dataProcessingConsent === 'true' || patientData.consent?.dataProcessingConsent === true,
        marketingConsent: patientData.consent?.communicationConsent === 'true' || patientData.consent?.communicationConsent === true,
        appointmentReminders: { sms: true, email: false, whatsapp: false },
        consentDate: new Date(),
        consentBy: `${patientData.personal?.firstName} ${patientData.personal?.lastName}`,
        consentMethod: 'digital'
      },

      // Document storage (minimal)
      identificationDocuments: {
        profilePhoto: processedFiles.profilePhoto?.filename || null,
        governmentId: null,
        addressProof: null,
        insuranceCardFront: null,
        insuranceCardBack: null,
        medicalRecords: []
      },

      // Status for partial registration
      patientStatus: 'partial_registration',
      patientType: 'regular',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Creating quick patient record:', JSON.stringify(patientRecord, null, 2));

    // Save to database
    const patient = await prisma.patient.create({
      data: patientRecord
    });

    console.log('✅ Quick patient created successfully:', patient.id);

    return {
      success: true,
      patient: {
        id: patient.id,
        patientNumber: patient.patientNumber,
        qrCode: patient.qrCode,
        mrn: patient.mrn,
        personalDetails: patient.personalDetails,
        contactDetails: patient.contactDetails,
        patientStatus: patient.patientStatus,
        createdAt: patient.createdAt
      },
      nextSteps: {
        message: 'Complete your registration by providing medical history, insurance details, and consent information',
        completeRegistrationUrl: `/api/patients/${patient.id}/complete`
      }
    };

  } catch (error) {
    console.error('❌ Error creating quick patient:', error);
    
    // Clean up uploaded files if database save failed
    if (files) {
      cleanupUploadedFiles(processUploadedFiles({ files }));
    }
    
    throw new Error(`Failed to create quick patient: ${error.message}`);
  }
};

/**
 * Complete a partial patient registration
 */
const completePatientRegistration = async (patientId, completionData, files = {}) => {
  try {
    console.log('🔄 Completing patient registration for:', patientId);
    
    // Check if patient exists and is in partial registration status
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!existingPatient) {
      throw new Error('Patient not found');
    }

    if (existingPatient.patientStatus !== 'partial_registration') {
      throw new Error('Patient registration is already complete');
    }

    // Process additional uploaded files
    const processedFiles = files ? processUploadedFiles({ files }) : {};

    // Merge existing documents with new ones
    const updatedDocuments = {
      ...existingPatient.documents,
      governmentId: processedFiles.governmentId?.filename || existingPatient.documents?.governmentId,
      addressProof: processedFiles.addressProof?.filename || existingPatient.documents?.addressProof,
      insuranceCardFront: processedFiles.insuranceCardFront?.filename || existingPatient.documents?.insuranceCardFront,
      insuranceCardBack: processedFiles.insuranceCardBack?.filename || existingPatient.documents?.insuranceCardBack,
      medicalRecords: [
        ...(existingPatient.documents?.medicalRecords || []),
        ...(processedFiles.medicalRecords?.map(file => file.filename) || [])
      ]
    };

    // Update patient with completion data
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        // Update medical history if provided
        medicalHistory: completionData.medical || existingPatient.medicalHistory,
        
        // Update insurance details if provided
        insuranceDetails: completionData.insurance || existingPatient.insuranceDetails,
        
        // Merge consent details
        consentDetails: {
          ...existingPatient.consentDetails,
          ...completionData.consent,
          consentDate: new Date()
        },
        
        // Update documents
        documents: updatedDocuments,
        
        // Update status to active
        patientStatus: 'active',
        registrationMethod: 'full',
        updatedAt: new Date()
      }
    });

    console.log('✅ Patient registration completed successfully');

    return {
      success: true,
      patient: {
        id: updatedPatient.id,
        patientNumber: updatedPatient.patientNumber,
        personalDetails: updatedPatient.personalDetails,
        contactDetails: updatedPatient.contactDetails,
        patientStatus: updatedPatient.patientStatus,
        updatedAt: updatedPatient.updatedAt
      }
    };

  } catch (error) {
    console.error('❌ Error completing patient registration:', error);
    
    // Clean up uploaded files if update failed
    if (files) {
      cleanupUploadedFiles(processUploadedFiles({ files }));
    }
    
    throw new Error(`Failed to complete patient registration: ${error.message}`);
  }
};

/**
 * Search for a patient by various identifiers
 */
const searchPatient = async (identifier, hospitalId) => {
  try {
    console.log('🔍 Searching for patient with identifier:', identifier);

    const patient = await prisma.patient.findFirst({
      where: {
        AND: [
          { hospitalId },
          {
            OR: [
              { contactDetails: { path: ['primaryPhone'], equals: identifier } },
              { contactDetails: { path: ['email'], equals: identifier } },
              { patientNumber: identifier },
              { qrCode: identifier },
              { mrn: identifier }
            ]
          }
        ]
      }
    });

    if (!patient) {
      return { success: false, message: 'Patient not found' };
    }

    return {
      success: true,
      patient: {
        id: patient.id,
        patientNumber: patient.patientNumber,
        personalDetails: patient.personalDetails,
        contactDetails: patient.contactDetails,
        patientStatus: patient.patientStatus,
        createdAt: patient.createdAt
      }
    };

  } catch (error) {
    console.error('❌ Error searching patient:', error);
    throw new Error(`Failed to search patient: ${error.message}`);
  }
};

/**
 * Get patient by ID
 */
const getPatientById = async (patientId, hospitalId) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId
      }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    return {
      success: true,
      patient: {
        id: patient.id,
        patientNumber: patient.patientNumber,
        mrn: patient.mrn,
        qrCode: patient.qrCode,
        personalDetails: patient.personalDetails,
        contactDetails: patient.contactDetails,
        medicalHistory: patient.medicalHistory,
        insuranceDetails: patient.insuranceDetails,
        consentDetails: patient.consentDetails,
        documents: patient.documents,
        patientStatus: patient.patientStatus,
        registrationMethod: patient.registrationMethod,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      }
    };

  } catch (error) {
    console.error('❌ Error getting patient by ID:', error);
    throw new Error(`Failed to get patient: ${error.message}`);
  }
};

/**
 * Get all patients with pagination and filters
 */
const getAllPatients = async (hospitalId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      registrationMethod,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {
      hospitalId,
      ...(status && { patientStatus: status }),
      ...(registrationMethod && { registrationMethod }),
      ...(search && {
        OR: [
          { personalDetails: { path: ['firstName'], string_contains: search } },
          { personalDetails: { path: ['lastName'], string_contains: search } },
          { contactDetails: { path: ['primaryPhone'], string_contains: search } },
          { contactDetails: { path: ['email'], string_contains: search } },
          { patientNumber: { contains: search } }
        ]
      })
    };

    // Get patients with pagination
    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.patient.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      patients: patients.map(patient => ({
        id: patient.id,
        patientNumber: patient.patientNumber,
        personalDetails: patient.personalDetails,
        contactDetails: patient.contactDetails,
        patientStatus: patient.patientStatus,
        registrationMethod: patient.registrationMethod,
        createdAt: patient.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: totalCount,
        limit: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    console.error('❌ Error getting all patients:', error);
    throw new Error(`Failed to get patients: ${error.message}`);
  }
};

/**
 * Update patient information
 */
const updatePatient = async (patientId, updateData, files = {}, hospitalId) => {
  try {
    console.log('📝 Updating patient:', patientId);

    // Check if patient exists
    const existingPatient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId }
    });

    if (!existingPatient) {
      throw new Error('Patient not found');
    }

    // Process uploaded files
    const processedFiles = files ? processUploadedFiles({ files }) : {};

    // Merge existing documents with new ones
    const updatedDocuments = {
      ...existingPatient.documents,
      ...(processedFiles.profilePhoto && { profilePhoto: processedFiles.profilePhoto.filename }),
      ...(processedFiles.governmentId && { governmentId: processedFiles.governmentId.filename }),
      ...(processedFiles.addressProof && { addressProof: processedFiles.addressProof.filename }),
      ...(processedFiles.insuranceCardFront && { insuranceCardFront: processedFiles.insuranceCardFront.filename }),
      ...(processedFiles.insuranceCardBack && { insuranceCardBack: processedFiles.insuranceCardBack.filename }),
      medicalRecords: [
        ...(existingPatient.documents?.medicalRecords || []),
        ...(processedFiles.medicalRecords?.map(file => file.filename) || [])
      ]
    };

    // Prepare update data
    const updateFields = {
      ...(updateData.personal && {
        personalDetails: {
          ...existingPatient.personalDetails,
          ...updateData.personal
        }
      }),
      ...(updateData.contact && {
        contactDetails: {
          ...existingPatient.contactDetails,
          ...updateData.contact
        }
      }),
      ...(updateData.medical && {
        medicalHistory: {
          ...existingPatient.medicalHistory,
          ...updateData.medical
        }
      }),
      ...(updateData.insurance && {
        insuranceDetails: {
          ...existingPatient.insuranceDetails,
          ...updateData.insurance
        }
      }),
      ...(updateData.consent && {
        consentDetails: {
          ...existingPatient.consentDetails,
          ...updateData.consent
        }
      }),
      documents: updatedDocuments,
      updatedAt: new Date()
    };

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateFields
    });

    return {
      success: true,
      patient: {
        id: updatedPatient.id,
        patientNumber: updatedPatient.patientNumber,
        personalDetails: updatedPatient.personalDetails,
        contactDetails: updatedPatient.contactDetails,
        updatedAt: updatedPatient.updatedAt
      }
    };

  } catch (error) {
    console.error('❌ Error updating patient:', error);
    
    // Clean up uploaded files if update failed
    if (files) {
      cleanupUploadedFiles(processUploadedFiles({ files }));
    }
    
    throw new Error(`Failed to update patient: ${error.message}`);
  }
};

/**
 * Update patient status
 */
const updatePatientStatus = async (patientId, status, reason, hospitalId) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        patientStatus: status,
        statusReason: reason,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      patient: {
        id: updatedPatient.id,
        patientStatus: updatedPatient.patientStatus,
        updatedAt: updatedPatient.updatedAt
      }
    };

  } catch (error) {
    console.error('❌ Error updating patient status:', error);
    throw new Error(`Failed to update patient status: ${error.message}`);
  }
};

/**
 * Generate new QR code for patient
 */
const generateNewQRCode = async (patientId, hospitalId) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const newQRCode = generateQRCode(patient.patientNumber);

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        qrCode: newQRCode,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      patientId,
      qrCode: newQRCode,
      patientNumber: patient.patientNumber
    };

  } catch (error) {
    console.error('❌ Error generating new QR code:', error);
    throw new Error(`Failed to generate new QR code: ${error.message}`);
  }
};

/**
 * Get registration statistics
 */
const getRegistrationStats = async (hospitalId, filters = {}) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = filters;

    const whereClause = {
      hospitalId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [totalRegistrations, fullRegistrations, quickRegistrations, activePatients] = await Promise.all([
      prisma.patient.count({ where: whereClause }),
      prisma.patient.count({ where: { ...whereClause, registrationMethod: 'full' } }),
      prisma.patient.count({ where: { ...whereClause, registrationMethod: 'quick' } }),
      prisma.patient.count({ where: { ...whereClause, patientStatus: 'active' } })
    ]);

    return {
      success: true,
      totalRegistrations,
      fullRegistrations,
      quickRegistrations,
      completedRegistrations: activePatients,
      pendingCompletions: totalRegistrations - activePatients
    };

  } catch (error) {
    console.error('❌ Error getting registration stats:', error);
    throw new Error(`Failed to get registration statistics: ${error.message}`);
  }
};

module.exports = {
  createPatient,
  createQuickPatient,
  completePatientRegistration,
  searchPatient,
  getPatientById,
  getAllPatients,
  updatePatient,
  updatePatientStatus,
  generateNewQRCode,
  getRegistrationStats
};
