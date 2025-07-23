const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { defineAbilitiesFor } = require('../utils/casl');

class AuthController {
  // Login
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { employeeId, password, hospitalId } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await authService.authenticateUser(
        employeeId,
        password,
        hospitalId,
        ipAddress,
        userAgent
      );

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          session: result.session,
          abilities: defineAbilitiesFor(result.user).rules
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
        code: 'LOGIN_FAILED'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required',
          code: 'REFRESH_TOKEN_REQUIRED'
        });
      }

      const result = await authService.refreshTokens(refreshToken);

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          abilities: defineAbilitiesFor(result.user).rules
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
        code: 'TOKEN_REFRESH_FAILED'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const sessionId = req.user?.sessionId;
      
      if (sessionId) {
        await authService.logout(sessionId);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }

  // Logout from all devices
  async logoutAll(req, res) {
    try {
      const userId = req.user?.userId;
      
      if (userId) {
        await authService.logoutAll(userId);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout all failed',
        error: error.message
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = req.user;
      
      res.json({
        success: true,
        data: {
          user,
          abilities: defineAbilitiesFor(user).rules
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

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'PASSWORD_CHANGE_FAILED'
      });
    }
  }

  // Reset password (admin only)
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId, newPassword } = req.body;
      const adminId = req.user.id;

      await authService.resetPassword(userId, newPassword, adminId);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'PASSWORD_RESET_FAILED'
      });
    }
  }

  // Get active sessions
  async getActiveSessions(req, res) {
    try {
      const userId = req.user.id;
      const sessions = await authService.getActiveSessions(userId);

      res.json({
        success: true,
        data: sessions
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get active sessions',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();