const superAdminService = require('../../services/superadmin.service');
const { defineAbilitiesFor } = require('../../config/casl');

/**
 * Initial super admin setup - only works if no super admin exists
 */
const initialSetup = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      confirmPassword,
      phone 
    } = req.body;
    console.log('Initial setup request:', req.body);
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required'
      });
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const { user, tokens } = await superAdminService.createInitialSuperAdmin({
      firstName,
      lastName,
      email,
      password,
      phone
    }, ipAddress, userAgent);

    // Generate abilities
    const abilities = defineAbilitiesFor(user);

    // Remove sensitive data
    const { personalDetails, ...userWithoutSensitive } = user;
    const safePersonalDetails = {
      firstName: personalDetails?.firstName,
      lastName: personalDetails?.lastName,
      email: personalDetails?.email,
      phone: personalDetails?.phone
    };

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      data: {
        user: {
          ...userWithoutSensitive,
          personalDetails: safePersonalDetails
        },
        tokens,
        permissions: abilities.rules
      }
    });

  } catch (error) {
    if (error.message === 'Super admin already exists') {
      return res.status(409).json({
        success: false,
        message: 'Super admin already exists. Use login instead.'
      });
    }

    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create super admin',
      error: error.message
    });
  }
};

module.exports = initialSetup;