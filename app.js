const env = require('dotenv/config');
const express = require('express');
const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());

// Super admin routes
app.use('/api/superadmin', require('./routes/superadmin.routes'));
app.use('/api/hospital-admin', require('./routes/hospitalAdmin.auth.routes'));
app.use('/api/hospital-admin/staff', require('./routes/hospitalAdmin.staff.routes'));
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
