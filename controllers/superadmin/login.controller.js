const superAdminService = require('../../services/superadmin.service');
const { defineAbilitiesFor } = require('../../config/casl');

/**
 * Super admin login with additional security checks
 */
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Authenticate and verify super admin role
    const { user, tokens } = await superAdminService.authenticateSuperAdmin(
      email, 
      password, 
      ipAddress, 
      userAgent
    );

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

    // Set HTTP-only cookie for refresh token if remember me is selected
    if (rememberMe) {
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json({
      success: true,
      message: 'Super admin login successful',
      data: {
        user: {
          ...userWithoutSensitive,
          personalDetails: safePersonalDetails
        },
        tokens: {
          accessToken: tokens.accessToken,
          expiresAt: tokens.expiresAt,
          ...(rememberMe ? {} : { refreshToken: tokens.refreshToken })
        },
        permissions: abilities.rules
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Super admin login failed',
      error: error.message
    });
  }
};

module.exports = login;