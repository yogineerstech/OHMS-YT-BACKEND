# Hospital Management System - Patient API Testing Guide

## Prerequisites
- Base URL: `http://localhost:3000` (adjust port as needed)
- Postman installed
- Valid authentication token (for protected routes)

# Hospital Management System - Complete API Documentation

## Prerequisites
- Base URL: `http://localhost:3000` (adjust port as needed)
- Postman installed
- Valid authentication tokens for protected routes

## Authentication Overview

The system has two types of authentication:
1. **Super Admin Authentication**: For system administration and hospital management
2. **Hospital Staff Authentication**: For hospital-specific operations (patients, appointments, etc.)

### Get Super Admin Token

**POST** `/api/superadmin/login`

**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "email": "superadmin@ohms.com",
  "password": "SuperAdmin@123",
  "rememberMe": false
}
```

### Get Hospital Staff Token

**Note**: Hospital staff authentication endpoints are not yet implemented in the current codebase. Patient operations can be performed without authentication in the current implementation, or you can use the Super Admin token for testing protected routes.

**Copy the `accessToken` for Authorization header: `Bearer YOUR_ACCESS_TOKEN_HERE`**

---

## Patient Data Structure Format

### Important Notes for Frontend Integration:

1. **Content-Type**: All patient registration/update endpoints use `multipart/form-data` to support file uploads
2. **JSON Parsing**: Complex objects (personal, contact, medical, insurance, consent) must be sent as JSON strings in form-data fields
3. **File Uploads**: Files are uploaded as actual file objects in the form-data
4. **Hospital Context**: `hospitalId` is required for all patient operations

### Data Structure Breakdown:

#### Personal Details Object:
```javascript
personal: {
  "title": "Mr/Ms/Dr",           // Required
  "firstName": "string",         // Required
  "lastName": "string",          // Required  
  "dateOfBirth": "YYYY-MM-DD",   // Required
  "gender": "male/female/other", // Required
  "bloodGroup": "A+/B+/O+/AB+/A-/B-/O-/AB-", // Optional
  "nationality": "string",       // Optional
  "preferredLanguage": "string", // Optional
  "maritalStatus": "single/married/divorced/widowed", // Optional
  "occupation": "string",        // Optional
  "religion": "string",          // Optional
  "abhaId": "12-3456-7890-1234"  // Optional (ABHA format)
}
```

#### Contact Details Object:
```javascript
contact: {
  "primaryPhone": "10-digit number",      // Required
  "secondaryPhone": "10-digit number",    // Optional
  "whatsappPhone": "10-digit number",     // Optional
  "email": "valid@email.com",             // Required for full registration
  "currentAddress": {                     // Required
    "street": "string",
    "city": "string", 
    "state": "string",
    "pinCode": "6-digit code",
    "country": "string"
  },
  "permanentAddress": {                   // Required
    "street": "string",
    "city": "string",
    "state": "string", 
    "pinCode": "6-digit code",
    "country": "string"
  },
  "sameAsCurrent": true/false,           // If true, permanentAddress = currentAddress
  "emergencyContact": {                   // Required
    "name": "string",
    "phone": "10-digit number",
    "relationship": "spouse/parent/sibling/friend/other",
    "email": "valid@email.com",           // Optional
    "address": "string"                   // Optional
  }
}
```

#### Medical History Object (Full Registration Only):
```javascript
medical: {
  "allergies": [                          // Optional array
    {
      "id": "unique_id",
      "name": "Allergy name",
      "severity": "mild/moderate/severe"
    }
  ],
  "chronicConditions": ["string array"],  // Optional
  "currentMedications": [                 // Optional array
    {
      "id": "unique_id",
      "name": "Medicine name",
      "dosage": "dosage info",
      "frequency": "frequency info"
    }
  ],
  "previousSurgeries": [                  // Optional array
    {
      "id": "unique_id", 
      "procedure": "Surgery name",
      "date": "YYYY-MM-DD",
      "hospital": "Hospital name",
      "complications": "string"
    }
  ],
  "familyHistory": ["string array"],      // Optional
  "lifestyle": {                          // Optional
    "smoking": "never/former/current",
    "drinking": "never/occasional/regular",
    "exercise": "none/light/moderate/heavy", 
    "screenTime": "0-2h/2-4h/4-6h/6+h",
    "eyeStrain": "none/mild/moderate/severe"
  },
  "vitals": {                            // Optional
    "height": number,                     // in cm
    "weight": number,                     // in kg
    "bmi": number,                        // calculated
    "bloodPressure": "120/80"             // string format
  }
}
```

#### Insurance Details Object (Full Registration Only):
```javascript
insurance: {
  "hasInsurance": true/false,             // Required
  "paymentMethod": "cash/insurance/card", // Required
  "provider": "string",                   // Required if hasInsurance = true
  "policyNumber": "string",               // Required if hasInsurance = true
  "policyType": "string",                 // Optional
  "policyHolderName": "string",           // Required if hasInsurance = true
  "policyHolderRelation": "self/spouse/parent/child", // Required if hasInsurance = true
  "validityDate": "YYYY-MM-DD",           // Required if hasInsurance = true
  "coverageAmount": number,               // Optional
  "coPaymentPercentage": number,          // Optional
  "tpaName": "string",                    // Optional
  "requiresPreAuth": ["string array"],    // Optional
  "emergencyContacts": [                  // Optional array
    {
      "id": "unique_id",
      "name": "string",
      "relationship": "string",
      "primaryPhone": "10-digit number",
      "secondaryPhone": "10-digit number", // Optional
      "email": "valid@email.com",          // Optional
      "address": "string",                 // Optional
      "preferredContactMethod": "phone/email/whatsapp",
      "availableHours": "string",          // Optional
      "livesWithPatient": true/false,      // Optional
      "hasKeys": true/false,               // Optional
      "priority": number                   // 1, 2, 3, etc.
    }
  ]
}
```

#### Consent Object:
```javascript
consent: {
  // Quick Registration (Required)
  "treatmentConsent": true/false,         // Required for quick
  "dataProcessingConsent": true/false,    // Required for quick  
  "communicationConsent": true/false,     // Required for quick
  
  // Full Registration (Optional)
  "medicalConsent": true/false,           // Optional
  "privacyPolicy": true/false,            // Optional
  "marketingConsent": true/false,         // Optional
  "appointmentReminders": {               // Optional
    "sms": true/false,
    "email": true/false,
    "whatsapp": true/false
  },
  "healthNewsletters": {                  // Optional
    "daily": true/false,
    "weekly": true/false,
    "monthly": true/false
  },
  "promotionalOffers": true/false,        // Optional
  "researchParticipation": true/false,    // Optional
  "photoVideoConsent": true/false,        // Optional
  "abhaIdVerified": true/false,           // Optional
  "otpVerified": true/false,              // Optional
  "digitalSignature": "base64_string",    // Optional
  "consentDate": "ISO_date_string",       // Required
  "consentBy": "Patient name",            // Required
  "consentMethod": "digital/physical"     // Optional
}
```

### Postman Setup Instructions:

1. **Create New Request**: POST method
2. **Set Headers**: 
   - `Authorization: Bearer YOUR_TOKEN` (for protected routes)
   - Do NOT set `Content-Type` (Postman auto-sets for form-data)
3. **Body Tab**: Select "form-data"
4. **Add Text Fields**: Add keys like `personal`, `contact`, etc. and paste JSON strings as values
5. **Add File Fields**: Add keys like `profilePhoto`, `governmentId`, etc. and select actual files
6. **Hospital ID**: Add `hospitalId` as text field with actual hospital ID

### Example Postman Form-Data Setup:

```
Key: personal          Type: Text    Value: {"title":"Mr","firstName":"John","lastName":"Doe"...}
Key: contact           Type: Text    Value: {"primaryPhone":"9876543210","email":"john@test.com"...}
Key: medical           Type: Text    Value: {"allergies":[],"chronicConditions":[]...}
Key: insurance         Type: Text    Value: {"hasInsurance":false,"paymentMethod":"cash"...}
Key: consent           Type: Text    Value: {"treatmentConsent":true,"dataProcessingConsent":true...}
Key: hospitalId        Type: Text    Value: actual_hospital_id_from_database
Key: profilePhoto      Type: File    Value: [Select image file]
Key: governmentId      Type: File    Value: [Select PDF/image file] 
Key: medicalRecords    Type: File    Value: [Select file(s)]
```

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

---

## Super Admin API Testing

### 1. Check Super Admin Exists

**GET** `/api/superadmin/exists`

**Headers:**
- `Content-Type`: `application/json`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "exists": false,
    "message": "No super admin found. Initial setup required."
  }
}
```

---

### 2. Initial Super Admin Setup

**POST** `/api/superadmin/setup`

**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "personalDetails": {
    "firstName": "Super",
    "lastName": "Admin",
    "email": "superadmin@ohms.com",
    "phone": "9999999999"
  },
  "password": "SuperAdmin@123",
  "confirmPassword": "SuperAdmin@123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Super admin setup completed successfully",
  "data": {
    "user": {
      "id": "superadmin_id_here",
      "personalDetails": {
        "firstName": "Super",
        "lastName": "Admin",
        "email": "superadmin@ohms.com"
      },
      "role": {
        "roleCode": "SUPER_ADMIN"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-07-31T10:00:00.000Z"
    }
  }
}
```

---

### 3. Super Admin Login

**POST** `/api/superadmin/login`

**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "email": "superadmin@ohms.com",
  "password": "SuperAdmin@123",
  "rememberMe": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Super admin login successful",
  "data": {
    "user": {
      "id": "superadmin_id_here",
      "personalDetails": {
        "firstName": "Super",
        "lastName": "Admin",
        "email": "superadmin@ohms.com",
        "phone": "9999999999"
      },
      "role": {
        "roleCode": "SUPER_ADMIN"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-07-31T10:00:00.000Z"
    },
    "permissions": [
      {
        "action": "manage",
        "subject": "all"
      }
    ]
  }
}
```

---

### 4. Get System Statistics

**GET** `/api/superadmin/stats`

**Headers:**
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "System statistics retrieved successfully",
  "data": {
    "hospitals": {
      "total": 25,
      "active": 20,
      "inactive": 5
    },
    "patients": {
      "total": 1250,
      "activeRegistrations": 1100,
      "quickRegistrations": 150
    },
    "staff": {
      "total": 350,
      "hospitalAdmins": 25,
      "doctors": 150,
      "nurses": 175
    },
    "systemHealth": {
      "status": "healthy",
      "uptime": "15 days",
      "memoryUsage": "65%",
      "diskUsage": "40%"
    }
  }
}
```

---

### 5. Get All Hospitals

**GET** `/api/superadmin/hospitals`

**Headers:**
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "Hospitals retrieved successfully",
  "data": {
    "hospitals": [
      {
        "id": "hospital_id_1",
        "name": "City General Hospital",
        "status": "active",
        "contactInfo": {
          "email": "admin@citygeneral.com",
          "phone": "9876543210"
        },
        "address": {
          "street": "123 Main Street",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pinCode": "400001"
        },
        "createdAt": "2025-01-15T06:00:00.000Z",
        "adminCount": 2,
        "patientCount": 450
      }
    ]
  }
}
```

---

### 6. Create Hospital Network

**POST** `/api/superadmin/networks`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Body:**
```json
{
  "name": "Metro Health Network",
  "description": "Network of hospitals in metropolitan area",
  "region": "Western India",
  "contactInfo": {
    "email": "network@metrohealth.com",
    "phone": "9876543210"
  }
}
```

---

### 7. Get Hospital Networks

**GET** `/api/superadmin/networks`

**Headers:**
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "Hospital networks retrieved successfully",
  "data": {
    "networks": [
      {
        "id": "network_id_1",
        "name": "Metro Health Network",
        "description": "Network of hospitals in metropolitan area",
        "region": "Western India",
        "hospitalCount": 5,
        "createdAt": "2025-01-01T06:00:00.000Z"
      }
    ]
  }
}
```

---

### 8. Create Hospital

**POST** `/api/superadmin/hospitals`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Body:**
```json
{
  "name": "New Medical Center",
  "type": "multi_specialty",
  "licenseNumber": "MH/2025/001",
  "contactInfo": {
    "email": "admin@newmedical.com",
    "phone": "9876543210",
    "website": "https://newmedical.com"
  },
  "address": {
    "street": "456 Health Street",
    "city": "Pune",
    "state": "Maharashtra",
    "pinCode": "411001",
    "country": "India"
  },
  "networkId": "network_id_1",
  "settings": {
    "patientRegistrationEnabled": true,
    "onlineAppointments": true,
    "maxPatients": 1000
  }
}
```

---

### 9. Get Hospital by ID

**GET** `/api/superadmin/hospitals/:hospitalId`

**Headers:**
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**URL Example:** `/api/superadmin/hospitals/64f123abc456def789`

---

### 10. Update Hospital

**PUT** `/api/superadmin/hospitals/:hospitalId`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Body (partial updates allowed):**
```json
{
  "name": "Updated Medical Center",
  "contactInfo": {
    "phone": "9876543299",
    "email": "updated@newmedical.com"
  },
  "settings": {
    "maxPatients": 1500
  }
}
```

---

### 11. Toggle Hospital Status

**PATCH** `/api/superadmin/hospitals/:hospitalId/status`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Body:**
```json
{
  "status": "inactive",
  "reason": "Maintenance period"
}
```

---

### 12. Create Hospital Admin

**POST** `/api/superadmin/hospitals/:hospitalId/admins`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Body:**
```json
{
  "personalDetails": {
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@hospital.com",
    "phone": "9876543210"
  },
  "password": "Admin@123",
  "role": "HOSPITAL_ADMIN"
}
```

---

### 13. Get Hospital Admins

**GET** `/api/superadmin/hospitals/:hospitalId/admins`

**Headers:**
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

---

### 14. Reset Hospital Admin Password

**POST** `/api/superadmin/hospitals/:hospitalId/admins/:adminId/reset-password`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Body:**
```json
{
  "newPassword": "NewAdmin@123"
}
```

---

### 15. Deactivate Hospital Admin

**POST** `/api/superadmin/hospitals/:hospitalId/admins/:adminId/deactivate`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Body:**
```json
{
  "reason": "Staff resignation"
}
```

---

### 16. Get System Logs

**GET** `/api/superadmin/logs`

**Headers:**
- `Authorization`: `Bearer YOUR_SUPER_ADMIN_TOKEN`

**Query Parameters:**
- `level=error`
- `startDate=2025-07-01`
- `endDate=2025-07-31`
- `page=1`
- `limit=50`

---

## Additional Patient APIs

### 17. Bulk Import Patients

**POST** `/api/patients/bulk-import`

**Headers:**
- `Content-Type`: `multipart/form-data`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Form Data:**
```
file: [CSV/Excel file with patient data]
```

---

### 18. Export Patients Data

**GET** `/api/patients/export`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Query Parameters:**
- `format=csv` or `format=excel`
- `status=active`
- `startDate=2025-07-01`
- `endDate=2025-07-31`

**Response:** File download (CSV or Excel format)

---

### 19. Delete Patient Document

**DELETE** `/api/patients/:patientId/documents/:documentType`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**URL Example:** `/api/patients/64f123abc456def789/documents/governmentId`

---

### 20. Get Patient Visits Summary

**GET** `/api/patients/:patientId/visits-summary`

**Headers:**
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient visits summary retrieved successfully",
  "data": {
    "totalVisits": 15,
    "lastVisit": "2025-07-25T10:00:00.000Z",
    "upcomingAppointments": 2,
    "visitHistory": [
      {
        "date": "2025-07-25T10:00:00.000Z",
        "type": "consultation",
        "doctor": "Dr. Smith",
        "department": "Cardiology"
      }
    ]
  }
}
```

---

### 21. Merge Patient Records

**POST** `/api/patients/:patientId/merge`

**Headers:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Body:**
```json
{
  "targetPatientId": "64f456def789abc123",
  "reason": "Duplicate registration detected"
}
```

---

## System Utility APIs

### 22. Health Check

**GET** `/api/health`

**Expected Response:**
```json
{
  "success": true,
  "message": "OHMS Backend API is running",
  "timestamp": "2025-07-31T06:00:00.000Z"
}
```

---

### 23. Test Route

**GET** `/api/test`

**Expected Response:**
```json
{
  "success": true,
  "message": "Test route working",
  "timestamp": "2025-07-31T06:00:00.000Z"
}
```

---

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