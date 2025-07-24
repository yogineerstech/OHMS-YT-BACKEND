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
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
