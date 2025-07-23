
// Define all possible actions in the system
const ACTIONS = {
  // CRUD Operations
  CREATE: 'create',
  READ: 'read', 
  UPDATE: 'update',
  DELETE: 'delete',
  
  // Special Operations
  MANAGE: 'manage', // Can do everything
  APPROVE: 'approve',
  REJECT: 'reject',
  ASSIGN: 'assign',
  UNASSIGN: 'unassign',
  TRANSFER: 'transfer',
  DISCHARGE: 'discharge',
  ADMIT: 'admit',
  
  // Sensitive Operations
  VIEW_SENSITIVE: 'view_sensitive',
  EDIT_SENSITIVE: 'edit_sensitive',
  EXPORT: 'export',
  IMPORT: 'import',
  BACKUP: 'backup',
  RESTORE: 'restore',
  
  // Administrative
  AUDIT: 'audit',
  CONFIGURE: 'configure',
  MONITOR: 'monitor',
  REPORT: 'report',
  
  // Medical Operations
  DIAGNOSE: 'diagnose',
  PRESCRIBE: 'prescribe',
  EXAMINE: 'examine',
  OPERATE: 'operate',
  COUNSEL: 'counsel',
  
  // Financial Operations
  BILL: 'bill',
  COLLECT_PAYMENT: 'collect_payment',
  REFUND: 'refund',
  VIEW_FINANCIALS: 'view_financials',
  
  // Emergency Operations
  EMERGENCY_ACCESS: 'emergency_access',
  OVERRIDE: 'override'
};

// Define all subjects/resources in the system
const SUBJECTS = {
  // General
  ALL: 'all',
  
  // Core Entities
  HOSPITAL: 'Hospital',
  HOSPITAL_NETWORK: 'HospitalNetwork',
  DEPARTMENT: 'Department',
  FLOOR: 'Floor',
  ROOM: 'Room',
  BED: 'Bed',
  WARD: 'Ward',
  
  // People
  PATIENT: 'Patient',
  STAFF: 'Staff',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  USER: 'User',
  
  // Medical Records
  PATIENT_VISIT: 'PatientVisit',
  EXAMINATION: 'Examination',
  EXAMINATION_TEMPLATE: 'ExaminationTemplate',
  DIAGNOSIS: 'Diagnosis',
  DISEASE: 'Disease',
  MEDICAL_RECORD: 'MedicalRecord',
  
  // Laboratory & Imaging
  LAB_RESULT: 'LabResult',
  RADIOLOGY_RESULT: 'RadiologyResult',
  PATHOLOGY_RESULT: 'PathologyResult',
  
  // Pharmacy
  MEDICATION: 'Medication',
  PRESCRIPTION: 'Prescription',
  PHARMACY_INVENTORY: 'PharmacyInventory',
  
  // Billing & Finance
  BILL: 'Bill',
  PAYMENT: 'Payment',
  INSURANCE: 'Insurance',
  FINANCIAL_REPORT: 'FinancialReport',
  
  // Administration
  ROLE: 'Role',
  PERMISSION: 'Permission',
  ROLE_PERMISSION: 'RolePermission',
  USER_SESSION: 'UserSession',
  AUDIT_LOG: 'AuditLog',
  CONFIGURATION: 'Configuration',
  
  // Inventory
  INVENTORY: 'Inventory',
  EQUIPMENT: 'Equipment',
  SUPPLY: 'Supply',
  
  // Scheduling
  APPOINTMENT: 'Appointment',
  SCHEDULE: 'Schedule',
  SHIFT: 'Shift',
  
  // Reports
  REPORT: 'Report',
  DASHBOARD: 'Dashboard',
  ANALYTICS: 'Analytics',
  
  // Emergency
  EMERGENCY: 'Emergency',
  TRAUMA: 'Trauma',
  
  // Quality & Compliance
  QUALITY_METRIC: 'QualityMetric',
  COMPLIANCE_RECORD: 'ComplianceRecord',
  INCIDENT_REPORT: 'IncidentReport'
};

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  PATIENT_CARE: 'Patient Care',
  MEDICAL_RECORDS: 'Medical Records',
  ADMINISTRATION: 'Administration',
  FINANCIAL: 'Financial',
  INVENTORY: 'Inventory Management',
  REPORTING: 'Reporting & Analytics',
  SECURITY: 'Security & Access',
  QUALITY: 'Quality & Compliance',
  EMERGENCY: 'Emergency Operations',
  SYSTEM: 'System Management'
};

// Default permission sets for common roles
const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    permissions: [
      { action: ACTIONS.MANAGE, subject: SUBJECTS.ALL }
    ]
  },
  
  HOSPITAL_ADMIN: {
    permissions: [
      { action: ACTIONS.MANAGE, subject: SUBJECTS.HOSPITAL, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.DEPARTMENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.STAFF, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.ROOM, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.BED, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.VIEW_FINANCIALS, subject: SUBJECTS.FINANCIAL_REPORT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CONFIGURE, subject: SUBJECTS.CONFIGURATION, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  },
  
  DOCTOR: {
    permissions: [
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CREATE, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.EXAMINATION, conditions: { doctorId: '${user.id}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.DIAGNOSIS, conditions: { doctorId: '${user.id}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.DIAGNOSIS, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.PATIENT_VISIT, conditions: { attendingPhysicianId: '${user.id}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.PRESCRIBE, subject: SUBJECTS.MEDICATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.LAB_RESULT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.RADIOLOGY_RESULT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.STAFF, conditions: { id: '${user.id}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.STAFF, conditions: { id: '${user.id}' } }
    ]
  },
  
  HEAD_DOCTOR: {
    permissions: [
      // All doctor permissions plus department management
      { action: ACTIONS.MANAGE, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.DIAGNOSIS, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.APPROVE, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.STAFF, conditions: { hospitalId: '${user.hospitalId}', departmentId: '${user.departmentId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.DEPARTMENT, conditions: { id: '${user.departmentId}' } },
      { action: ACTIONS.PRESCRIBE, subject: SUBJECTS.MEDICATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.LAB_RESULT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.RADIOLOGY_RESULT, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  },
  
  NURSE: {
    permissions: [
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.BED, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.BED, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.WARD, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.DIAGNOSIS, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.MEDICATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.STAFF, conditions: { id: '${user.id}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.STAFF, conditions: { id: '${user.id}' } }
    ]
  },
  
  HEAD_NURSE: {
    permissions: [
      // All nurse permissions plus ward management
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.BED, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.WARD, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.DIAGNOSIS, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.MEDICATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.STAFF, conditions: { hospitalId: '${user.hospitalId}', departmentId: '${user.departmentId}' } },
      { action: ACTIONS.ASSIGN, subject: SUBJECTS.STAFF, conditions: { hospitalId: '${user.hospitalId}', departmentId: '${user.departmentId}' } }
    ]
  },
  
  RECEPTIONIST: {
    permissions: [
      { action: ACTIONS.CREATE, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CREATE, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.PATIENT_VISIT, conditions: { status: 'registered' } },
      { action: ACTIONS.READ, subject: SUBJECTS.ROOM, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.BED, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.APPOINTMENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CREATE, subject: SUBJECTS.APPOINTMENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.APPOINTMENT, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  },
  
  LAB_TECHNICIAN: {
    permissions: [
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CREATE, subject: SUBJECTS.LAB_RESULT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.LAB_RESULT, conditions: { hospitalId: '${user.hospitalId}', technicalId: '${user.id}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.LAB_RESULT, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  },
  
  RADIOLOGIST: {
    permissions: [
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CREATE, subject: SUBJECTS.RADIOLOGY_RESULT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.RADIOLOGY_RESULT, conditions: { hospitalId: '${user.hospitalId}', radiologistId: '${user.id}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.RADIOLOGY_RESULT, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  },
  
  PHARMACIST: {
    permissions: [
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.EXAMINATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.DIAGNOSIS, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PRESCRIPTION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.UPDATE, subject: SUBJECTS.PRESCRIPTION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.PHARMACY_INVENTORY, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.MEDICATION, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  },
  
  BILLING_CLERK: {
    permissions: [
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PATIENT_VISIT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.BILL, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CREATE, subject: SUBJECTS.PAYMENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.PAYMENT, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.INSURANCE, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  },
  
  IT_ADMIN: {
    permissions: [
      { action: ACTIONS.MANAGE, subject: SUBJECTS.STAFF, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.ROLE, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.PERMISSION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.MANAGE, subject: SUBJECTS.USER_SESSION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.READ, subject: SUBJECTS.AUDIT_LOG, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.CONFIGURE, subject: SUBJECTS.CONFIGURATION, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.BACKUP, subject: SUBJECTS.ALL, conditions: { hospitalId: '${user.hospitalId}' } },
      { action: ACTIONS.RESTORE, subject: SUBJECTS.ALL, conditions: { hospitalId: '${user.hospitalId}' } }
    ]
  }
};

module.exports = {
  ACTIONS,
  SUBJECTS,
  PERMISSION_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS
};