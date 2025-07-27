const { prisma } = require('../config/database');
const crypto = require('crypto');

class PatientService {
  /**
   * Generate unique patient number
   */
  async generatePatientNumber(hospitalId) {
    try {
      // Get hospital info for patient number prefix
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { hospitalCode: true, name: true }
      });

      const hospitalCode = hospital?.hospitalCode || 'HOS';
      const year = new Date().getFullYear().toString().slice(-2);
      
      // Find the last patient number for this hospital
      const lastPatient = await prisma.patient.findFirst({
        where: {
          hospitalId,
          patientNumber: {
            startsWith: `${hospitalCode}${year}`
          }
        },
        orderBy: {
          patientNumber: 'desc'
        }
      });

      let sequence = 1;
      if (lastPatient?.patientNumber) {
        const lastSequence = parseInt(lastPatient.patientNumber.slice(-4));
        sequence = lastSequence + 1;
      }

      return `${hospitalCode}${year}${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating patient number:', error);
      throw new Error('Failed to generate patient number');
    }
  }

  /**
   * Generate unique QR code
   */
  generateQRCode() {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `QR${timestamp}${randomString}`;
  }

  /**
   * Generate MRN (Medical Record Number)
   */
  async generateMRN(hospitalId) {
    try {
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { hospitalCode: true }
      });

      const hospitalCode = hospital?.hospitalCode || 'HOS';
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const randomString = crypto.randomBytes(2).toString('hex').toUpperCase();
      
      return `MRN${hospitalCode}${timestamp}${randomString}`;
    } catch (error) {
      console.error('Error generating MRN:', error);
      throw new Error('Failed to generate MRN');
    }
  }

  /**
   * Create a new patient (full registration)
   */
  async createPatient(patientData, hospitalId) {
    try {
      const {
        personal,
        contact,
        medical,
        insurance,
        consent,
        uploadedFiles
      } = patientData;

      // Generate unique identifiers
      const patientNumber = await this.generatePatientNumber(hospitalId);
      const qrCode = this.generateQRCode();
      const mrn = await this.generateMRN(hospitalId);

      // Prepare personal details
      const personalDetails = {
        title: personal.title,
        firstName: personal.firstName,
        lastName: personal.lastName,
        dateOfBirth: personal.dateOfBirth,
        gender: personal.gender,
        nationality: personal.nationality,
        preferredLanguage: personal.preferredLanguage,
        profilePhoto: uploadedFiles?.profilePhoto || null
      };

      // Prepare contact details
      const contactDetails = {
        primaryPhone: contact.primaryPhone,
        secondaryPhone: contact.secondaryPhone,
        whatsappPhone: contact.whatsappPhone,
        email: contact.email,
        currentAddress: contact.currentAddress,
        permanentAddress: contact.permanentAddress,
        sameAsCurrent: contact.sameAsCurrent
      };

      // Prepare emergency contacts
      const emergencyContacts = insurance?.emergencyContacts || [];

      // Prepare allergies
      const allergies = medical?.allergies || [];

      // Prepare chronic conditions
      const chronicConditions = medical?.chronicConditions || [];

      // Prepare family history
      const familyHistory = medical?.familyHistory || [];

      // Prepare social history
      const socialHistory = {
        smoking: medical?.lifestyle?.smoking || 'Never',
        drinking: medical?.lifestyle?.drinking || 'Never',
        exercise: medical?.lifestyle?.exercise || 'Moderate',
        lifestyle: {
          screenTime: medical?.lifestyle?.screenTime || '2-4 hours',
          eyeStrain: medical?.lifestyle?.eyeStrain || 'None'
        }
      };

      // Prepare medication history
      const medicationHistory = medical?.currentMedications || [];

      // Prepare surgical history
      const surgicalHistory = medical?.previousSurgeries || [];

      // Prepare insurance details
      const insuranceDetails = insurance ? {
        hasInsurance: insurance.hasInsurance,
        paymentMethod: insurance.paymentMethod,
        provider: insurance.provider,
        policyNumber: insurance.policyNumber,
        policyType: insurance.policyType,
        policyHolderName: insurance.policyHolderName,
        policyHolderRelation: insurance.policyHolderRelation,
        validityDate: insurance.validityDate,
        coverageAmount: insurance.coverageAmount,
        coPaymentPercentage: insurance.coPaymentPercentage,
        tpaName: insurance.tpaName,
        requiresPreAuth: insurance.requiresPreAuth || [],
        cardImages: {
          frontImage: uploadedFiles?.insuranceCardFront || null,
          backImage: uploadedFiles?.insuranceCardBack || null
        }
      } : null;

      // Prepare consent status
      const consentStatus = consent ? {
        medicalConsent: consent.medicalConsent,
        privacyPolicy: consent.privacyPolicy,
        marketingConsent: consent.marketingConsent,
        photoVideoConsent: consent.photoVideoConsent,
        researchParticipation: consent.researchParticipation,
        otpVerified: consent.otpVerified,
        digitalSignature: consent.digitalSignature,
        abhaIdVerified: consent.abhaIdVerified
      } : null;

      // Prepare communication preferences
      const communicationPreferences = consent ? {
        appointmentReminders: consent.appointmentReminders,
        healthNewsletters: consent.healthNewsletters,
        promotionalOffers: consent.promotionalOffers
      } : null;

      // Prepare identification documents
      const identificationDocuments = {
        governmentId: uploadedFiles?.governmentId || null,
        addressProof: uploadedFiles?.addressProof || null,
        insuranceCard: uploadedFiles?.insuranceCardFront || null,
        medicalRecords: uploadedFiles?.medicalRecords || []
      };

      // Create patient record
      const patient = await prisma.patient.create({
        data: {
          hospitalId,
          patientNumber,
          mrn,
          qrCode,
          abhaId: consent?.abhaId || null,
          
          // Personal Information
          personalDetails,
          contactDetails,
          emergencyContacts,
          identificationDocuments,
          
          // Medical Information
          bloodGroup: personal.bloodGroup,
          allergies,
          chronicConditions,
          familyHistory,
          socialHistory,
          medicationHistory,
          surgicalHistory,
          
          // Insurance and Financial
          insuranceDetails,
          
          // Privacy and Consent
          consentStatus,
          communicationPreferences,
          
          // Status and Classification
          patientType: 'regular',
          patientStatus: 'active'
        }
      });

      return patient;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw new Error(`Failed to create patient: ${error.message}`);
    }
  }

  /**
   * Create a quick patient registration (partial)
   */
  async createQuickPatient(patientData, hospitalId) {
    try {
      const { personal, contact, uploadedFiles } = patientData;

      // Generate unique identifiers
      const patientNumber = await this.generatePatientNumber(hospitalId);
      const qrCode = this.generateQRCode();
      const mrn = await this.generateMRN(hospitalId);

      // Prepare personal details
      const personalDetails = {
        title: personal.title || '',
        firstName: personal.firstName,
        lastName: personal.lastName,
        dateOfBirth: personal.dateOfBirth,
        gender: personal.gender,
        nationality: personal.nationality || 'Indian',
        preferredLanguage: personal.preferredLanguage || 'English',
        profilePhoto: uploadedFiles?.profilePhoto || null
      };

      // Prepare contact details
      const contactDetails = {
        primaryPhone: contact.primaryPhone,
        secondaryPhone: contact.secondaryPhone,
        whatsappPhone: contact.whatsappPhone,
        email: contact.email,
        currentAddress: contact.currentAddress,
        permanentAddress: contact.permanentAddress || contact.currentAddress,
        sameAsCurrent: contact.sameAsCurrent !== false
      };

      // Create quick registration patient
      const patient = await prisma.patient.create({
        data: {
          hospitalId,
          patientNumber,
          mrn,
          qrCode,
          
          // Personal Information
          personalDetails,
          contactDetails,
          
          // Medical Information
          bloodGroup: personal.bloodGroup,
          
          // Status and Classification
          patientType: 'regular',
          patientStatus: 'partial_registration'
        }
      });

      return patient;
    } catch (error) {
      console.error('Error creating quick patient:', error);
      throw new Error(`Failed to create quick patient: ${error.message}`);
    }
  }

  /**
   * Complete partial registration
   */
  async completeRegistration(patientId, patientData) {
    try {
      const { medical, insurance, consent, uploadedFiles } = patientData;

      // Prepare update data
      const updateData = {
        patientStatus: 'active'
      };

      // Add medical information if provided
      if (medical) {
        updateData.allergies = medical.allergies || [];
        updateData.chronicConditions = medical.chronicConditions || [];
        updateData.familyHistory = medical.familyHistory || [];
        updateData.socialHistory = {
          smoking: medical.lifestyle?.smoking || 'Never',
          drinking: medical.lifestyle?.drinking || 'Never',
          exercise: medical.lifestyle?.exercise || 'Moderate',
          lifestyle: {
            screenTime: medical.lifestyle?.screenTime || '2-4 hours',
            eyeStrain: medical.lifestyle?.eyeStrain || 'None'
          }
        };
        updateData.medicationHistory = medical.currentMedications || [];
        updateData.surgicalHistory = medical.previousSurgeries || [];
      }

      // Add insurance information if provided
      if (insurance) {
        updateData.insuranceDetails = {
          hasInsurance: insurance.hasInsurance,
          paymentMethod: insurance.paymentMethod,
          provider: insurance.provider,
          policyNumber: insurance.policyNumber,
          policyType: insurance.policyType,
          policyHolderName: insurance.policyHolderName,
          policyHolderRelation: insurance.policyHolderRelation,
          validityDate: insurance.validityDate,
          coverageAmount: insurance.coverageAmount,
          coPaymentPercentage: insurance.coPaymentPercentage,
          tpaName: insurance.tpaName,
          requiresPreAuth: insurance.requiresPreAuth || [],
          cardImages: {
            frontImage: uploadedFiles?.insuranceCardFront || null,
            backImage: uploadedFiles?.insuranceCardBack || null
          }
        };
        updateData.emergencyContacts = insurance.emergencyContacts || [];
      }

      // Add consent information if provided
      if (consent) {
        updateData.consentStatus = {
          medicalConsent: consent.medicalConsent,
          privacyPolicy: consent.privacyPolicy,
          marketingConsent: consent.marketingConsent,
          photoVideoConsent: consent.photoVideoConsent,
          researchParticipation: consent.researchParticipation,
          otpVerified: consent.otpVerified,
          digitalSignature: consent.digitalSignature,
          abhaIdVerified: consent.abhaIdVerified
        };
        updateData.communicationPreferences = {
          appointmentReminders: consent.appointmentReminders,
          healthNewsletters: consent.healthNewsletters,
          promotionalOffers: consent.promotionalOffers
        };
        
        if (consent.abhaId) {
          updateData.abhaId = consent.abhaId;
        }
      }

      // Add documents if provided
      if (uploadedFiles) {
        const currentPatient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { identificationDocuments: true }
        });

        const existingDocs = currentPatient?.identificationDocuments || {};
        
        updateData.identificationDocuments = {
          ...existingDocs,
          governmentId: uploadedFiles.governmentId || existingDocs.governmentId,
          addressProof: uploadedFiles.addressProof || existingDocs.addressProof,
          insuranceCard: uploadedFiles.insuranceCardFront || existingDocs.insuranceCard,
          medicalRecords: [
            ...(existingDocs.medicalRecords || []),
            ...(uploadedFiles.medicalRecords || [])
          ]
        };
      }

      // Update patient record
      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: updateData
      });

      return updatedPatient;
    } catch (error) {
      console.error('Error completing registration:', error);
      throw new Error(`Failed to complete registration: ${error.message}`);
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              hospitalCode: true
            }
          }
        }
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      return patient;
    } catch (error) {
      console.error('Error getting patient:', error);
      throw new Error(`Failed to get patient: ${error.message}`);
    }
  }

  /**
   * Search patient by identifier (phone, email, patient number, QR code)
   */
  async searchPatient(identifier, hospitalId) {
    try {
      // First try to find by direct fields
      let patient = await prisma.patient.findFirst({
        where: {
          hospitalId,
          OR: [
            { patientNumber: identifier },
            { qrCode: identifier },
            { mrn: identifier },
            { abhaId: identifier }
          ]
        },
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              hospitalCode: true
            }
          }
        }
      });

      // If not found, search in JSON fields (phone, email)
      if (!patient) {
        const allPatients = await prisma.patient.findMany({
          where: { hospitalId },
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
                hospitalCode: true
              }
            }
          }
        });

        patient = allPatients.find(p => {
          const contactDetails = p.contactDetails;
          return contactDetails?.primaryPhone === identifier ||
                 contactDetails?.email === identifier ||
                 contactDetails?.secondaryPhone === identifier ||
                 contactDetails?.whatsappPhone === identifier;
        });
      }

      return patient;
    } catch (error) {
      console.error('Error searching patient:', error);
      throw new Error(`Failed to search patient: ${error.message}`);
    }
  }

  /**
   * Get all patients with pagination and filters
   */
  async getAllPatients(hospitalId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        registrationMethod,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      
      // Build where clause
      const where = {
        hospitalId,
        ...(status && { patientStatus: status })
      };

      // Build order by clause
      const orderBy = {
        [sortBy]: sortOrder
      };

      // Get patients
      const patients = await prisma.patient.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              hospitalCode: true
            }
          }
        }
      });

      // Get total count
      const total = await prisma.patient.count({ where });

      // Apply search filter if provided (post-query filtering for JSON fields)
      let filteredPatients = patients;
      if (search) {
        filteredPatients = patients.filter(patient => {
          const personalDetails = patient.personalDetails;
          const contactDetails = patient.contactDetails;
          
          const searchTerm = search.toLowerCase();
          
          return (
            patient.patientNumber?.toLowerCase().includes(searchTerm) ||
            patient.qrCode?.toLowerCase().includes(searchTerm) ||
            patient.mrn?.toLowerCase().includes(searchTerm) ||
            personalDetails?.firstName?.toLowerCase().includes(searchTerm) ||
            personalDetails?.lastName?.toLowerCase().includes(searchTerm) ||
            contactDetails?.primaryPhone?.includes(searchTerm) ||
            contactDetails?.email?.toLowerCase().includes(searchTerm)
          );
        });
      }

      return {
        patients: filteredPatients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: skip + patients.length < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all patients:', error);
      throw new Error(`Failed to get patients: ${error.message}`);
    }
  }

  /**
   * Update patient information
   */
  async updatePatient(patientId, updateData, uploadedFiles) {
    try {
      const updatePayload = { ...updateData };

      // Handle file updates
      if (uploadedFiles) {
        // Get current patient to merge documents
        const currentPatient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { 
            identificationDocuments: true,
            personalDetails: true,
            insuranceDetails: true
          }
        });

        // Update personal details with new profile photo
        if (uploadedFiles.profilePhoto) {
          const currentPersonal = currentPatient?.personalDetails || {};
          updatePayload.personalDetails = {
            ...currentPersonal,
            ...updatePayload.personalDetails,
            profilePhoto: uploadedFiles.profilePhoto
          };
        }

        // Update identification documents
        if (uploadedFiles.governmentId || uploadedFiles.addressProof || uploadedFiles.medicalRecords) {
          const existingDocs = currentPatient?.identificationDocuments || {};
          updatePayload.identificationDocuments = {
            ...existingDocs,
            ...(uploadedFiles.governmentId && { governmentId: uploadedFiles.governmentId }),
            ...(uploadedFiles.addressProof && { addressProof: uploadedFiles.addressProof }),
            ...(uploadedFiles.medicalRecords && {
              medicalRecords: [
                ...(existingDocs.medicalRecords || []),
                ...uploadedFiles.medicalRecords
              ]
            })
          };
        }

        // Update insurance card images
        if (uploadedFiles.insuranceCardFront || uploadedFiles.insuranceCardBack) {
          const currentInsurance = currentPatient?.insuranceDetails || {};
          const currentCardImages = currentInsurance.cardImages || {};
          
          updatePayload.insuranceDetails = {
            ...currentInsurance,
            ...updatePayload.insuranceDetails,
            cardImages: {
              ...currentCardImages,
              ...(uploadedFiles.insuranceCardFront && { frontImage: uploadedFiles.insuranceCardFront }),
              ...(uploadedFiles.insuranceCardBack && { backImage: uploadedFiles.insuranceCardBack })
            }
          };
        }
      }

      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: updatePayload
      });

      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error(`Failed to update patient: ${error.message}`);
    }
  }

  /**
   * Update patient status
   */
  async updatePatientStatus(patientId, status, reason) {
    try {
      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: {
          patientStatus: status,
          ...(reason && {
            // Add status change history to a JSON field
            // This could be expanded to a separate status history table
          })
        }
      });

      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient status:', error);
      throw new Error(`Failed to update patient status: ${error.message}`);
    }
  }

  /**
   * Generate new QR code for patient
   */
  async generateNewQRCode(patientId) {
    try {
      const newQRCode = this.generateQRCode();
      
      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: { qrCode: newQRCode }
      });

      return updatedPatient;
    } catch (error) {
      console.error('Error generating new QR code:', error);
      throw new Error(`Failed to generate new QR code: ${error.message}`);
    }
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats(hospitalId, startDate, endDate, groupBy = 'day') {
    try {
      // This would need to be implemented based on your specific requirements
      // For now, returning basic stats
      const totalPatients = await prisma.patient.count({
        where: { hospitalId }
      });

      const activePatients = await prisma.patient.count({
        where: { 
          hospitalId,
          patientStatus: 'active'
        }
      });

      const partialRegistrations = await prisma.patient.count({
        where: { 
          hospitalId,
          patientStatus: 'partial_registration'
        }
      });

      return {
        totalPatients,
        activePatients,
        partialRegistrations,
        completedRegistrations: activePatients
      };
    } catch (error) {
      console.error('Error getting registration stats:', error);
      throw new Error(`Failed to get registration stats: ${error.message}`);
    }
  }
}

module.exports = new PatientService();
