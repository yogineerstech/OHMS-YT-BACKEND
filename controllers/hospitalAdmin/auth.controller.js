// controllers/hospitalAdmin.auth.controller.js

const passport = require('../../config/passport');
const authService = require('../../services/auth.service');
const { defineAbilitiesFor } = require('../../config/casl');
const { prisma } = require('../../config/database');

class HospitalAdminAuthController {
    /**
     * Hospital Admin login
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

            // Verify user is hospital admin
            if (!user.role || user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

            // Verify user has a hospital assigned
            if (!user.hospitalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No hospital assigned to this admin account. Please contact system administrator.'
                });
            }

            // Verify user's hospital is active
            if (user.hospital && !user.hospital.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Hospital access is currently deactivated'
                });
            }

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
                res.cookie('hospitalAdminRefreshToken', tokens.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }

            res.json({
                success: true,
                message: 'Hospital admin login successful',
                data: {
                    user: {
                        ...userWithoutSensitive,
                        personalDetails: safePersonalDetails,
                        employmentDetails: safeEmploymentDetails
                    },
                    hospital: {
                        id: user.hospital?.id,
                        name: user.hospital?.name,
                        hospitalCode: user.hospital?.hospitalCode,
                        hospitalType: user.hospital?.hospitalType,
                        address: user.hospital?.address,
                        contactDetails: user.hospital?.contactDetails
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
                message: 'Hospital admin login failed',
                error: error.message
            });
        }
    }


    /**
     * Hospital Admin logout
     */
    async logout(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            let loggedOut = false;

            if (token) {
                loggedOut = await authService.logout(req.user.id, token);
            }

            // Clear refresh token cookie
            res.clearCookie('hospitalAdminRefreshToken');

            res.json({
                success: true,
                message: 'Hospital admin logout successful',
                data: { sessionTerminated: loggedOut }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Hospital admin logout failed',
                error: error.message
            });
        }
    }

    /**
     * Refresh hospital admin access token
     */
    async refreshToken(req, res, next) {
        try {
            let refreshToken = req.body.refreshToken;

            // If no refresh token in body, check cookie
            if (!refreshToken) {
                refreshToken = req.cookies.hospitalAdminRefreshToken;
            }

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            const { user, tokens } = await authService.refreshToken(refreshToken);

            // Verify user is still hospital admin
            if (!user.role || user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

            // Remove sensitive data
            const { personalDetails, ...userWithoutSensitive } = user;
            const safePersonalDetails = {
                firstName: personalDetails?.firstName,
                lastName: personalDetails?.lastName,
                email: personalDetails?.email
            };

            res.json({
                success: true,
                message: 'Hospital admin token refreshed successfully',
                data: {
                    user: {
                        ...userWithoutSensitive,
                        personalDetails: safePersonalDetails
                    },
                    hospital: {
                        id: user.hospital?.id,
                        name: user.hospital?.name,
                        hospitalCode: user.hospital?.hospitalCode
                    },
                    tokens
                }
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Hospital admin token refresh failed',
                error: error.message
            });
        }
    }

    /**
     * Get hospital admin profile with hospital info
     */
    async getProfile(req, res) {
        try {
            // Verify user is hospital admin
            if (!req.user.role || req.user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

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

            // Get detailed hospital information
            const hospitalDetails = await prisma.hospital.findUnique({
                where: { id: req.user.hospitalId },
                include: {
                    departments: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            departmentType: true
                        }
                    },
                    floors: {
                        select: {
                            id: true,
                            floorNumber: true,
                            floorName: true,
                            floorType: true
                        }
                    }
                }
            });

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
                    hospital: hospitalDetails,
                    permissions: abilities.rules,
                    dashboardStats: await this.getHospitalStats(req.user.hospitalId)
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get hospital admin profile',
                error: error.message
            });
        }
    }

    /**
     * Get hospital dashboard statistics
     */
    async getHospitalStats(hospitalId) {
        try {
            const [
                totalStaff,
                activeStaff,
                totalPatients,
                activePatients,
                totalBeds,
                occupiedBeds,
                totalDepartments,
                activeDepartments
            ] = await Promise.all([
                prisma.staff.count({
                    where: { hospitalId }
                }),
                prisma.staff.count({
                    where: {
                        hospitalId,
                        employmentStatus: 'active'
                    }
                }),
                prisma.patient.count({
                    where: { hospitalId }
                }),
                prisma.patient.count({
                    where: {
                        hospitalId,
                        patientStatus: 'active'
                    }
                }),
                prisma.bed.count({
                    where: { hospitalId }
                }),
                prisma.bed.count({
                    where: {
                        hospitalId,
                        status: 'occupied'
                    }
                }),
                prisma.department.count({
                    where: { hospitalId }
                }),
                prisma.department.count({
                    where: {
                        hospitalId,
                        isActive: true
                    }
                })
            ]);

            return {
                staff: {
                    total: totalStaff,
                    active: activeStaff
                },
                patients: {
                    total: totalPatients,
                    active: activePatients
                },
                beds: {
                    total: totalBeds,
                    occupied: occupiedBeds,
                    available: totalBeds - occupiedBeds,
                    occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : 0
                },
                departments: {
                    total: totalDepartments,
                    active: activeDepartments
                }
            };

        } catch (error) {
            console.error('Error fetching hospital stats:', error);
            return {};
        }
    }

    /**
     * Change hospital admin password
     */
    async changePassword(req, res) {
        try {
            // Verify user is hospital admin
            if (!req.user.role || req.user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

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
                message: 'Hospital admin password changed successfully'
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
     * Get hospital admin sessions
     */
    async getSessions(req, res) {
        try {
            // Verify user is hospital admin
            if (!req.user.role || req.user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

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
     * Logout from all devices
     */
    async logoutAll(req, res, next) {
        try {
            // Verify user is hospital admin
            if (!req.user.role || req.user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

            const terminatedSessions = await authService.logoutAll(req.user.id);

            // Clear refresh token cookie
            res.clearCookie('hospitalAdminRefreshToken');

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
     * Verify hospital admin token
     */
    async verifyToken(req, res) {
        try {
            // Verify user is hospital admin
            if (!req.user.role || req.user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

            res.json({
                success: true,
                message: 'Hospital admin token is valid',
                data: {
                    userId: req.user.id,
                    email: req.user.personalDetails?.email,
                    role: req.user.role?.roleCode,
                    hospital: {
                        id: req.user.hospital?.id,
                        name: req.user.hospital?.name,
                        hospitalCode: req.user.hospital?.hospitalCode
                    },
                    department: req.user.department?.name
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Token verification failed',
                error: error.message
            });
        }
    }
}

module.exports = new HospitalAdminAuthController();