const crypto = require('crypto');

/**
 * Utility functions for patient management
 */

/**
 * Generate unique patient number
 */
const generatePatientNumber = async (hospitalId) => {
  try {
    // Get current date for prefix
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Generate sequential number (you might want to use database sequence)
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `PAT${year}${month}${timestamp}${random}`;
  } catch (error) {
    console.error('Error generating patient number:', error);
    return `PAT${Date.now()}`;
  }
};

/**
 * Generate Medical Record Number (MRN)
 */
const generateMRN = async (hospitalId) => {
  try {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `MRN${timestamp}${random}`;
  } catch (error) {
    console.error('Error generating MRN:', error);
    return `MRN${Date.now()}`;
  }
};

/**
 * Generate QR Code string for patient
 */
const generateQRCode = (patientNumber) => {
  try {
    // Create a unique QR code string combining patient number with random string
    const randomString = crypto.randomBytes(8).toString('hex');
    const qrString = `${patientNumber}_${randomString}`;
    
    // Encode in base64 for compactness
    return Buffer.from(qrString).toString('base64');
  } catch (error) {
    console.error('Error generating QR code:', error);
    return Buffer.from(`${patientNumber}_${Date.now()}`).toString('base64');
  }
};

/**
 * Validate patient data structure
 */
const validatePatientData = (patientData, type = 'full') => {
  const errors = [];

  // Validate personal details
  if (!patientData.personal?.firstName) {
    errors.push('First name is required');
  }
  if (!patientData.personal?.lastName) {
    errors.push('Last name is required');
  }
  if (!patientData.personal?.dateOfBirth) {
    errors.push('Date of birth is required');
  }
  if (!patientData.personal?.gender) {
    errors.push('Gender is required');
  }

  // Validate contact details
  if (!patientData.contact?.primaryPhone) {
    errors.push('Primary phone is required');
  }
  if (!patientData.contact?.currentAddress?.street) {
    errors.push('Current address is required');
  }

  // For full registration, require email
  if (type === 'full' && !patientData.contact?.email) {
    errors.push('Email is required for full registration');
  }

  // Validate consent
  if (!patientData.consent?.treatmentConsent && !patientData.consent?.medicalConsent) {
    errors.push('Treatment consent is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format patient data for display
 */
const formatPatientDisplay = (patient) => {
  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    name: `${patient.personalDetails?.firstName || ''} ${patient.personalDetails?.lastName || ''}`.trim(),
    phone: patient.contactDetails?.primaryPhone,
    email: patient.contactDetails?.email,
    dateOfBirth: patient.personalDetails?.dateOfBirth,
    gender: patient.personalDetails?.gender,
    status: patient.patientStatus,
    registrationMethod: patient.registrationMethod,
    createdAt: patient.createdAt
  };
};

/**
 * Generate patient search terms for indexing
 */
const generateSearchTerms = (patient) => {
  const terms = [];
  
  // Add name variations
  if (patient.personalDetails?.firstName) {
    terms.push(patient.personalDetails.firstName.toLowerCase());
  }
  if (patient.personalDetails?.lastName) {
    terms.push(patient.personalDetails.lastName.toLowerCase());
  }
  if (patient.personalDetails?.firstName && patient.personalDetails?.lastName) {
    terms.push(`${patient.personalDetails.firstName} ${patient.personalDetails.lastName}`.toLowerCase());
  }

  // Add contact information
  if (patient.contactDetails?.primaryPhone) {
    terms.push(patient.contactDetails.primaryPhone);
  }
  if (patient.contactDetails?.email) {
    terms.push(patient.contactDetails.email.toLowerCase());
  }

  // Add identifiers
  if (patient.patientNumber) {
    terms.push(patient.patientNumber.toLowerCase());
  }
  if (patient.mrn) {
    terms.push(patient.mrn.toLowerCase());
  }

  return [...new Set(terms)]; // Remove duplicates
};

/**
 * Calculate patient age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate Indian mobile phone number
 */
const validateIndianPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate Indian PIN code
 */
const validatePinCode = (pinCode) => {
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(pinCode);
};

/**
 * Validate email address
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate patient summary for reports
 */
const generatePatientSummary = (patient) => {
  const age = calculateAge(patient.personalDetails?.dateOfBirth);
  
  return {
    basicInfo: {
      name: `${patient.personalDetails?.firstName || ''} ${patient.personalDetails?.lastName || ''}`.trim(),
      age: age ? `${age} years` : 'N/A',
      gender: patient.personalDetails?.gender || 'N/A',
      bloodGroup: patient.personalDetails?.bloodGroup || 'N/A',
      phone: patient.contactDetails?.primaryPhone || 'N/A',
      email: patient.contactDetails?.email || 'N/A'
    },
    identifiers: {
      patientNumber: patient.patientNumber,
      mrn: patient.mrn,
      qrCode: patient.qrCode
    },
    status: {
      patientStatus: patient.patientStatus,
      registrationMethod: patient.registrationMethod,
      registrationDate: patient.createdAt
    },
    medical: {
      hasAllergies: patient.medicalHistory?.allergies?.length > 0,
      hasChronicConditions: patient.medicalHistory?.chronicConditions?.length > 0,
      hasInsurance: patient.insuranceDetails?.hasInsurance || false
    }
  };
};

module.exports = {
  generatePatientNumber,
  generateMRN,
  generateQRCode,
  validatePatientData,
  formatPatientDisplay,
  generateSearchTerms,
  calculateAge,
  validateIndianPhone,
  validatePinCode,
  validateEmail,
  generatePatientSummary
};
