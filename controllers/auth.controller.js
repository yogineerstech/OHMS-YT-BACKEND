const passport = require('../config/passport');
const authService = require('../services/auth.service');
const { defineAbilitiesFor } = require('../config/casl');

class AuthController {
  /**
   * User login
   */
  async login(req, res, next) {
    try {
      const { email, password, rememberMe = false } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Authenticate user
      const { user, tokens } = await authService.authenticateUser(
        email, 
        password, 
        ipAddress, 
        userAgent
      );

      // Generate abilities for response
      const abilities = defineAbilitiesFor(user);

      // Remove sensitive data
      const { personalDetails, employmentDetails, ...userWithoutSensitive } = user;
      const safePersonalDetails = {
        firstName: personalDetails?.firstName,
        lastName: personalDetails?.lastName,
        email: personalDetails?.email,
        phone: personalDetails?.phone
      };

      const safeEmploymentDetails = {
        employmentType: employmentDetails?.employmentType,
        employmentStatus: employmentDetails?.employmentStatus,
        joiningDate: employmentDetails?.joiningDate
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
        message: 'Login successful',
        data: {
          user: {
            ...userWithoutSensitive,
            personalDetails: safePersonalDetails,
            employmentDetails: safeEmploymentDetails
          },
          tokens: {
            accessToken: tokens.accessToken,
            expiresAt: tokens.expiresAt,
            // Don't send refresh token in response if remember me is selected
            ...(rememberMe ? {} : { refreshToken: tokens.refreshToken })
          },
          permissions: abilities.rules
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * User logout
   */
  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let loggedOut = false;

      if (token) {
        loggedOut = await authService.logout(req.user.id, token);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful',
        data: { sessionTerminated: loggedOut }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(req, res, next) {
    try {
      const terminatedSessions = await authService.logoutAll(req.user.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logged out from all devices',
        data: { terminatedSessions }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout all failed',
        error: error.message
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res, next) {
    try {
      let refreshToken = req.body.refreshToken;
      
      // If no refresh token in body, check cookie
      if (!refreshToken) {
        refreshToken = req.cookies.refreshToken;
      }

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const { user, tokens } = await authService.refreshToken(refreshToken);

      // Remove sensitive data
      const { personalDetails, ...userWithoutSensitive } = user;
      const safePersonalDetails = {
        firstName: personalDetails?.firstName,
        lastName: personalDetails?.lastName,
        email: personalDetails?.email
      };

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: {
            ...userWithoutSensitive,
            personalDetails: safePersonalDetails
          },
          tokens
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token refresh failed',
        error: error.message
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const { personalDetails, employmentDetails, ...userWithoutSensitive } = req.user;
      const safePersonalDetails = {
        firstName: personalDetails?.firstName,
        lastName: personalDetails?.lastName,
        email: personalDetails?.email,
        phone: personalDetails?.phone,
        dateOfBirth: personalDetails?.dateOfBirth,
        gender: personalDetails?.gender
      };

      const safeEmploymentDetails = {
        employmentType: employmentDetails?.employmentType,
        employmentStatus: employmentDetails?.employmentStatus,
        joiningDate: employmentDetails?.joiningDate
      };

      // Get user abilities
      const abilities = defineAbilitiesFor(req.user);

      res.json({
        success: true,
        data: {
          user: {
            ...userWithoutSensitive,
            personalDetails: safePersonalDetails,
            employmentDetails: safeEmploymentDetails
          },
          permissions: abilities.rules
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  /**
   * Get user sessions
   */
  async getSessions(req, res) {
    try {
      const sessions = await authService.getUserSessions(req.user.id);

      res.json({
        success: true,
        data: { sessions }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get sessions',
        error: error.message
      });
    }
  }

  /**
   * Terminate specific session
   */
  async terminateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const terminated = await authService.terminateSession(req.user.id, sessionId);

      if (!terminated) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or already terminated'
        });
      }

      res.json({
        success: true,
        message: 'Session terminated successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to terminate session',
        error: error.message
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New passwords do not match'
        });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      await authService.changePassword(req.user.id, oldPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Password change failed',
        error: error.message
      });
    }
  }

  /**
   * Verify token (for API clients)
   */
  async verifyToken(req, res) {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.user.id,
        email: req.user.personalDetails?.email,
        role: req.user.role?.roleCode,
        hospital: req.user.hospital?.name,
        department: req.user.department?.name
      }
    });
  }
}

module.exports = new AuthController();