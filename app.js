const env = require('dotenv/config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('./generated/prisma');

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

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpointnpm
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'OHMS Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
try {
  console.log('Loading superadmin routes...');
  app.use('/api/superadmin', require('./routes/superadmin.routes'));
  console.log('Superadmin routes loaded successfully');
} catch (error) {
  console.error('Error loading superadmin routes:', error.message);
}

try {
  console.log('Loading patient routes...');
  app.use('/api/patients', require('./routes/patient.routes'));
  console.log('Patient routes loaded successfully');
} catch (error) {
  console.error('Error loading patient routes:', error.message);
}

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route working',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - using proper Express route pattern
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
