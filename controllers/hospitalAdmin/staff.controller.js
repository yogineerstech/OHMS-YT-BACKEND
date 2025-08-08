// controllers/hospitalAdmin/staff.controller.js

const { prisma } = require('../../config/database');
const { hashPassword } = require('../../utils/bcrypt.utils');
const { generateRandomPassword } = require('../../utils/password.utils');
// Removed: const { defineAbilitiesFor } = require('../../config/casl'); // Not needed here

class StaffController {
    /**
     * Create new staff member
     */
    async createStaff(req, res) {
        try {
            // Verify user is hospital admin
            if (!req.user.role || req.user.role.roleCode !== 'HOSPITAL_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Hospital admin credentials required.'
                });
            }

            const hospitalId = req.user.hospitalId;
            const {
                // Personal Information
                personalDetails,
                contactDetails,
                emergencyContacts,
                identificationDocuments,
                
                // Employment Details
                employmentDetails,
                roleCode,
                departmentId,
                reportingManagerId,
                employmentType = 'permanent',
                
                // Professional Information
                specializations,
                qualifications,
                certifications,
                licenses,
                registrationNumbers,
                languagesSpoken = ['en'],
                skills,
                
                // Compensation
                salaryDetails,
                benefits,
                
                // Doctor-specific (if role is doctor)
                doctorDetails,
                
                // Nurse-specific (if role is nurse)
                nurseDetails,
                
                // Credentials
                email,
                password,
                generatePassword = false, // Option to auto-generate password
                
                // Medical Information
                medicalInfo,
                vaccinationRecords
            } = req.body;

            // Validate required fields
            if (!personalDetails?.firstName || !personalDetails?.lastName || !email || !roleCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Required fields missing: firstName, lastName, email, roleCode'
                });
            }

            // Generate password if requested or not provided
            let finalPassword = password;
            if (generatePassword || !password) {
                finalPassword = generateRandomPassword(12);
            }

            // Validate role exists
            const role = await prisma.role.findUnique({
                where: { roleCode },
                include: { rolePermissions: { include: { permission: true } } }
            });

            if (!role || !role.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or inactive role specified'
                });
            }

            // Validate department if provided
            if (departmentId) {
                const department = await prisma.department.findFirst({
                    where: { 
                        id: departmentId, 
                        hospitalId,
                        isActive: true 
                    }
                });

                if (!department) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid department for this hospital'
                    });
                }
            }

            // Validate reporting manager if provided
            if (reportingManagerId) {
                const manager = await prisma.staff.findFirst({
                    where: { 
                        id: reportingManagerId, 
                        hospitalId,
                        isActive: true 
                    }
                });

                if (!manager) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid reporting manager for this hospital'
                    });
                }
            }

            // Check if email already exists
            const existingUser = await prisma.staff.findFirst({
                where: {
                    personalDetails: {
                        path: ['email'],
                        equals: email
                    }
                }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            // Validate doctor-specific requirements
            if (roleCode === 'DOCTOR' && doctorDetails) {
                if (!doctorDetails.medicalRegistrationNumber) {
                    return res.status(400).json({
                        success: false,
                        message: 'Medical registration number is required for doctors'
                    });
                }

                // Check if medical registration number already exists
                const existingDoctor = await prisma.doctor.findUnique({
                    where: { medicalRegistrationNumber: doctorDetails.medicalRegistrationNumber }
                });

                if (existingDoctor) {
                    return res.status(400).json({
                        success: false,
                        message: 'Medical registration number already exists'
                    });
                }
            }

            // Validate nurse-specific requirements
            if (roleCode === 'NURSE' && nurseDetails) {
                if (!nurseDetails.nursingRegistrationNumber) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nursing registration number is required for nurses'
                    });
                }

                // Check if nursing registration number already exists
                const existingNurse = await prisma.nurse.findUnique({
                    where: { nursingRegistrationNumber: nurseDetails.nursingRegistrationNumber }
                });

                if (existingNurse) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nursing registration number already exists'
                    });
                }
            }

            // Generate employee ID
            const employeeIdPrefix = `${req.user.hospital?.hospitalCode || 'HOS'}-${roleCode}-`;
            const lastEmployee = await prisma.staff.findFirst({
                where: { 
                    hospitalId,
                    employeeId: { startsWith: employeeIdPrefix }
                },
                orderBy: { createdAt: 'desc' }
            });

            let nextNumber = 1;
            if (lastEmployee?.employeeId) {
                const lastNumber = parseInt(lastEmployee.employeeId.split('-').pop());
                nextNumber = lastNumber + 1;
            }
            const employeeId = `${employeeIdPrefix}${nextNumber.toString().padStart(4, '0')}`;

            // Hash password
            const hashedPassword = await hashPassword(finalPassword);

            // Start transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create staff record
                const staff = await tx.staff.create({
                    data: {
                        hospitalId,
                        employeeId,
                        personalDetails: {
                            ...personalDetails,
                            email
                        },
                        contactDetails,
                        emergencyContacts,
                        identificationDocuments,
                        employmentDetails: {
                            ...employmentDetails,
                            employmentType,
                            employmentStatus: 'active',
                            joiningDate: new Date()
                        },
                        roleId: role.id,
                        departmentId,
                        reportingManagerId,
                        specializations,
                        qualifications,
                        certifications,
                        licenses,
                        registrationNumbers,
                        languagesSpoken,
                        skills,
                        salaryDetails,
                        benefits,
                        medicalInfo,
                        vaccinationRecords,
                        createdById: req.user.id,
                        isActive: true
                    },
                    include: {
                        role: true,
                        department: true,
                        reportingManager: {
                            select: {
                                id: true,
                                employeeId: true,
                                personalDetails: true
                            }
                        }
                    }
                });

                // Create user credentials
                await tx.userCredential.create({
                    data: {
                        userId: staff.id,
                        credentialType: 'email',
                        credentialDataHash: hashedPassword,
                        algorithm: 'bcrypt',
                        isPrimary: true,
                        isActive: true
                    }
                });

                // Create doctor-specific record if role is doctor
                if (roleCode === 'DOCTOR' && doctorDetails) {
                    await tx.doctor.create({
                        data: {
                            id: staff.id,
                            ...doctorDetails,
                            medicalRegistrationNumber: doctorDetails.medicalRegistrationNumber,
                            medicalCouncil: doctorDetails.medicalCouncil,
                            registrationDate: doctorDetails.registrationDate ? new Date(doctorDetails.registrationDate) : null,
                            registrationExpiry: doctorDetails.registrationExpiry ? new Date(doctorDetails.registrationExpiry) : null,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    });
                }

                // Create nurse-specific record if role is nurse
                if (roleCode === 'NURSE' && nurseDetails) {
                    await tx.nurse.create({
                        data: {
                            id: staff.id,
                            ...nurseDetails,
                            nursingRegistrationNumber: nurseDetails.nursingRegistrationNumber,
                            nursingCouncil: nurseDetails.nursingCouncil,
                            createdAt: new Date()
                        }
                    });
                }

                return staff;
            });

            // Remove sensitive data from response
            const { personalDetails: staffPersonalDetails, salaryDetails: staffSalaryDetails, ...staffWithoutSensitive } = result;
            const safePersonalDetails = {
                firstName: staffPersonalDetails?.firstName,
                lastName: staffPersonalDetails?.lastName,
                email: staffPersonalDetails?.email,
                phone: staffPersonalDetails?.phone,
                dateOfBirth: staffPersonalDetails?.dateOfBirth,
                gender: staffPersonalDetails?.gender
            };

            const responseData = {
                staff: {
                    ...staffWithoutSensitive,
                    personalDetails: safePersonalDetails
                }
            };

            // Include generated password in response if it was auto-generated
            if (generatePassword || !password) {
                responseData.generatedPassword = finalPassword;
                responseData.passwordNote = 'This password will only be shown once. Please save it securely.';
            }

            res.status(201).json({
                success: true,
                message: 'Staff member created successfully',
                data: responseData
            });

        } catch (error) {
            console.error('Create staff error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create staff member',
                error: error.message
            });
        }
    }

    /**
     * Get all staff members
     */
    async getAllStaff(req, res) {
        try {
            const hospitalId = req.user.hospitalId;
            const { page = 1, limit = 10, search, department, role, status } = req.query;
            const skip = (page - 1) * limit;

            let whereClause = { hospitalId };

            if (search) {
                whereClause.OR = [
                    { employeeId: { contains: search, mode: 'insensitive' } },
                    {
                        personalDetails: {
                            path: ['firstName'],
                            string_contains: search
                        }
                    },
                    {
                        personalDetails: {
                            path: ['lastName'],
                            string_contains: search
                        }
                    }
                ];
            }

            if (department) whereClause.departmentId = department;
            if (role) whereClause.roleId = role;
            if (status) whereClause.employmentStatus = status;

            const [staff, total] = await Promise.all([
                prisma.staff.findMany({
                    where: whereClause,
                    include: {
                        role: true,
                        department: true,
                        hospital: { select: { name: true } }
                    },
                    skip: parseInt(skip),
                    take: parseInt(limit),
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.staff.count({ where: whereClause })
            ]);

            res.json({
                success: true,
                data: {
                    staff,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get all staff error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve staff members',
                error: error.message
            });
        }
    }

    /**
     * Get staff member by ID
     */
    async getStaffById(req, res) {
        try {
            const { staffId } = req.params;
            const hospitalId = req.user.hospitalId;

            const staff = await prisma.staff.findFirst({
                where: {
                    id: staffId,
                    hospitalId
                },
                include: {
                    role: true,
                    department: true,
                    hospital: { select: { name: true } },
                    doctor: true,
                    nurse: true
                }
            });

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            res.json({
                success: true,
                data: staff
            });

        } catch (error) {
            console.error('Get staff by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve staff member',
                error: error.message
            });
        }
    }

    /**
     * Update staff member
     */
    async updateStaff(req, res) {
        try {
            const { staffId } = req.params;
            const hospitalId = req.user.hospitalId;
            const updateData = req.body;

            // Verify staff exists and belongs to hospital
            const existingStaff = await prisma.staff.findFirst({
                where: {
                    id: staffId,
                    hospitalId
                }
            });

            if (!existingStaff) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            const updatedStaff = await prisma.staff.update({
                where: { id: staffId },
                data: {
                    ...updateData,
                    lastUpdatedById: req.user.id
                },
                include: {
                    role: true,
                    department: true
                }
            });

            res.json({
                success: true,
                message: 'Staff member updated successfully',
                data: updatedStaff
            });

        } catch (error) {
            console.error('Update staff error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update staff member',
                error: error.message
            });
        }
    }

    /**
     * Reset staff password
     */
    async resetStaffPassword(req, res) {
        try {
            const { staffId } = req.params;
            const { newPassword } = req.body;
            const hospitalId = req.user.hospitalId;

            // Verify staff exists and belongs to hospital
            const staff = await prisma.staff.findFirst({
                where: {
                    id: staffId,
                    hospitalId
                }
            });

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            const hashedPassword = await hashPassword(newPassword);

            // Update user credentials
            await prisma.userCredential.updateMany({
                where: { staffId },
                data: { 
                    passwordHash: hashedPassword,
                    isPasswordTemporary: true,
                    lastPasswordChange: new Date()
                }
            });

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password',
                error: error.message
            });
        }
    }

    /**
     * Deactivate staff member
     */
    async deactivateStaff(req, res) {
        try {
            const { staffId } = req.params;
            const hospitalId = req.user.hospitalId;

            // Verify staff exists and belongs to hospital
            const staff = await prisma.staff.findFirst({
                where: {
                    id: staffId,
                    hospitalId
                }
            });

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            await prisma.staff.update({
                where: { id: staffId },
                data: {
                    employmentStatus: 'terminated',
                    isActive: false,
                    lastUpdatedById: req.user.id
                }
            });

            res.json({
                success: true,
                message: 'Staff member deactivated successfully'
            });

        } catch (error) {
            console.error('Deactivate staff error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to deactivate staff member',
                error: error.message
            });
        }
    }

    /**
     * Get staff statistics
     */
    async getStaffStatistics(req, res) {
        try {
            const hospitalId = req.user.hospitalId;

            const [
                totalStaff,
                activeStaff,
                inactiveStaff,
                doctorsCount,
                nursesCount,
                departmentStats
            ] = await Promise.all([
                prisma.staff.count({ where: { hospitalId } }),
                prisma.staff.count({ where: { hospitalId, employmentStatus: 'active' } }),
                prisma.staff.count({ where: { hospitalId, employmentStatus: { not: 'active' } } }),
                prisma.staff.count({
                    where: {
                        hospitalId,
                        role: { roleCode: 'DOCTOR' }
                    }
                }),
                prisma.staff.count({
                    where: {
                        hospitalId,
                        role: { roleCode: 'NURSE' }
                    }
                }),
                prisma.staff.groupBy({
                    by: ['departmentId'],
                    where: { hospitalId },
                    _count: true
                })
            ]);

            res.json({
                success: true,
                data: {
                    totalStaff,
                    activeStaff,
                    inactiveStaff,
                    doctorsCount,
                    nursesCount,
                    departmentStats
                }
            });

        } catch (error) {
            console.error('Get staff statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve staff statistics',
                error: error.message
            });
        }
    }

    /**
     * Get available roles
     */
    async getAvailableRoles(req, res) {
        try {
            const roles = await prisma.role.findMany({
                where: {
                    OR: [
                        { hospitalSpecific: false },
                        { hospitalSpecific: true }
                    ],
                    isActive: true
                },
                select: {
                    id: true,
                    roleName: true,
                    roleCode: true,
                    roleDescription: true,
                    categoryId: true,
                    category: {
                        select: {
                            categoryName: true
                        }
                    }
                },
                orderBy: { roleName: 'asc' }
            });

            res.json({
                success: true,
                data: roles
            });

        } catch (error) {
            console.error('Get available roles error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve available roles',
                error: error.message
            });
        }
    }
}

module.exports = new StaffController();