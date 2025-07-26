// controllers/hospitalAdmin/hospitalAdmin.auth.controller.js

const passport = require('../../config/passport');
const authService = require('../../services/auth.service');
const { defineAbilitiesFor } = require('../../config/casl');
const { prisma } = require('../../config/database');

// Extract the stats function outside the class to avoid 'this' context issues
const getHospitalStatistics = async (hospitalId) => {
    try {
        // Ensure we're only getting stats for the admin's hospital
        if (!hospitalId) {
            throw new Error('Hospital ID is required');
        }

        const [
            totalStaff,
            activeStaff,
            totalPatients,
            activePatients,
            totalBeds,
            occupiedBeds,
            availableBeds,
            maintenanceBeds,
            totalDepartments,
            activeDepartments,
            totalRooms,
            availableRooms,
            totalFloors
        ] = await Promise.all([
            // Staff statistics
            prisma.staff.count({
                where: { hospitalId }
            }),
            prisma.staff.count({
                where: {
                    hospitalId,
                    employmentStatus: 'active',
                    isActive: true
                }
            }),
            
            // Patient statistics
            prisma.patient.count({
                where: { hospitalId }
            }),
            prisma.patient.count({
                where: {
                    hospitalId,
                    patientStatus: 'active'
                }
            }),
            
            // Bed statistics
            prisma.bed.count({
                where: { hospitalId }
            }),
            prisma.bed.count({
                where: {
                    hospitalId,
                    status: 'occupied'
                }
            }),
            prisma.bed.count({
                where: {
                    hospitalId,
                    status: 'available'
                }
            }),
            prisma.bed.count({
                where: {
                    hospitalId,
                    status: 'maintenance'
                }
            }),
            
            // Department statistics
            prisma.department.count({
                where: { hospitalId }
            }),
            prisma.department.count({
                where: {
                    hospitalId,
                    isActive: true
                }
            }),
            
            // Room statistics
            prisma.room.count({
                where: { hospitalId }
            }),
            prisma.room.count({
                where: {
                    hospitalId,
                    status: 'available'
                }
            }),
            
            // Floor statistics
            prisma.floor.count({
                where: { hospitalId }
            })
        ]);

        return {
            staff: {
                total: totalStaff,
                active: activeStaff,
                inactive: totalStaff - activeStaff
            },
            patients: {
                total: totalPatients,
                active: activePatients,
                inactive: totalPatients - activePatients
            },
            beds: {
                total: totalBeds,
                occupied: occupiedBeds,
                available: availableBeds,
                maintenance: maintenanceBeds,
                occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : '0.00',
                availabilityRate: totalBeds > 0 ? ((availableBeds / totalBeds) * 100).toFixed(2) : '0.00'
            },
            departments: {
                total: totalDepartments,
                active: activeDepartments,
                inactive: totalDepartments - activeDepartments
            },
            rooms: {
                total: totalRooms,
                available: availableRooms,
                occupied: totalRooms - availableRooms
            },
            infrastructure: {
                floors: totalFloors
            },
            metadata: {
                hospitalId: hospitalId,
                lastUpdated: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Error fetching hospital stats:', error);
        return {
            error: 'Failed to fetch statistics',
            hospitalId: hospitalId,
            staff: { total: 0, active: 0, inactive: 0 },
            patients: { total: 0, active: 0, inactive: 0 },
            beds: { 
                total: 0, 
                occupied: 0, 
                available: 0, 
                maintenance: 0, 
                occupancyRate: '0.00', 
                availabilityRate: '0.00' 
            },
            departments: { total: 0, active: 0, inactive: 0 },
            rooms: { total: 0, available: 0, occupied: 0 },
            infrastructure: { floors: 0 },
            metadata: { 
                hospitalId: hospitalId, 
                lastUpdated: new Date().toISOString() 
            }
        };
    }
};

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

            // Verify user has a hospital assigned (from database)
            if (!user.hospitalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No hospital assigned to this admin account. Please contact system administrator.'
                });
            }

            // Get fresh hospital data from database using the user's hospitalId
            const hospitalData = await prisma.hospital.findUnique({
                where: { id: user.hospitalId },
                select: {
                    id: true,
                    name: true,
                    hospitalCode: true,
                    hospitalType: true,
                    address: true,
                    contactDetails: true,
                    isActive: true
                }
            });

            // Verify hospital exists and is active
            if (!hospitalData) {
                return res.status(403).json({
                    success: false,
                    message: 'Hospital not found. Please contact system administrator.'
                });
            }

            if (!hospitalData.isActive) {
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
                    hospital: hospitalData,
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
            console.error('Hospital admin login error:', error);
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
            // Use hospitalId from authenticated user
            const hospitalId = req.user.hospitalId;
            
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
                data: { 
                    sessionTerminated: loggedOut,
                    hospitalId: hospitalId
                }
            });

        } catch (error) {
            console.error('Hospital admin logout error:', error);
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

            // Get fresh hospital data using user's hospitalId from database
            const hospitalData = await prisma.hospital.findUnique({
                where: { id: user.hospitalId },
                select: {
                    id: true,
                    name: true,
                    hospitalCode: true,
                    hospitalType: true,
                    isActive: true
                }
            });

            if (!hospitalData || !hospitalData.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Hospital access is currently deactivated'
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
                    hospital: hospitalData,
                    tokens
                }
            });

        } catch (error) {
            console.error('Hospital admin token refresh error:', error);
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

            // Use hospitalId from authenticated user
            const hospitalId = req.user.hospitalId;

            if (!hospitalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No hospital assigned to this admin account.'
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

            // Get detailed hospital information using hospitalId from database
            const hospitalDetails = await prisma.hospital.findUnique({
                where: { id: hospitalId },
                include: {
                    departments: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            departmentType: true,
                            servicesOffered: true,
                            operationalHours: true
                        }
                    },
                    floors: {
                        select: {
                            id: true,
                            floorNumber: true,
                            floorName: true,
                            floorType: true,
                            totalArea: true,
                            usableArea: true
                        }
                    },
                    wards: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            wardName: true,
                            wardCode: true,
                            wardType: true,
                            totalBeds: true,
                            availableBeds: true,
                            occupiedBeds: true
                        }
                    }
                }
            });

            if (!hospitalDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'Hospital not found'
                });
            }

            // Get user abilities
            const abilities = defineAbilitiesFor(req.user);

            // Get hospital stats - Use the external function
            const dashboardStats = await getHospitalStatistics(hospitalId);

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
                    dashboardStats: dashboardStats
                }
            });

        } catch (error) {
            console.error('Error in getProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get hospital admin profile',
                error: error.message
            });
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

            // Use hospitalId from authenticated user for logging/audit purposes
            const hospitalId = req.user.hospitalId;
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

            // Log the password change activity
            console.log(`Hospital admin password changed for user ${req.user.id} in hospital ${hospitalId}`);

            res.json({
                success: true,
                message: 'Hospital admin password changed successfully',
                data: {
                    hospitalId: hospitalId,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Hospital admin password change error:', error);
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

            // Use hospitalId from authenticated user
            const hospitalId = req.user.hospitalId;
            const sessions = await authService.getUserSessions(req.user.id);

            res.json({
                success: true,
                data: { 
                    sessions,
                    hospitalId: hospitalId,
                    totalSessions: sessions.length
                }
            });

        } catch (error) {
            console.error('Hospital admin get sessions error:', error);
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

            // Use hospitalId from authenticated user
            const hospitalId = req.user.hospitalId;
            const terminatedSessions = await authService.logoutAll(req.user.id);

            // Clear refresh token cookie
            res.clearCookie('hospitalAdminRefreshToken');

            // Log the logout all activity
            console.log(`Hospital admin logged out from all devices: user ${req.user.id} in hospital ${hospitalId}`);

            res.json({
                success: true,
                message: 'Logged out from all devices',
                data: { 
                    terminatedSessions,
                    hospitalId: hospitalId,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Hospital admin logout all error:', error);
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

            // Use hospitalId from authenticated user and get fresh hospital data
            const hospitalId = req.user.hospitalId;
            
            const hospitalInfo = await prisma.hospital.findUnique({
                where: { id: hospitalId },
                select: {
                    id: true,
                    name: true,
                    hospitalCode: true,
                    hospitalType: true,
                    isActive: true
                }
            });

            res.json({
                success: true,
                message: 'Hospital admin token is valid',
                data: {
                    userId: req.user.id,
                    email: req.user.personalDetails?.email,
                    role: req.user.role?.roleCode,
                    hospital: hospitalInfo,
                    department: req.user.department?.name,
                    verifiedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Hospital admin token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Token verification failed',
                error: error.message
            });
        }
    }

    /**
     * Get hospital overview (additional method for dashboard)
     */
    async getHospitalOverview(req, res) {
        try {
            // Verify user is hospital admin
            if (!req.user.role || req.user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

            // Use hospitalId from authenticated user
            const hospitalId = req.user.hospitalId;

            if (!hospitalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No hospital assigned to this admin account.'
                });
            }

            // Get comprehensive hospital overview
            const hospitalOverview = await prisma.hospital.findUnique({
                where: { id: hospitalId },
                include: {
                    departments: {
                        where: { isActive: true },
                        include: {
                            _count: {
                                select: {
                                    staff: true,
                                    rooms: true,
                                    beds: true
                                }
                            }
                        }
                    },
                    floors: {
                        include: {
                            _count: {
                                select: {
                                    rooms: true,
                                    wards: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            staff: true,
                            patients: true,
                            beds: true,
                            rooms: true,
                            wards: true
                        }
                    }
                }
            });

            if (!hospitalOverview) {
                return res.status(404).json({
                    success: false,
                    message: 'Hospital not found'
                });
            }

            // Use the external function for statistics
            const statistics = await getHospitalStatistics(hospitalId);

            res.json({
                success: true,
                data: {
                    hospital: hospitalOverview,
                    statistics: statistics
                }
            });

        } catch (error) {
            console.error('Hospital admin get overview error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get hospital overview',
                error: error.message
            });
        }
    }
}

module.exports = new HospitalAdminAuthController();