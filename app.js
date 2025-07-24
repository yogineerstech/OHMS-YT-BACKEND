const env = require('dotenv/config');
const express = require('express');
const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Hospital Network Routes
app.get('/hospital-networks', async (req, res) => {
  try {
    const networks = await prisma.hospitalNetwork.findMany({
      include: { hospitals: true }
    });
    res.json(networks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospital networks' });
  }
});

app.post('/hospital-networks', async (req, res) => {
  try {
    const { networkName, networkCode, networkType } = req.body;
    const newNetwork = await prisma.hospitalNetwork.create({
      data: { networkName, networkCode, networkType }
    });
    res.json(newNetwork);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hospital network' });
  }
});

// Hospital Routes
app.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: { 
        network: true,
        departments: true,
        staff: true
      }
    });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

app.post('/hospitals', async (req, res) => {
  try {
    const { name, hospitalCode, hospitalType, networkId } = req.body;
    const newHospital = await prisma.hospital.create({
      data: { name, hospitalCode, hospitalType, networkId }
    });
    res.json(newHospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hospital' });
  }
});

// Staff Routes
app.get('/staff', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      include: { 
        hospital: true,
        role: true,
        department: true,
        doctor: true,
        nurse: true
      }
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

app.post('/staff', async (req, res) => {
  try {
    const { hospitalId, employeeId, personalDetails, roleId, departmentId } = req.body;
    const newStaff = await prisma.staff.create({
      data: { hospitalId, employeeId, personalDetails, roleId, departmentId }
    });
    res.json(newStaff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// Patient Routes
app.get('/patients', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: { 
        hospital: true,
        patientVisits: true
      }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.post('/patients', async (req, res) => {
  try {
    const { hospitalId, patientNumber, personalDetails, bloodGroup } = req.body;
    const newPatient = await prisma.patient.create({
      data: { hospitalId, patientNumber, personalDetails, bloodGroup }
    });
    res.json(newPatient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Department Routes
app.get('/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { 
        hospital: true,
        category: true,
        staff: true
      }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

app.post('/departments', async (req, res) => {
  try {
    const { hospitalId, name, code, departmentType, categoryId } = req.body;
    const newDepartment = await prisma.department.create({
      data: { hospitalId, name, code, departmentType, categoryId }
    });
    res.json(newDepartment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
