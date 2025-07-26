const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory structure if it doesn't exist
const createUploadDirs = () => {
  const uploadDirs = [
    'uploads/patients/profiles',
    'uploads/patients/documents/government-ids',
    'uploads/patients/documents/address-proofs',
    'uploads/patients/documents/insurance-cards',
    'uploads/patients/documents/medical-records'
  ];

  uploadDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

// Initialize upload directories
createUploadDirs();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/patients/';
    
    // Determine upload path based on field name
    switch (file.fieldname) {
      case 'profilePhoto':
        uploadPath += 'profiles/';
        break;
      case 'governmentId':
        uploadPath += 'documents/government-ids/';
        break;
      case 'addressProof':
        uploadPath += 'documents/address-proofs/';
        break;
      case 'insuranceCardFront':
      case 'insuranceCardBack':
        uploadPath += 'documents/insurance-cards/';
        break;
      case 'medicalRecords':
        uploadPath += 'documents/medical-records/';
        break;
      default:
        uploadPath += 'documents/';
    }
    
    const fullPath = path.join(process.cwd(), uploadPath);
    
    // Ensure directory exists
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20);
    
    const filename = `${file.fieldname}_${timestamp}_${randomString}_${baseName}${extension}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types for each field
  const allowedTypes = {
    profilePhoto: {
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Profile photo (JPEG, PNG, WebP)'
    },
    governmentId: {
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
      description: 'Government ID (JPEG, PNG, WebP, PDF)'
    },
    addressProof: {
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
      description: 'Address proof (JPEG, PNG, WebP, PDF)'
    },
    insuranceCardFront: {
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Insurance card front (JPEG, PNG, WebP)'
    },
    insuranceCardBack: {
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Insurance card back (JPEG, PNG, WebP)'
    },
    medicalRecords: {
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
      maxSize: 15 * 1024 * 1024, // 15MB
      description: 'Medical records (JPEG, PNG, WebP, PDF)'
    }
  };

  const fieldConfig = allowedTypes[file.fieldname];
  
  if (!fieldConfig) {
    return cb(new Error(`Upload not allowed for field: ${file.fieldname}`), false);
  }

  // Check file type
  if (!fieldConfig.mimeTypes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${fieldConfig.description}`), false);
  }

  // File size will be checked by multer limits
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 non-file fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024 // Maximum field value size (1MB for text fields)
  }
});

// Middleware for patient registration file uploads
const patientRegistrationUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'insuranceCardFront', maxCount: 1 },
  { name: 'insuranceCardBack', maxCount: 1 },
  { name: 'medicalRecords', maxCount: 5 }
]);

// Error handling middleware for upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum size is 15MB per file.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files allowed.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in the request.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected file field: ${error.field}`;
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart form.';
        break;
      default:
        message = error.message || 'Unknown upload error';
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
      error: {
        code: error.code,
        field: error.field
      }
    });
  }

  // Handle custom file filter errors
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: {
        code: 'INVALID_FILE_TYPE'
      }
    });
  }

  // Handle other upload-related errors
  if (error.message && error.message.includes('Upload not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: {
        code: 'UPLOAD_NOT_ALLOWED'
      }
    });
  }

  // Pass other errors to the default error handler
  next(error);
};

// Utility function to get file URL
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
  return `${baseUrl}${relativePath}`;
};

// Utility function to process uploaded files
const processUploadedFiles = (req) => {
  const files = req.files || {};
  const processedFiles = {};

  Object.keys(files).forEach(fieldName => {
    const fileArray = files[fieldName];
    
    if (fieldName === 'medicalRecords') {
      // Handle multiple medical records
      processedFiles[fieldName] = fileArray.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: getFileUrl(req, file.path),
        uploadDate: new Date().toISOString()
      }));
    } else {
      // Handle single files
      const file = fileArray[0];
      processedFiles[fieldName] = {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: getFileUrl(req, file.path),
        uploadDate: new Date().toISOString()
      };
    }
  });

  return processedFiles;
};

// Utility function to clean up uploaded files (in case of registration failure)
const cleanupUploadedFiles = (files) => {
  if (!files) return;

  Object.values(files).forEach(fileData => {
    if (Array.isArray(fileData)) {
      // Handle multiple files (like medical records)
      fileData.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    } else {
      // Handle single file
      if (fileData.path && fs.existsSync(fileData.path)) {
        fs.unlinkSync(fileData.path);
      }
    }
  });
};

module.exports = {
  patientRegistrationUpload,
  handleUploadError,
  processUploadedFiles,
  cleanupUploadedFiles,
  getFileUrl
};
