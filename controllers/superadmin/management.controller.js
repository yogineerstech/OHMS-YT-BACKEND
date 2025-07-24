const superAdminService = require('../../services/superadmin.service');

/**
 * Check if super admin exists
 */
const checkSuperAdminExists = async (req, res) => {
  try {
    const exists = await superAdminService.superAdminExists();

    res.json({
      success: true,
      data: { 
        superAdminExists: exists,
        setupRequired: !exists
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check super admin status',
      error: error.message
    });
  }
};

/**
 * Get system statistics (super admin only)
 */
const getSystemStats = async (req, res) => {
  try {
    const stats = await superAdminService.getSystemStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics',
      error: error.message
    });
  }
};

/**
 * Get all hospitals (super admin only)
 */
const getAllHospitals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    const hospitals = await superAdminService.getAllHospitals({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status
    });

    res.json({
      success: true,
      data: hospitals
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get hospitals',
      error: error.message
    });
  }
};

/**
 * Activate/Deactivate hospital
 */
const toggleHospitalStatus = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { isActive } = req.body;

    const hospital = await superAdminService.toggleHospitalStatus(hospitalId, isActive);

    res.json({
      success: true,
      message: `Hospital ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: hospital
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital status',
      error: error.message
    });
  }
};

/**
 * Get system logs
 */
const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level, startDate, endDate } = req.query;
    
    const logs = await superAdminService.getSystemLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      level,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get system logs',
      error: error.message
    });
  }
};

module.exports = {
  checkSuperAdminExists,
  getSystemStats,
  getAllHospitals,
  toggleHospitalStatus,
  getSystemLogs
};