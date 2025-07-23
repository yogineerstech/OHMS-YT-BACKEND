const { AbilityBuilder, Ability } = require('@casl/ability');
const { ACTIONS, SUBJECTS } = require('./permissions');

// Helper function to parse condition templates
const parseConditions = (conditions, user) => {
  if (!conditions || typeof conditions !== 'object') {
    return conditions;
  }

  const parsed = {};
  for (const [key, value] of Object.entries(conditions)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      // Parse template variables like ${user.hospitalId}
      const path = value.slice(2, -1); // Remove ${ and }
      const pathParts = path.split('.');
      let result = { user };
      
      for (const part of pathParts) {
        result = result?.[part];
      }
      
      parsed[key] = result;
    } else if (typeof value === 'object') {
      parsed[key] = parseConditions(value, user);
    } else {
      parsed[key] = value;
    }
  }
  
  return parsed;
};

// Build abilities from role permissions
const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  if (!user || !user.role) {
    // Guest permissions - very limited
    can(ACTIONS.READ, SUBJECTS.HOSPITAL, { isActive: true });
    return build();
  }

  // Get role permissions
  const rolePermissions = user.role.rolePermissions || [];

  rolePermissions.forEach(rolePermission => {
    if (!rolePermission.granted) return;

    const { permission } = rolePermission;
    const action = permission.action || ACTIONS.READ;
    const subject = permission.resource || SUBJECTS.ALL;
    
    // Parse conditions with user context
    let conditions = parseConditions(rolePermission.conditions, user);
    
    // Add default hospital restriction if not super admin
    if (user.role.roleCode !== 'SUPER_ADMIN' && !conditions?.hospitalId && user.hospitalId) {
      conditions = { ...conditions, hospitalId: user.hospitalId };
    }

    // Apply time restrictions
    if (rolePermission.timeRestrictions) {
      const now = new Date();
      const timeRestrictions = rolePermission.timeRestrictions;
      
      if (timeRestrictions.startTime && timeRestrictions.endTime) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = timeRestrictions.startTime;
        const endTime = timeRestrictions.endTime;
        
        if (currentTime < startTime || currentTime > endTime) {
          return; // Skip this permission due to time restriction
        }
      }
      
      if (timeRestrictions.allowedDays) {
        const currentDay = now.getDay();
        if (!timeRestrictions.allowedDays.includes(currentDay)) {
          return; // Skip this permission due to day restriction
        }
      }
    }

    // Apply location restrictions (if provided)
    if (rolePermission.locationRestrictions) {
      // This would need to be implemented based on your location tracking
      // For now, we'll skip location-based restrictions
    }

    // Apply data restrictions
    if (rolePermission.dataRestrictions) {
      conditions = { ...conditions, ...rolePermission.dataRestrictions };
    }

    // Check if permission is expired
    if (rolePermission.expiresAt && new Date() > rolePermission.expiresAt) {
      return; // Skip expired permission
    }

    // Grant the permission
    if (conditions && Object.keys(conditions).length > 0) {
      can(action, subject, conditions);
    } else {
      can(action, subject);
    }
  });

  // Emergency access for specific roles
  if (['DOCTOR', 'HEAD_DOCTOR', 'NURSE', 'HEAD_NURSE'].includes(user.role.roleCode)) {
    can(ACTIONS.EMERGENCY_ACCESS, SUBJECTS.PATIENT, { hospitalId: user.hospitalId });
    can(ACTIONS.READ, SUBJECTS.PATIENT_VISIT, { hospitalId: user.hospitalId, status: 'emergency' });
  }

  return build();
};

// Check if user has specific permission
const checkPermission = (ability, action, subject, conditions = {}) => {
  return ability.can(action, subject, conditions);
};

// Middleware to check abilities
const requireAbility = (action, subject, getConditions) => {
  return (req, res, next) => {
    const ability = req.ability;
    
    if (!ability) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    let conditions = {};
    if (typeof getConditions === 'function') {
      conditions = getConditions(req);
    } else if (getConditions) {
      conditions = getConditions;
    }

    if (!checkPermission(ability, action, subject, conditions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: { action, subject, conditions }
      });
    }

    next();
  };
};

// Filter data based on abilities
const filterDataByAbility = (ability, action, data, subject) => {
  if (!Array.isArray(data)) {
    return ability.can(action, subject, data) ? data : null;
  }

  return data.filter(item => ability.can(action, subject, item));
};

// Get accessible fields for a subject
const getAccessibleFields = (ability, action, subject) => {
  const rules = ability.rulesFor(action, subject);
  const accessibleFields = new Set();

  rules.forEach(rule => {
    if (rule.fields) {
      rule.fields.forEach(field => accessibleFields.add(field));
    }
  });

  return Array.from(accessibleFields);
};

// Apply field-level permissions
const applyFieldPermissions = (ability, action, subject, data) => {
  const accessibleFields = getAccessibleFields(ability, action, subject);
  
  if (accessibleFields.length === 0) {
    return data; // No field restrictions
  }

  if (Array.isArray(data)) {
    return data.map(item => {
      const filtered = {};
      accessibleFields.forEach(field => {
        if (item.hasOwnProperty(field)) {
          filtered[field] = item[field];
        }
      });
      return filtered;
    });
  } else {
    const filtered = {};
    accessibleFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        filtered[field] = data[field];
      }
    });
    return filtered;
  }
};

module.exports = {
  ACTIONS,
  SUBJECTS,
  defineAbilitiesFor,
  checkPermission,
  requireAbility,
  filterDataByAbility,
  getAccessibleFields,
  applyFieldPermissions,
  parseConditions
};