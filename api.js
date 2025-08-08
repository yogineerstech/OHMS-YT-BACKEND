// Frontend API Client for Hospital Management System
// This file contains all API calls organized by modules

const API_BASE_URL =  'http://localhost:3000';

// Utility function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

// Utility function for FormData requests (file uploads)
const apiFormDataRequest = async (endpoint, formData, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type for FormData, let browser set it with boundary
      ...options.headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

// ============================================================================
// PATIENT API ENDPOINTS
// ============================================================================
export const patientAPI = {
  // Patient Registration
  register: (registrationData, files = {}) => {
    const formData = new FormData();
    
    // Add JSON data
    if (registrationData.personal) formData.append('personal', JSON.stringify(registrationData.personal));
    if (registrationData.contact) formData.append('contact', JSON.stringify(registrationData.contact));
    if (registrationData.medical) formData.append('medical', JSON.stringify(registrationData.medical));
    if (registrationData.insurance) formData.append('insurance', JSON.stringify(registrationData.insurance));
    if (registrationData.consent) formData.append('consent', JSON.stringify(registrationData.consent));
    
    // Add files
    if (files.profilePhoto) formData.append('profilePhoto', files.profilePhoto);
    if (files.governmentId) formData.append('governmentId', files.governmentId);
    if (files.addressProof) formData.append('addressProof', files.addressProof);
    if (files.insuranceCardFront) formData.append('insuranceCardFront', files.insuranceCardFront);
    if (files.insuranceCardBack) formData.append('insuranceCardBack', files.insuranceCardBack);
    if (files.medicalRecords) {
      if (Array.isArray(files.medicalRecords)) {
        files.medicalRecords.forEach(file => formData.append('medicalRecords', file));
      } else {
        formData.append('medicalRecords', files.medicalRecords);
      }
    }
    
    return apiFormDataRequest('/api/patients/register', formData);
  },

  // Quick Registration
  quickRegister: (registrationData, files = {}) => {
    const formData = new FormData();
    
    // Add JSON data
    if (registrationData.personal) formData.append('personal', JSON.stringify(registrationData.personal));
    if (registrationData.contact) formData.append('contact', JSON.stringify(registrationData.contact));
    if (registrationData.consent) formData.append('consent', JSON.stringify(registrationData.consent));
    
    // Add files (optional for quick registration)
    if (files.profilePhoto) formData.append('profilePhoto', files.profilePhoto);
    
    return apiFormDataRequest('/api/patients/register/quick', formData);
  },

  // Complete Registration
  completeRegistration: (patientId, registrationData, files = {}) => {
    const formData = new FormData();
    
    // Add JSON data
    if (registrationData.medical) formData.append('medical', JSON.stringify(registrationData.medical));
    if (registrationData.insurance) formData.append('insurance', JSON.stringify(registrationData.insurance));
    
    // Add files
    if (files.governmentId) formData.append('governmentId', files.governmentId);
    if (files.addressProof) formData.append('addressProof', files.addressProof);
    if (files.insuranceCardFront) formData.append('insuranceCardFront', files.insuranceCardFront);
    if (files.insuranceCardBack) formData.append('insuranceCardBack', files.insuranceCardBack);
    if (files.medicalRecords) {
      if (Array.isArray(files.medicalRecords)) {
        files.medicalRecords.forEach(file => formData.append('medicalRecords', file));
      } else {
        formData.append('medicalRecords', files.medicalRecords);
      }
    }
    
    return apiFormDataRequest(`/api/patients/${patientId}/complete`, formData, { method: 'PUT' });
  },

  // Search Patient
  searchPatient: (identifier) => 
    apiRequest(`/api/patients/search/${encodeURIComponent(identifier)}`),

  // Verify ABHA ID
  verifyABHA: (abhaId) => 
    apiRequest('/api/patients/verify-abha', {
      method: 'POST',
      body: JSON.stringify({ abhaId }),
    }),

  // OTP Operations
  sendOTP: (phone, email) => 
    apiRequest('/api/patients/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, email }),
    }),

  verifyOTP: (phone, otp) => 
    apiRequest('/api/patients/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  // Patient CRUD Operations
  getAllPatients: (queryParams = {}) => {
    const searchParams = new URLSearchParams(queryParams);
    return apiRequest(`/api/patients?${searchParams.toString()}`);
  },

  getPatientById: (patientId) => 
    apiRequest(`/api/patients/${patientId}`),

  updatePatient: (patientId, updateData, files = {}) => {
    const formData = new FormData();
    
    // Add JSON data
    Object.keys(updateData).forEach(key => {
      if (typeof updateData[key] === 'object') {
        formData.append(key, JSON.stringify(updateData[key]));
      } else {
        formData.append(key, updateData[key]);
      }
    });
    
    // Add files
    Object.keys(files).forEach(key => {
      if (files[key]) {
        if (Array.isArray(files[key])) {
          files[key].forEach(file => formData.append(key, file));
        } else {
          formData.append(key, files[key]);
        }
      }
    });
    
    return apiFormDataRequest(`/api/patients/${patientId}`, formData, { method: 'PUT' });
  },

  // Patient Documents
  getPatientDocuments: (patientId) => 
    apiRequest(`/api/patients/${patientId}/documents`),

  addPatientDocuments: (patientId, files) => {
    const formData = new FormData();
    
    Object.keys(files).forEach(key => {
      if (files[key]) {
        if (Array.isArray(files[key])) {
          files[key].forEach(file => formData.append(key, file));
        } else {
          formData.append(key, files[key]);
        }
      }
    });
    
    return apiFormDataRequest(`/api/patients/${patientId}/documents`, formData);
  },

  deletePatientDocument: (patientId, documentType) => 
    apiRequest(`/api/patients/${patientId}/documents/${documentType}`, {
      method: 'DELETE',
    }),

  // QR Code Operations
  generateNewQRCode: (patientId) => 
    apiRequest(`/api/patients/${patientId}/generate-qr`, {
      method: 'POST',
    }),

  getQRCodeImage: (patientId) => 
    apiRequest(`/api/patients/${patientId}/qr-code`),

  // Patient Status
  updatePatientStatus: (patientId, status, reason) => 
    apiRequest(`/api/patients/${patientId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  // Statistics and Reports
  getRegistrationStats: (queryParams = {}) => {
    const searchParams = new URLSearchParams(queryParams);
    return apiRequest(`/api/patients/stats/registration?${searchParams.toString()}`);
  },

  getPatientVisitsSummary: (patientId) => 
    apiRequest(`/api/patients/${patientId}/visits-summary`),

  // Bulk Operations
  bulkImportPatients: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFormDataRequest('/api/patients/bulk-import', formData);
  },

  exportPatients: (queryParams = {}) => {
    const searchParams = new URLSearchParams(queryParams);
    return apiRequest(`/api/patients/export?${searchParams.toString()}`);
  },

  // Merge Patient Records
  mergePatientRecords: (patientId, targetPatientId) => 
    apiRequest(`/api/patients/${patientId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ targetPatientId }),
    }),
};

// ============================================================================
// SUPER ADMIN API ENDPOINTS
// ============================================================================
export const superAdminAPI = {
  // Authentication
  checkSuperAdminExists: () => 
    apiRequest('/api/superadmin/exists'),

  setupSuperAdmin: (setupData) => 
    apiRequest('/api/superadmin/setup', {
      method: 'POST',
      body: JSON.stringify(setupData),
    }),

  login: (credentials) => 
    apiRequest('/api/superadmin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // System Management
  getSystemStats: () => 
    apiRequest('/api/superadmin/stats'),

  getSystemLogs: (queryParams = {}) => {
    const searchParams = new URLSearchParams(queryParams);
    return apiRequest(`/api/superadmin/logs?${searchParams.toString()}`);
  },

  // Hospital Network Management
  createHospitalNetwork: (networkData) => 
    apiRequest('/api/superadmin/networks', {
      method: 'POST',
      body: JSON.stringify(networkData),
    }),

  getHospitalNetworks: () => 
    apiRequest('/api/superadmin/networks'),

  // Hospital Management
  createHospital: (hospitalData) => 
    apiRequest('/api/superadmin/hospitals', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    }),

  getAllHospitals: () => 
    apiRequest('/api/superadmin/hospitals'),

  getHospitalById: (hospitalId) => 
    apiRequest(`/api/superadmin/hospitals/${hospitalId}`),

  updateHospital: (hospitalId, updateData) => 
    apiRequest(`/api/superadmin/hospitals/${hospitalId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  toggleHospitalStatus: (hospitalId, status) => 
    apiRequest(`/api/superadmin/hospitals/${hospitalId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Hospital Admin Management
  createHospitalAdmin: (hospitalId, adminData) => 
    apiRequest(`/api/superadmin/hospitals/${hospitalId}/admins`, {
      method: 'POST',
      body: JSON.stringify(adminData),
    }),

  getHospitalAdmins: (hospitalId) => 
    apiRequest(`/api/superadmin/hospitals/${hospitalId}/admins`),

  resetHospitalAdminPassword: (hospitalId, adminId, newPassword) => 
    apiRequest(`/api/superadmin/hospitals/${hospitalId}/admins/${adminId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  deactivateHospitalAdmin: (hospitalId, adminId, reason) => 
    apiRequest(`/api/superadmin/hospitals/${hospitalId}/admins/${adminId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============================================================================
// HOSPITAL ADMIN API ENDPOINTS
// ============================================================================
export const hospitalAdminAPI = {
  // Authentication
  login: (credentials) => 
    apiRequest('/api/hospital-admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () => 
    apiRequest('/api/hospital-admin/logout', {
      method: 'POST',
    }),

  logoutAll: () => 
    apiRequest('/api/hospital-admin/logout-all', {
      method: 'POST',
    }),

  refreshToken: (refreshToken) => 
    apiRequest('/api/hospital-admin/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  // Profile Management
  getProfile: () => 
    apiRequest('/api/hospital-admin/profile'),

  getSessions: () => 
    apiRequest('/api/hospital-admin/sessions'),

  changePassword: (passwordData) => 
    apiRequest('/api/hospital-admin/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }),

  verifyToken: () => 
    apiRequest('/api/hospital-admin/verify-token'),

  // Staff Management
  createStaff: (staffData) => 
    apiRequest('/api/hospital-admin/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    }),

  getAllStaff: (queryParams = {}) => {
    const searchParams = new URLSearchParams(queryParams);
    return apiRequest(`/api/hospital-admin/staff?${searchParams.toString()}`);
  },

  getStaffById: (staffId) => 
    apiRequest(`/api/hospital-admin/staff/${staffId}`),

  updateStaff: (staffId, updateData) => 
    apiRequest(`/api/hospital-admin/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  resetStaffPassword: (staffId, passwordData) => 
    apiRequest(`/api/hospital-admin/staff/${staffId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }),

  deactivateStaff: (staffId, reason) => 
    apiRequest(`/api/hospital-admin/staff/${staffId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  getStaffStatistics: () => 
    apiRequest('/api/hospital-admin/staff/statistics'),

  getAvailableRoles: () => 
    apiRequest('/api/hospital-admin/staff/roles'),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const utilityAPI = {
  // Health Check
  healthCheck: () => 
    apiRequest('/api/health'),

  // File Download Helper
  downloadFile: async (url, filename) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Image Preview Helper
  getImagePreviewUrl: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

// ============================================================================
// AUTH HELPERS
// ============================================================================
export const authHelpers = {
  // Token Management
  setAuthToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },

  removeAuthToken: () => {
    localStorage.removeItem('authToken');
  },

  // User Info Management
  setUserInfo: (userInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },

  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  removeUserInfo: () => {
    localStorage.removeItem('userInfo');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Clear all auth data
  clearAuthData: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
  },
};

// ============================================================================
// ERROR HANDLERS
// ============================================================================
export const errorHandlers = {
  // Handle API errors
  handleApiError: (error) => {
    console.error('API Error:', error);
    
    // Handle different types of errors
    if (error.message.includes('401')) {
      // Unauthorized - redirect to login
      authHelpers.clearAuthData();
      window.location.href = '/login';
      return 'Session expired. Please login again.';
    } else if (error.message.includes('403')) {
      return 'You do not have permission to perform this action.';
    } else if (error.message.includes('404')) {
      return 'Resource not found.';
    } else if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  },

  // Show error notification
  showError: (error) => {
    const message = errorHandlers.handleApiError(error);
    // You can integrate with your preferred notification library here
    console.error('Error:', message);
    return message;
  },
};

// Default export with all APIs
export default {
  patientAPI,
  superAdminAPI,
  hospitalAdminAPI,
  utilityAPI,
  authHelpers,
  errorHandlers,
};