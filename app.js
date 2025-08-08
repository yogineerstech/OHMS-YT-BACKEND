const env = require('dotenv/config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('./generated/prisma');
const hostpitalAdminStaffRoutes = require('./routes/hospitalAdmin.staff.routes');
const patientRoutes =  require('./routes/patient.routes');
const prisma = new PrismaClient();
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080'  // Vite dev server
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

//patient routes
app.use('/api/patients',patientRoutes);

// Super admin routes
app.use('/api/superadmin', require('./routes/superadmin.routes'));
app.use('/api/hospital-admin', require('./routes/hospitalAdmin.auth.routes'));
app.use('/api/hospital-admin/staff', hostpitalAdminStaffRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
