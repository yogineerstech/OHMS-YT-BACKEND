const superAdminService = require('../../services/superadmin.service');
const { prisma } = require('../../config/database');
const { hashPassword } = require('../../utils/bcrypt.utils');
const { generateRandomPassword } = require('../../utils/password.utils');
const { sendWelcomeEmail } = require('../../utils/email.utils');

/**
 * Create a new hospital
 */
const createHospital = async (req, res) => {
  try {
    const {
      networkId,
      name,
      hospitalCode,
      hospitalType,
      address,
      contactDetails,
      facilities,
      capacityDetails,
      operationalHours,
      emergencyServices,
      traumaCenterLevel,
      teachingHospital,
      researchFacility,
      telemedicineEnabled,
      accreditationDetails,
      licenseDetails,
      timezone,
      currency,
      supportedLanguages
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name is required'
      });
    }

    // Check if hospital code already exists
    if (hospitalCode) {
      const existingHospital = await prisma.hospital.findUnique({
        where: { hospitalCode }
      });

      if (existingHospital) {
        return res.status(400).json({
          success: false,
          message: 'Hospital code already exists'
        });
      }
    }

    // Create hospital
    const hospital = await prisma.hospital.create({
      data: {
        networkId,
        name,
        hospitalCode,
        hospitalType,
        address,
        contactDetails: contactDetails || {},
        facilities: facilities || {},
        capacityDetails: capacityDetails || {},
        operationalHours: operationalHours || {},
        emergencyServices: emergencyServices || false,
        traumaCenterLevel,
        teachingHospital: teachingHospital || false,
        researchFacility: researchFacility || false,
        telemedicineEnabled: telemedicineEnabled || false,
        accreditationDetails: accreditationDetails || {},
        licenseDetails: licenseDetails || {},
        timezone: timezone || 'Asia/Kolkata',
        currency: currency || 'INR',
        supportedLanguages: supportedLanguages || ['en', 'hi'],
        isActive: true
      },
      include: {
        network: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: hospital
    });

  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hospital',
      error: error.message
    });
  }
};

/**
 * Create hospital admin for a specific hospital
 */
const createHospitalAdmin = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const {
      personalDetails,
      contactDetails,
      employmentDetails,
      generatePassword = true,
      password,
      sendWelcomeEmail: sendEmailNotification = true
    } = req.body;

    // Validate required fields
    if (!personalDetails?.firstName || !personalDetails?.lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    if (!personalDetails?.email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Verify hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check if email already exists
    const existingStaff = await prisma.staff.findMany({
      where: {
        isActive: true
      }
    });

    const emailExists = existingStaff.some(staff => 
      staff.personalDetails && 
      typeof staff.personalDetails === 'object' &&
      staff.personalDetails.email === personalDetails.email
    );

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Get or create Hospital Admin role
    let hospitalAdminRole = await prisma.role.findFirst({
      where: { roleCode: 'HOSPITAL_ADMIN' }
    });

    if (!hospitalAdminRole) {
      hospitalAdminRole = await prisma.role.create({
        data: {
          roleName: 'Hospital Admin',
          roleCode: 'HOSPITAL_ADMIN',
          roleType: 'administrative',
          roleDescription: 'Hospital Administrator with full access to hospital operations',
          hierarchyLevel: 2,
          isPatientFacing: false,
          isClinicalRole: false,
          isAdministrativeRole: true,
          isActive: true
        }
      });
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId(hospitalId);

    // Generate password if needed
    const finalPassword = generatePassword ? generateRandomPassword() : password;
    
    if (!finalPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(finalPassword);

    // Create staff record
    const staff = await prisma.staff.create({
      data: {
        hospitalId,
        employeeId,
        personalDetails: {
          ...personalDetails,
          userType: 'hospital_admin'
        },
        contactDetails: contactDetails || {},
        employmentDetails: {
          ...employmentDetails,
          joiningDate: new Date(),
          employmentType: 'permanent',
          employmentStatus: 'active'
        },
        roleId: hospitalAdminRole.id,
        isActive: true
      },
      include: {
        hospital: true,
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Create user credentials
    await prisma.userCredential.create({
      data: {
        userId: staff.id,
        credentialType: 'email',
        credentialDataHash: passwordHash,
        isPrimary: true,
        isActive: true
      }
    });

    // Send welcome email if requested
    if (sendEmailNotification) {
      try {
        await sendWelcomeEmail({
          email: personalDetails.email,
          name: `${personalDetails.firstName} ${personalDetails.lastName}`,
          hospitalName: hospital.name,
          employeeId,
          password: finalPassword,
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Remove sensitive data from response
    const responseData = {
      ...staff,
      tempPassword: generatePassword ? finalPassword : undefined
    };

    res.status(201).json({
      success: true,
      message: 'Hospital admin created successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error creating hospital admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hospital admin',
      error: error.message
    });
  }
};

/**
 * Get hospital details by ID
 */
const getHospitalById = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        network: true,
        departments: {
          where: { isActive: true },
          include: {
            category: true
          }
        },
        floors: true,
        staff: {
          where: { isActive: true },
          include: {
            role: true,
            department: true
          }
        },
        _count: {
          select: {
            patients: true,
            patientVisits: true,
            departments: true,
            staff: true,
            beds: true,
            rooms: true
          }
        }
      }
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      data: hospital
    });

  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital details',
      error: error.message
    });
  }
};

/**
 * Update hospital details
 */
const updateHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    // Check if hospital code is being changed and if it's unique
    if (updateData.hospitalCode) {
      const existingHospital = await prisma.hospital.findFirst({
        where: {
          hospitalCode: updateData.hospitalCode,
          id: { not: hospitalId }
        }
      });

      if (existingHospital) {
        return res.status(400).json({
          success: false,
          message: 'Hospital code already exists'
        });
      }
    }

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        network: true
      }
    });

    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: hospital
    });

  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital',
      error: error.message
    });
  }
};

/**
 * Get hospital admins for a specific hospital
 */
const getHospitalAdmins = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { page = 1, limit = 10, search, status } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const whereClause = {
      hospitalId,
      role: {
        roleCode: 'HOSPITAL_ADMIN'
      }
    };

    if (status) {
      whereClause.isActive = status === 'active';
    }

    // Get hospital admins
    const [admins, total] = await Promise.all([
      prisma.staff.findMany({
        where: whereClause,
        include: {
          role: true,
          hospital: true,
          department: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.staff.count({ where: whereClause })
    ]);

    // Filter by search if provided
    let filteredAdmins = admins;
    if (search) {
      filteredAdmins = admins.filter(admin => {
        const personalDetails = admin.personalDetails || {};
        const searchLower = search.toLowerCase();
        return (
          personalDetails.firstName?.toLowerCase().includes(searchLower) ||
          personalDetails.lastName?.toLowerCase().includes(searchLower) ||
          personalDetails.email?.toLowerCase().includes(searchLower) ||
          admin.employeeId?.toLowerCase().includes(searchLower)
        );
      });
    }

    res.json({
      success: true,
      data: {
        admins: filteredAdmins,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          pages: Math.ceil(total / take)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching hospital admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital admins',
      error: error.message
    });
  }
};

/**
 * Create hospital network
 */
const createHospitalNetwork = async (req, res) => {
  try {
    const {
      networkName,
      networkCode,
      headquartersAddress,
      registrationNumber,
      taxId,
      gstin,
      primaryContact,
      networkType,
      accreditationDetails,
      regulatoryCompliance
    } = req.body;

    if (!networkName) {
      return res.status(400).json({
        success: false,
        message: 'Network name is required'
      });
    }

    // Check if network code already exists
    if (networkCode) {
      const existingNetwork = await prisma.hospitalNetwork.findUnique({
        where: { networkCode }
      });

      if (existingNetwork) {
        return res.status(400).json({
          success: false,
          message: 'Network code already exists'
        });
      }
    }

    const network = await prisma.hospitalNetwork.create({
      data: {
        networkName,
        networkCode,
        headquartersAddress,
        registrationNumber,
        taxId,
        gstin,
        primaryContact: primaryContact || {},
        networkType,
        accreditationDetails: accreditationDetails || {},
        regulatoryCompliance: regulatoryCompliance || {}
      }
    });

    res.status(201).json({
      success: true,
      message: 'Hospital network created successfully',
      data: network
    });

  } catch (error) {
    console.error('Error creating hospital network:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hospital network',
      error: error.message
    });
  }
};

/**
 * Get all hospital networks
 */
const getHospitalNetworks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    let whereClause = {};

    if (search) {
      whereClause = {
        OR: [
          { networkName: { contains: search, mode: 'insensitive' } },
          { networkCode: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [networks, total] = await Promise.all([
      prisma.hospitalNetwork.findMany({
        where: whereClause,
        include: {
          hospitals: {
            select: {
              id: true,
              name: true,
              hospitalCode: true,
              isActive: true
            }
          },
          _count: {
            select: {
              hospitals: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.hospitalNetwork.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        networks,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          pages: Math.ceil(total / take)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching hospital networks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital networks',
      error: error.message
    });
  }
};

/**
 * Reset hospital admin password
 */
const resetHospitalAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { newPassword, sendEmail: sendEmailNotification = true } = req.body;

    // Find the admin
    const admin = await prisma.staff.findFirst({
      where: {
        id: adminId,
        isActive: true,
        role: {
          roleCode: 'HOSPITAL_ADMIN'
        }
      },
      include: {
        hospital: true,
        role: true
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Hospital admin not found'
      });
    }

    // Generate new password if not provided
    const finalPassword = newPassword || generateRandomPassword();

    // Hash the new password
    const passwordHash = await hashPassword(finalPassword);

    // Update user credentials
    await prisma.userCredential.updateMany({
      where: {
        userId: adminId,
        credentialType: 'email',
        isActive: true
      },
      data: {
        credentialDataHash: passwordHash,
        failedAttempts: 0,
        lockoutUntil: null,
        lastUsed: new Date()
      }
    });

    // Send email notification if requested
    if (sendEmailNotification && admin.personalDetails?.email) {
      try {
        await sendPasswordResetEmail({
          email: admin.personalDetails.email,
          name: `${admin.personalDetails.firstName} ${admin.personalDetails.lastName}`,
          newPassword: finalPassword,
          hospitalName: admin.hospital.name
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        newPassword: !newPassword ? finalPassword : undefined
      }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

/**
 * Deactivate hospital admin
 */
const deactivateHospitalAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { reason } = req.body;

    const admin = await prisma.staff.findUnique({
      where: { id: adminId },
      include: {
        hospital: true,
        role: true
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Hospital admin not found'
      });
    }

    const updatedAdmin = await prisma.staff.update({
      where: { id: adminId },
      data: {
        isActive: false,
        employmentDetails: {
          ...admin.employmentDetails,
          employmentStatus: 'inactive',
          terminationDate: new Date(),
          terminationReason: reason
        },
        updatedAt: new Date()
      },
      include: {
        hospital: true,
        role: true
      }
    });

    // Deactivate all user credentials
    await prisma.userCredential.updateMany({
      where: { userId: adminId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Hospital admin deactivated successfully',
      data: updatedAdmin
    });

  } catch (error) {
    console.error('Error deactivating hospital admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate hospital admin',
      error: error.message
    });
  }
};

// Helper function to generate employee ID
const generateEmployeeId = async (hospitalId) => {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: { hospitalCode: true, name: true }
  });

  const prefix = hospital.hospitalCode || hospital.name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  
  return `${prefix}ADM${timestamp}`;
};

// Helper function to send password reset email
const sendPasswordResetEmail = async ({ email, name, newPassword, hospitalName }) => {
  const { sendEmail } = require('../../utils/email.utils');
  
  const subject = `Password Reset - ${hospitalName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Dear ${name},</p>
      <p>Your password has been reset by the system administrator.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h3>New Password:</h3>
        <p><strong>${newPassword}</strong></p>
      </div>
      
      <p><strong>Important:</strong> Please change this password after logging in for security purposes.</p>
      
      <p>Best regards,<br>Hospital Management System</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

module.exports = {
  createHospital,
  createHospitalAdmin,
  getHospitalById,
  updateHospital,
  getHospitalAdmins,
  createHospitalNetwork,
  getHospitalNetworks,
  resetHospitalAdminPassword,
  deactivateHospitalAdmin
};