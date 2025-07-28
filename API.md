# Hospital Management System - Patient API Testing Guide

## Prerequisites
- Base URL: `http://localhost:3000` (adjust port as needed)
- Postman installed
- Valid authentication token (for protected routes)

## Authentication Setup

### Get Access Token for Protected Routes

**POST** `/api/auth/login`

**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "email": "admin@hospital.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "staff_id_here",
      "personalDetails": {
        "firstName": "John",
        "lastName": "Admin",
        "email": "admin@hospital.com"
      },
      "role": {
        "roleCode": "HOSPITAL_ADMIN"
      },
      "hospitalId": "hospital_id_here"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-07-28T10:00:00.000Z"
    }
  }
}
```

**Copy the `accessToken` for Authorization header: `Bearer YOUR_ACCESS_TOKEN_HERE`**

---

## Patient Registration API Testing

### 1. Full Patient Registration

**POST** `/api/patients/register`

**Headers:**
- `Content-Type`: `multipart/form-data`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN` (optional - public endpoint)

**Form Data Structure (matching frontend):**

```
personal: {
  "title": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "bloodGroup": "O+",
  "nationality": "Indian",
  "preferredLanguage": "English",
  "maritalStatus": "single",
  "occupation": "Software Engineer",
  "religion": "Hindu",
  "abhaId": "12-3456-7890-1234"
}

contact: {
  "primaryPhone": "9876543210",
  "secondaryPhone": "9876543211",
  "whatsappPhone": "9876543210",
  "email": "john.doe@email.com",
  "currentAddress": {
    "street": "123 Main Street, Sector 5",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001",
    "country": "India"
  },
  "permanentAddress": {
    "street": "123 Main Street, Sector 5",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001",
    "country": "India"
  },
  "sameAsCurrent": true,
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "9876543212",
    "relationship": "spouse",
    "email": "jane.doe@email.com",
    "address": "Same as patient"
  }
}

medical: {
  "allergies": [
    {
      "id": "allergy_1",
      "name": "Penicillin",
      "severity": "severe"
    },
    {
      "id": "allergy_2", 
      "name": "Dust",
      "severity": "mild"
    }
  ],
  "chronicConditions": ["Diabetes Type 2", "Hypertension"],
  "currentMedications": [
    {
      "id": "med_1",
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "Twice daily"
    },
    {
      "id": "med_2",
      "name": "Lisinopril", 
      "dosage": "10mg",
      "frequency": "Once daily"
    }
  ],
  "previousSurgeries": [
    {
      "id": "surgery_1",
      "procedure": "Appendectomy",
      "date": "2015-06-15",
      "hospital": "City Hospital",
      "complications": "None"
    }
  ],
  "familyHistory": ["Father: Heart Disease", "Mother: Diabetes"],
  "lifestyle": {
    "smoking": "never",
    "drinking": "occasional", 
    "exercise": "moderate",
    "screenTime": "4-6h",
    "eyeStrain": "mild"
  },
  "vitals": {
    "height": 175,
    "weight": 70,
    "bmi": 22.9,
    "bloodPressure": "120/80"
  }
}

insurance: {
  "hasInsurance": true,
  "paymentMethod": "insurance",
  "provider": "Star Health and Allied Insurance",
  "policyNumber": "SH123456789",
  "policyType": "Individual Health Insurance",
  "policyHolderName": "John Doe",
  "policyHolderRelation": "Self",
  "validityDate": "2024-12-31",
  "coverageAmount": 500000,
  "coPaymentPercentage": 10,
  "tpaName": "Medi Assist",
  "requiresPreAuth": ["Cataract Surgery", "LASIK Surgery"],
  "emergencyContacts": [
    {
      "id": "emergency_1",
      "name": "Jane Doe",
      "relationship": "Spouse",
      "primaryPhone": "9876543212",
      "secondaryPhone": "9876543213",
      "email": "jane.doe@email.com",
      "address": "Same as patient",
      "preferredContactMethod": "phone",
      "availableHours": "24/7",
      "livesWithPatient": true,
      "hasKeys": true,
      "priority": 1
    },
    {
      "id": "emergency_2",
      "name": "Robert Doe",
      "relationship": "Parent",
      "primaryPhone": "9876543214",
      "email": "robert.doe@email.com",
      "address": "456 Secondary Street, Mumbai",
      "preferredContactMethod": "phone",
      "availableHours": "Business Hours",
      "livesWithPatient": false,
      "hasKeys": false,
      "priority": 2
    }
  ]
}

consent: {
  "medicalConsent": true,
  "privacyPolicy": true,
  "marketingConsent": false,
  "appointmentReminders": {
    "sms": true,
    "email": true,
    "whatsapp": true
  },
  "healthNewsletters": {
    "daily": false,
    "weekly": true,
    "monthly": false
  },
  "promotionalOffers": false,
  "researchParticipation": false,
  "photoVideoConsent": true,
  "abhaIdVerified": true,
  "otpVerified": true,
  "digitalSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "consentDate": "2025-07-28T06:00:00.000Z",
  "consentBy": "John Doe",
  "consentMethod": "digital"
}

hospitalId: "hospital_id_here"

files: [Upload actual files]
- profilePhoto: [Image file]
- governmentId: [PDF/Image file]
- addressProof: [PDF/Image file] 
- insuranceCardFront: [Image file]
- insuranceCardBack: [Image file]
- medicalRecords: [Array of PDF/Image files]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "patient": {
      "id": "patient_id_here",
      "patientNumber": "PAT001",
      "qrCode": "QR_CODE_STRING",
      "mrn": "MRN001",
      "personalDetails": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@email.com"
      },
      "contactDetails": {
        "primaryPhone": "9876543210",
        "email": "john.doe@email.com"
      },
      "patientStatus": "active"
    }
  }
}
```

---

### 2. Quick Patient Registration

**POST** `/api/patients/register/quick`

**Headers:**
- `Content-Type`: `multipart/form-data`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN` (optional)

**Form Data (Minimal Required):**

```
personal: {
  "title": "Ms",
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1995-08-20",
  "gender": "female",
  "bloodGroup": "A+",
  "nationality": "Indian",
  "preferredLanguage": "English"
}

contact: {
  "primaryPhone": "9876543213",
  "email": "jane.smith@email.com",
  "currentAddress": {
    "street": "456 Quick Street",
    "city": "Delhi",
    "state": "Delhi",
    "pinCode": "110001",
    "country": "India"
  },
  "permanentAddress": {
    "street": "456 Quick Street",
    "city": "Delhi", 
    "state": "Delhi",
    "pinCode": "110001",
    "country": "India"
  },
  "sameAsCurrent": true,
  "emergencyContact": {
    "name": "John Smith",
    "phone": "9876543214",
    "relationship": "parent"
  }
}

consent: {
  "treatmentConsent": true,
  "dataProcessingConsent": true,
  "communicationConsent": true,
  "consentDate": "2025-07-28T06:00:00.000Z",
  "consentBy": "Jane Smith"
}

hospitalId: "hospital_id_here"

files: [Optional - basic documents only]
- profilePhoto: [Image file]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Quick registration completed successfully",
  "data": {
    "patient": {
      "id": "patient_id_here",
      "patientNumber": "PAT002",
      "qrCode": "QR_CODE_STRING",
      "mrn": "MRN002",
      "personalDetails": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "patientStatus": "partial_registration"
    },
    "nextSteps": {
      "message": "Complete your registration by providing medical history, insurance details, and consent information",
      "completeRegistrationUrl": "/api/patients/patient_id_here/complete"
    }
  }
}
```

---

### 3. Complete Partial Registration

**PUT** `/api/patients/:patientId/complete`

**URL Example:** `/api/patients/64f123abc456def789/complete`

**Headers:**
- `Content-Type`: `multipart/form-data`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN` (optional)

**Form Data (Remaining fields from full registration):**

```
medical: {
  "allergies": [
    {
      "id": "allergy_1",
      "name": "Shellfish",
      "severity": "moderate"
    }
  ],
  "chronicConditions": ["Asthma"],
  "currentMedications": [
    {
      "id": "med_1", 
      "name": "Inhaler",
      "dosage": "2 puffs",
      "frequency": "As needed"
    }
  ],
  "previousSurgeries": [],
  "familyHistory": ["Mother: Asthma"],
  "lifestyle": {
    "smoking": "never",
    "drinking": "never",
    "exercise": "light",
    "screenTime": "2-4h", 
    "eyeStrain": "none"
  }
}

insurance: {
  "hasInsurance": false,
  "paymentMethod": "cash",
  "emergencyContacts": [
    {
      "id": "emergency_1",
      "name": "John Smith",
      "relationship": "Parent",
      "primaryPhone": "9876543214",
      "email": "john.smith@email.com",
      "preferredContactMethod": "phone",
      "availableHours": "24/7",
      "livesWithPatient": false,
      "hasKeys": true,
      "priority": 1
    }
  ]
}

consent: {
  "medicalConsent": true,
  "privacyPolicy": true,
  "marketingConsent": true,
  "appointmentReminders": {
    "sms": true,
    "email": false,
    "whatsapp": true
  },
  "healthNewsletters": {
    "daily": false,
    "weekly": false,
    "monthly": true
  },
  "promotionalOffers": true,
  "researchParticipation": false,
  "photoVideoConsent": false,
  "otpVerified": true,
  "digitalSignature": "data:image/png;base64,signature_data_here",
  "consentDate": "2025-07-28T07:00:00.000Z",
  "consentBy": "Jane Smith",
  "consentMethod": "digital"
}

files: [Complete document uploads]
- governmentId: [PDF/Image file]
- addressProof: [PDF/Image file]
- medicalRecords: [Array of files]
```

---

### 4. Search Patient

**GET** `/api/patients/search/:identifier`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**URL Examples:**
- `/api/patients/search/9876543210` (by phone)
- `/api/patients/search/john.doe@email.com` (by email)
- `/api/patients/search/PAT001` (by patient number)
- `/api/patients/search/QR_CODE_STRING` (by QR code)

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient found",
  "data": {
    "patient": {
      "id": "patient_id_here",
      "patientNumber": "PAT001",
      "personalDetails": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "contactDetails": {
        "primaryPhone": "9876543210"
      },
      "patientStatus": "active"
    }
  }
}
```

---

### 5. Get Patient by ID

**GET** `/api/patients/:patientId`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**URL Example:** `/api/patients/64f123abc456def789`

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient retrieved successfully",
  "data": {
    "patient": {
      "id": "patient_id_here",
      "patientNumber": "PAT001",
      "mrn": "MRN001",
      "personalDetails": {
        "firstName": "John",
        "lastName": "Doe",
        "dateOfBirth": "1990-05-15",
        "gender": "male",
        "bloodGroup": "O+"
      },
      "contactDetails": {
        "primaryPhone": "9876543210",
        "email": "john.doe@email.com"
      },
      "medicalHistory": {
        "allergies": [{"name": "Penicillin", "severity": "severe"}],
        "chronicConditions": ["Diabetes Type 2"]
      },
      "patientStatus": "active",
      "createdAt": "2025-07-28T06:00:00.000Z"
    }
  }
}
```

---

### 6. Get All Patients (with Pagination)

**GET** `/api/patients`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Query Parameters:**
- `page=1`
- `limit=10`
- `status=active`
- `registrationMethod=full`
- `search=john`
- `sortBy=createdAt`
- `sortOrder=desc`

**URL Example:** `/api/patients?page=1&limit=10&status=active&search=john`

**Expected Response:**
```json
{
  "success": true,
  "message": "Patients retrieved successfully",
  "data": {
    "patients": [
      {
        "id": "patient_id_here",
        "patientNumber": "PAT001",
        "personalDetails": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "contactDetails": {
          "primaryPhone": "9876543210"
        },
        "patientStatus": "active",
        "registrationMethod": "full",
        "createdAt": "2025-07-28T06:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 50,
      "limit": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 7. Update Patient

**PUT** `/api/patients/:patientId`

**Headers:**
- `Content-Type`: `multipart/form-data`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Form Data (partial updates allowed):**

```
personal: {
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "occupation": "Senior Software Engineer"
}

contact: {
  "primaryPhone": "9876543299",
  "email": "john.updated@email.com",
  "secondaryPhone": "9876543298"
}

medical: {
  "allergies": [
    {
      "id": "allergy_1",
      "name": "Penicillin", 
      "severity": "severe"
    },
    {
      "id": "allergy_3",
      "name": "Pollen",
      "severity": "mild"
    }
  ],
  "vitals": {
    "weight": 72,
    "bmi": 23.5,
    "bloodPressure": "125/82"
  }
}

files: [Optional - new document uploads]
- profilePhoto: [New image file]
- medicalRecords: [Additional medical records]
```

---

### 8. Generate New QR Code

**POST** `/api/patients/:patientId/generate-qr`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**URL Example:** `/api/patients/64f123abc456def789/generate-qr`

**Expected Response:**
```json
{
  "success": true,
  "message": "New QR code generated successfully",
  "data": {
    "patientId": "patient_id_here",
    "qrCode": "NEW_QR_CODE_STRING",
    "patientNumber": "PAT001"
  }
}
```

---

### 9. Get QR Code Image

**GET** `/api/patients/:patientId/qr-code`

**URL Example:** `/api/patients/64f123abc456def789/qr-code`

**Response:** QR Code image (PNG format)

---

### 10. Send OTP for Registration

**POST** `/api/patients/send-otp`

**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "phone": "9876543210",
  "email": "john.doe@email.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "9876543210",
    "email": "john.doe@email.com",
    "expiresIn": 300,
    "otp": "123456"
  }
}
```

---

### 11. Verify OTP

**POST** `/api/patients/verify-otp`

**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "phone": "9876543210",
    "verified": true
  }
}
```

---

### 12. Verify ABHA ID

**POST** `/api/patients/verify-abha`

**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "abhaId": "12-3456-7890-1234"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ABHA ID verified successfully",
  "data": {
    "abhaId": "12-3456-7890-1234",
    "verified": true,
    "details": {
      "status": "active",
      "issueDate": "2023-01-01",
      "expiryDate": "2033-01-01"
    }
  }
}
```

---

### 13. Get Patient Documents

**GET** `/api/patients/:patientId/documents`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**URL Example:** `/api/patients/64f123abc456def789/documents`

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient documents retrieved successfully",
  "data": {
    "documents": {
      "identificationDocuments": [
        {
          "filename": "government_id_123.pdf",
          "originalName": "aadhar_card.pdf",
          "url": "http://localhost:3000/uploads/patients/documents/government-ids/government_id_123.pdf",
          "uploadDate": "2025-07-28T06:00:00.000Z"
        }
      ],
      "profilePhoto": {
        "filename": "profile_123.jpg",
        "url": "http://localhost:3000/uploads/patients/profiles/profile_123.jpg"
      },
      "insuranceCards": [
        {
          "filename": "insurance_front_123.jpg",
          "url": "http://localhost:3000/uploads/patients/documents/insurance-cards/insurance_front_123.jpg"
        }
      ]
    }
  }
}
```

---

### 14. Add Patient Documents

**POST** `/api/patients/:patientId/documents`

**Headers:**
- `Content-Type`: `multipart/form-data`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Form Data:**
```
files: [Upload new document files]
- medicalRecords: [Array of PDF/Image files]
- insuranceCardFront: [Image file]
- addressProof: [PDF/Image file]
```

---

### 15. Update Patient Status

**PATCH** `/api/patients/:patientId/status`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Body:**
```json
{
  "status": "inactive",
  "reason": "Patient moved to different city"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient status updated successfully",
  "data": {
    "patient": {
      "id": "patient_id_here",
      "patientStatus": "inactive",
      "updatedAt": "2025-07-28T07:00:00.000Z"
    }
  }
}
```

---

### 16. Get Registration Statistics

**GET** `/api/patients/stats/registration`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Query Parameters:**
- `startDate=2025-07-01`
- `endDate=2025-07-31`
- `groupBy=day`

**URL Example:** `/api/patients/stats/registration?startDate=2025-07-01&endDate=2025-07-31&groupBy=day`

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration statistics retrieved successfully",
  "data": {
    "totalRegistrations": 150,
    "fullRegistrations": 120,
    "quickRegistrations": 30,
    "completedRegistrations": 140,
    "pendingCompletions": 10,
    "periodStats": [
      {
        "date": "2025-07-01",
        "count": 5,
        "fullCount": 3,
        "quickCount": 2
      },
      {
        "date": "2025-07-02", 
        "count": 8,
        "fullCount": 6,
        "quickCount": 2
      }
    ]
  }
}
```

---

## Common Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "personal.firstName",
      "message": "First name is required",
      "value": ""
    },
    {
      "field": "contact.phone",
      "message": "Phone number must be a valid 10-digit Indian mobile number",
      "value": "123"
    }
  ]
}
```

### 400 Bad Request - File Upload Error
```json
{
  "success": false,
  "message": "File size too large. Maximum size is 15MB per file.",
  "error": {
    "code": "LIMIT_FILE_SIZE",
    "field": "medicalRecords"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Patient not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to register patient",
  "error": "Database connection error"
}
```

---

## Testing Notes

### Frontend to Backend Data Mapping:
1. **Form Data Structure**: All complex objects (personal, contact, medical, insurance, consent) are sent as JSON strings in form-data and parsed by `parseFormDataJSON` middleware
2. **File Uploads**: Uses `multipart/form-data` with specific field names matching frontend structure
3. **Validation**: Backend validates against exact frontend data structure
4. **Hospital Context**: `hospitalId` can be from user context or request body

### Testing Best Practices:
1. **Authentication**: Get valid token first for protected routes
2. **File Uploads**: Use actual files (images/PDFs) for document testing
3. **Data Validation**: Test with invalid data to verify validation
4. **Error Handling**: Test file size limits, invalid formats
5. **Flow Testing**: Test quick registration → completion flow
6. **Hospital Scope**: Ensure data is scoped to correct hospital
7. **Status Transitions**: Test different patient status updates
8. **Search Functionality**: Test various search parameters

### File Upload Limits:
- Profile Photo: 5MB (JPEG, PNG, WebP)
- Government ID: 10MB (JPEG, PNG, WebP, PDF)
- Insurance Cards: 5MB each (JPEG, PNG, WebP)
- Medical Records: 15MB each (JPEG, PNG, WebP, PDF)
- Maximum 10 files per request

### Required vs Optional Fields:
**Quick Registration (Required)**:
- personal: firstName, lastName, dateOfBirth, gender
- contact: primaryPhone, currentAddress (all fields)
- consent: treatmentConsent, dataProcessingConsent, communicationConsent

**Full Registration (Additional)**:
- All medical history fields (optional)
- Insurance details (optional if hasInsurance = false)
- Complete consent preferences
- Document uploads