const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

// Define abilities based on user role and permissions
const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (!user) {
    // Guest permissions
    can('read', 'public');
    return build();
  }

  // Check if user is SuperAdmin (add this check)
  if (user.userType === 'super_admin' || (user.email && !user.role) || user.roleCode === 'SUPER_ADMIN') {
    // Super Admin has all permissions across all hospitals
    can('manage', 'all');
    return build();
  }

  // Rest of your existing code...
  // Regular staff permissions
  if (!user.role) {
    can('read', 'public');
    return build();
  }

  const permissions = user.role.rolePermissions || [];
  const permissionCodes = permissions.map(rp => rp.permission.permissionCode);

  // Hospital Admin permissions - scoped to their hospital
  if (user.role.roleCode === 'HOSPITAL_ADMIN') {
    can('manage', 'Hospital', { id: user.hospitalId });
    can('manage', 'Staff', { hospitalId: user.hospitalId });
    can('manage', 'Department', { hospitalId: user.hospitalId });
    can('manage', 'Role', { hospitalSpecific: true });
    can('manage', 'Patient', { hospitalId: user.hospitalId });
    can('manage', 'PatientVisit', { hospitalId: user.hospitalId });
    can('manage', 'Examination', { hospitalId: user.hospitalId });
    can('manage', 'Diagnosis', { hospitalId: user.hospitalId });
    can('manage', 'Room', { hospitalId: user.hospitalId });
    can('manage', 'Bed', { hospitalId: user.hospitalId });
    can('manage', 'Ward', { hospitalId: user.hospitalId });
    can('manage', 'Floor', { hospitalId: user.hospitalId });
    can('read', 'ExaminationTemplate', { hospitalId: user.hospitalId });
    can('create', 'ExaminationTemplate', { hospitalId: user.hospitalId });
    can('update', 'ExaminationTemplate', { hospitalId: user.hospitalId });
  }

  // Doctor permissions - scoped to their hospital
  if (user.role.roleCode === 'DOCTOR') {
    // Patient access within their hospital
    can('read', 'Patient', { hospitalId: user.hospitalId });
    can('update', 'Patient', { hospitalId: user.hospitalId });
    
    // Patient visits within their hospital
    can('read', 'PatientVisit', { hospitalId: user.hospitalId });
    can('create', 'PatientVisit', { hospitalId: user.hospitalId });
    can('update', 'PatientVisit', { 
      hospitalId: user.hospitalId,
      attendingPhysicianId: user.id 
    });
    
    // Examinations within their hospital
    can('read', 'Examination', { hospitalId: user.hospitalId });
    can('create', 'Examination', { hospitalId: user.hospitalId });
    can('update', 'Examination', { 
      hospitalId: user.hospitalId,
      doctorId: user.id 
    });
    
    // Diagnoses within their hospital
    can('read', 'Diagnosis', { hospitalId: user.hospitalId });
    can('create', 'Diagnosis', { hospitalId: user.hospitalId });
    can('update', 'Diagnosis', { 
      hospitalId: user.hospitalId,
      doctorId: user.id 
    });
    
    // Hospital resources access
    can('read', 'Department', { hospitalId: user.hospitalId });
    can('read', 'Room', { hospitalId: user.hospitalId });
    can('read', 'Bed', { hospitalId: user.hospitalId });
    can('read', 'Ward', { hospitalId: user.hospitalId });
    can('read', 'Staff', { hospitalId: user.hospitalId });
    can('read', 'ExaminationTemplate', { hospitalId: user.hospitalId });
    
    // Can update beds for patient assignment
    can('update', 'Bed', { 
      hospitalId: user.hospitalId,
      patientId: { $exists: true } // Only if bed has a patient
    });
  }

  // Nurse permissions - scoped to their hospital
  if (user.role.roleCode === 'NURSE') {
    // Patient access within their hospital
    can('read', 'Patient', { hospitalId: user.hospitalId });
    can('update', 'Patient', { 
      hospitalId: user.hospitalId,
      // Only basic info updates
      $select: ['personalDetails', 'contactDetails', 'preferences']
    });
    
    // Patient visits within their hospital
    can('read', 'PatientVisit', { hospitalId: user.hospitalId });
    can('update', 'PatientVisit', { 
      hospitalId: user.hospitalId,
      status: { $in: ['in_progress', 'awaiting_discharge', 'discharged'] }
    });
    
    // Examinations - read only within their hospital
    can('read', 'Examination', { hospitalId: user.hospitalId });
    
    // Hospital resources access
    can('read', 'Department', { hospitalId: user.hospitalId });
    can('read', 'Room', { hospitalId: user.hospitalId });
    can('read', 'Bed', { hospitalId: user.hospitalId });
    can('read', 'Ward', { hospitalId: user.hospitalId });
    can('read', 'Staff', { hospitalId: user.hospitalId });
    
    // Bed management within their hospital and department
    can('update', 'Bed', { 
      hospitalId: user.hospitalId,
      departmentId: user.departmentId
    });
  }

  // Reception/Front Desk permissions - scoped to their hospital
  if (user.role.roleCode === 'RECEPTIONIST') {
    // Patient registration and basic info
    can('read', 'Patient', { hospitalId: user.hospitalId });
    can('create', 'Patient', { hospitalId: user.hospitalId });
    can('update', 'Patient', { 
      hospitalId: user.hospitalId,
      $select: ['personalDetails', 'contactDetails', 'insuranceDetails']
    });
    
    // Patient visits management
    can('read', 'PatientVisit', { hospitalId: user.hospitalId });
    can('create', 'PatientVisit', { hospitalId: user.hospitalId });
    can('update', 'PatientVisit', { 
      hospitalId: user.hospitalId,
      status: { $in: ['registered', 'waiting', 'checked_in'] }
    });
    
    // Hospital resources for scheduling
    can('read', 'Department', { hospitalId: user.hospitalId });
    can('read', 'Room', { hospitalId: user.hospitalId });
    can('read', 'Bed', { hospitalId: user.hospitalId });
    can('read', 'Staff', { 
      hospitalId: user.hospitalId,
      $select: ['personalDetails', 'department', 'role']
    });
  }

  // Lab Technician permissions - scoped to their hospital
  if (user.role.roleCode === 'LAB_TECHNICIAN') {
    // Patient access for lab work
    can('read', 'Patient', { 
      hospitalId: user.hospitalId,
      $select: ['personalDetails', 'medicalHistory', 'allergies']
    });
    
    // Lab-related examinations
    can('read', 'Examination', { 
      hospitalId: user.hospitalId,
      examinationType: { $in: ['laboratory', 'diagnostic'] }
    });
    can('update', 'Examination', { 
      hospitalId: user.hospitalId,
      examinationType: { $in: ['laboratory', 'diagnostic'] },
      status: 'in_progress'
    });
    
    can('read', 'PatientVisit', { hospitalId: user.hospitalId });
  }

  // Pharmacist permissions - scoped to their hospital
  if (user.role.roleCode === 'PHARMACIST') {
    // Patient medication history
    can('read', 'Patient', { 
      hospitalId: user.hospitalId,
      $select: ['personalDetails', 'medicationHistory', 'allergies']
    });
    
    can('read', 'PatientVisit', { hospitalId: user.hospitalId });
    can('read', 'Examination', { hospitalId: user.hospitalId });
    can('read', 'Diagnosis', { hospitalId: user.hospitalId });
  }

  // Department Head permissions - scoped to their hospital and department
  if (user.role.roleCode === 'DEPARTMENT_HEAD') {
    // Full access to their department
    can('manage', 'Department', { 
      hospitalId: user.hospitalId,
      id: user.departmentId 
    });
    
    // Staff in their department
    can('manage', 'Staff', { 
      hospitalId: user.hospitalId,
      departmentId: user.departmentId 
    });
    
    // Department resources
    can('manage', 'Room', { 
      hospitalId: user.hospitalId,
      departmentId: user.departmentId 
    });
    can('manage', 'Bed', { 
      hospitalId: user.hospitalId,
      departmentId: user.departmentId 
    });
    
    // Patient care within department
    can('read', 'Patient', { hospitalId: user.hospitalId });
    can('read', 'PatientVisit', { hospitalId: user.hospitalId });
    can('read', 'Examination', { hospitalId: user.hospitalId });
    can('read', 'Diagnosis', { hospitalId: user.hospitalId });
    
    // Department-specific examination templates
    can('manage', 'ExaminationTemplate', { 
      hospitalId: user.hospitalId,
      departmentId: user.departmentId 
    });
  }

  // Department-specific permissions for all staff
  if (user.departmentId) {
    can('read', 'Department', { 
      hospitalId: user.hospitalId,
      id: user.departmentId 
    });
    can('read', 'Staff', { 
      hospitalId: user.hospitalId,
      departmentId: user.departmentId 
    });
    can('read', 'ExaminationTemplate', { 
      hospitalId: user.hospitalId,
      departmentId: user.departmentId 
    });
  }

  // Apply permission-based rules with hospital scope
  permissionCodes.forEach(permissionCode => {
    const [action, resource] = permissionCode.split('_');
    if (action && resource) {
      // Add hospital scope to all permissions except super admin
      if (user.hospitalId) {
        can(action.toLowerCase(), resource, { hospitalId: user.hospitalId });
      } else {
        can(action.toLowerCase(), resource);
      }
    }
  });

  return build();
};

module.exports = { defineAbilitiesFor };