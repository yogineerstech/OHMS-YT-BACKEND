const express = require('express');
const router = express.Router();

// Import controller
const patientController = require('../controllers/patient.controller');

// Simple test routes without middleware
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Patient routes working',
    timestamp: new Date().toISOString()
  });
});

router.get('/controller-test', patientController.registerPatient || ((req, res) => {
  res.json({
    success: false,
    message: 'Controller method not found'
  });
}));

module.exports = router;
