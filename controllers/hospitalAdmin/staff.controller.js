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

    // ... rest of the methods remain the same (getAllStaff, getStaffById, etc.)
}

module.exports = new StaffController();