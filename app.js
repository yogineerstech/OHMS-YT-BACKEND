require('dotenv/config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('./generated/prisma'); // Fixed import path

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Make prisma available globally for routes
global.prisma = prisma;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Hospital Management System API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Import middleware
const { generalRateLimit } = require('./middleware/auth');

// Apply rate limiting to API routes only
app.use('/api', generalRateLimit);

// API version info
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    data: {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Import route modules from routes folder
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const staffRoutes = require('./routes/staff');

// Mount API routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/staff', staffRoutes);

// Temporary direct routes for entities without dedicated route files
// Hospital Network Routes
app.get('/api/hospital-networks', async (req, res) => {
  try {
    const networks = await prisma.hospitalNetwork.findMany({
      include: { 
        hospitals: {
          include: {
            _count: {
              select: {
                departments: true,
                staff: true,
                patients: true
              }
            }
          }
        }
      }
    });
    res.json({
      success: true,
      data: networks,
      total: networks.length
    });
  } catch (error) {
    console.error('Error fetching hospital networks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch hospital networks',
      message: error.message 
    });
  }
});

app.post('/api/hospital-networks', async (req, res) => {
  try {
    const { networkName, networkCode, networkType, headquartersAddress } = req.body;
    
    if (!networkName) {
      return res.status(400).json({
        success: false,
        error: 'Network name is required'
      });
    }

    const newNetwork = await prisma.hospitalNetwork.create({
      data: { 
        networkName, 
        networkCode, 
        networkType,
        headquartersAddress,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(201).json({
      success: true,
      data: newNetwork,
      message: 'Hospital network created successfully'
    });
  } catch (error) {
    console.error('Error creating hospital network:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create hospital network',
      message: error.message 
    });
  }
});

// Hospital Routes
app.get('/api/hospitals', async (req, res) => {
  try {
    const { networkId, isActive } = req.query;
    
    const where = {};
    if (networkId) where.networkId = networkId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const hospitals = await prisma.hospital.findMany({
      where,
      include: { 
        network: {
          select: { id: true, networkName: true, networkCode: true }
        },
        departments: {
          where: { isActive: true },
          include: {
            category: true,
            _count: {
              select: { staff: true }
            }
          }
        },
        _count: {
          select: {
            departments: true,
            staff: true,
            patients: true,
            floors: true,
            rooms: true,
            beds: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: hospitals,
      total: hospitals.length
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch hospitals',
      message: error.message 
    });
  }
});

app.post('/api/hospitals', async (req, res) => {
  try {
    const { 
      name, 
      hospitalCode, 
      hospitalType, 
      networkId, 
      address, 
      contactDetails,
      accreditationDetails 
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Hospital name is required'
      });
    }

    const newHospital = await prisma.hospital.create({
      data: { 
        name, 
        hospitalCode, 
        hospitalType, 
        networkId,
        address,
        contactDetails,
        accreditationDetails,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        network: {
          select: { id: true, networkName: true, networkCode: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: newHospital,
      message: 'Hospital created successfully'
    });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create hospital',
      message: error.message 
    });
  }
});

// Department Routes
app.get('/api/departments', async (req, res) => {
  try {
    const { hospitalId, categoryId, isActive } = req.query;
    
    const where = {};
    if (hospitalId) where.hospitalId = hospitalId;
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const departments = await prisma.department.findMany({
      where,
      include: { 
        hospital: {
          select: { id: true, name: true, hospitalCode: true }
        },
        category: true,
        floor: {
          select: { id: true, floorName: true, floorNumber: true }
        },
        parentDepartment: {
          select: { id: true, name: true }
        },
        childDepartments: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: {
            staff: true,
            rooms: true,
            beds: true,
            childDepartments: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: departments,
      total: departments.length
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch departments',
      message: error.message 
    });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { 
      hospitalId, 
      name, 
      code, 
      departmentType, 
      categoryId, 
      floorId,
      parentDepartmentId,
      servicesOffered,
      operationalHours
    } = req.body;
    
    if (!hospitalId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Hospital ID and department name are required'
      });
    }

    const newDepartment = await prisma.department.create({
      data: { 
        hospitalId, 
        name, 
        code, 
        departmentType, 
        categoryId,
        floorId,
        parentDepartmentId,
        servicesOffered,
        operationalHours,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        hospital: {
          select: { id: true, name: true }
        },
        category: true,
        floor: {
          select: { id: true, floorName: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: newDepartment,
      message: 'Department created successfully'
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create department',
      message: error.message 
    });
  }
});

// Patient Routes
app.get('/api/patients', async (req, res) => {
  try {
    const { hospitalId, patientStatus, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (hospitalId) where.hospitalId = hospitalId;
    if (patientStatus) where.patientStatus = patientStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { 
          hospital: {
            select: { id: true, name: true, hospitalCode: true }
          },
          patientVisits: {
            take: 3,
            orderBy: { registrationTimestamp: 'desc' },
            include: {
              attendingPhysician: {
                include: {
                  staff: {
                    select: { 
                      personalDetails: true,
                      employeeId: true
                    }
                  }
                }
              }
            }
          },
          beds: {
            where: { status: 'occupied' },
            include: {
              room: {
                select: { roomNumber: true, roomName: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ]);
    
    res.json({
      success: true,
      data: patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch patients',
      message: error.message 
    });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const { 
      hospitalId, 
      patientNumber, 
      personalDetails, 
      bloodGroup, 
      contactDetails,
      emergencyContacts,
      allergies,
      chronicConditions
    } = req.body;
    
    if (!hospitalId || !personalDetails?.firstName || !personalDetails?.lastName) {
      return res.status(400).json({
        success: false,
        error: 'Hospital ID, first name, and last name are required'
      });
    }

    const newPatient = await prisma.patient.create({
      data: { 
        hospitalId, 
        patientNumber, 
        personalDetails, 
        bloodGroup,
        contactDetails,
        emergencyContacts,
        allergies,
        chronicConditions,
        patientStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        hospital: {
          select: { id: true, name: true, hospitalCode: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: newPatient,
      message: 'Patient created successfully'
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create patient',
      message: error.message 
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing server gracefully...');
  
  await prisma.$disconnect();
  console.log('Database connection closed.');
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Hospital Management System API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`👥 Role management: http://localhost:${PORT}/api/roles/*`);
  console.log(`🔑 Permission management: http://localhost:${PORT}/api/permissions/*`);
  console.log(`👨‍⚕️ Staff management: http://localhost:${PORT}/api/staff/*`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing
module.exports = app;