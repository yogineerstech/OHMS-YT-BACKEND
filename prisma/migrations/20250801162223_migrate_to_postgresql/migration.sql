-- CreateTable
CREATE TABLE "hospital_networks" (
    "id" TEXT NOT NULL,
    "networkName" TEXT NOT NULL,
    "networkCode" TEXT,
    "headquartersAddress" TEXT,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "gstin" TEXT,
    "primaryContact" JSONB,
    "configuration" JSONB,
    "networkType" TEXT,
    "accreditationDetails" JSONB,
    "regulatoryCompliance" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "networkId" TEXT,
    "name" TEXT NOT NULL,
    "hospitalCode" TEXT,
    "hospitalType" TEXT,
    "accreditationDetails" JSONB,
    "licenseDetails" JSONB,
    "address" TEXT,
    "coordinates" JSONB,
    "contactDetails" JSONB,
    "facilities" JSONB,
    "capacityDetails" JSONB,
    "operationalHours" JSONB,
    "emergencyServices" BOOLEAN NOT NULL DEFAULT false,
    "traumaCenterLevel" TEXT,
    "teachingHospital" BOOLEAN NOT NULL DEFAULT false,
    "researchFacility" BOOLEAN NOT NULL DEFAULT false,
    "telemedicineEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digitalHealthIntegration" JSONB,
    "abdmRegistration" JSONB,
    "configuration" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en', 'hi']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_categories" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryCode" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "colorCode" TEXT,
    "parentCategoryId" TEXT,
    "hierarchyLevel" INTEGER NOT NULL DEFAULT 1,
    "specializationType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "categoryId" TEXT,
    "floorId" TEXT,
    "parentDepartmentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "departmentType" TEXT,
    "specialtyType" TEXT,
    "services" JSONB,
    "operatingHours" JSONB,
    "contactInfo" JSONB,
    "staffCapacity" JSONB,
    "equipmentInventory" JSONB,
    "roomAllocations" JSONB,
    "appointmentSettings" JSONB,
    "emergencyProtocols" JSONB,
    "qualityMetrics" JSONB,
    "budgetAllocation" DOUBLE PRECISION,
    "revenueTarget" DOUBLE PRECISION,
    "performanceKPIs" JSONB,
    "accreditations" JSONB,
    "certifications" JSONB,
    "protocols" JSONB,
    "guidelines" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmergencyDepartment" BOOLEAN NOT NULL DEFAULT false,
    "acceptsWalkIns" BOOLEAN NOT NULL DEFAULT true,
    "requiresReferral" BOOLEAN NOT NULL DEFAULT false,
    "supportsTelemedicine" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "floorName" TEXT,
    "floorType" TEXT,
    "totalArea" DOUBLE PRECISION,
    "usableArea" DOUBLE PRECISION,
    "capacity" JSONB,
    "facilities" JSONB,
    "accessibilityFeatures" JSONB,
    "emergencyExits" JSONB,
    "fireSystemDetails" JSONB,
    "securityFeatures" JSONB,
    "maintenanceSchedule" JSONB,
    "energyEfficiencyRating" TEXT,
    "environmentalControls" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "accessLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT,
    "floorId" TEXT,
    "wardId" TEXT,
    "roomNumber" TEXT NOT NULL,
    "roomName" TEXT,
    "roomType" TEXT,
    "category" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "area" DOUBLE PRECISION,
    "amenities" JSONB,
    "equipment" JSONB,
    "facilities" JSONB,
    "accessibilityFeatures" JSONB,
    "pricing" JSONB,
    "maintenanceSchedule" JSONB,
    "cleaningProtocol" JSONB,
    "infectionControlMeasures" JSONB,
    "emergencyEquipment" JSONB,
    "communicationSystems" JSONB,
    "entertainmentSystems" JSONB,
    "climateControl" JSONB,
    "lighting" JSONB,
    "powerOutlets" JSONB,
    "networkConnectivity" JSONB,
    "securityFeatures" JSONB,
    "privacyLevel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "isUnderMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
    "lastSanitized" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "roomId" TEXT,
    "departmentId" TEXT,
    "wardId" TEXT,
    "patientId" TEXT,
    "bedNumber" TEXT NOT NULL,
    "bedType" TEXT,
    "bedCategory" TEXT,
    "bedStatus" TEXT NOT NULL DEFAULT 'available',
    "features" JSONB,
    "equipment" JSONB,
    "monitoring" JSONB,
    "safety" JSONB,
    "comfort" JSONB,
    "pricing" JSONB,
    "lastMaintenance" TIMESTAMP(3),
    "lastCleaning" TIMESTAMP(3),
    "maintenanceSchedule" JSONB,
    "cleaningProtocol" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isElectronic" BOOLEAN NOT NULL DEFAULT false,
    "hasOxygen" BOOLEAN NOT NULL DEFAULT false,
    "hasSuction" BOOLEAN NOT NULL DEFAULT false,
    "hasMonitor" BOOLEAN NOT NULL DEFAULT false,
    "hasIV" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION,
    "dimensions" JSONB,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "acquisitionDate" TIMESTAMP(3),
    "lastInspection" TIMESTAMP(3),
    "nextInspection" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "floorId" TEXT,
    "wardNumber" TEXT NOT NULL,
    "wardName" TEXT NOT NULL,
    "wardType" TEXT,
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "nursingStation" JSONB,
    "facilities" JSONB,
    "equipment" JSONB,
    "protocols" JSONB,
    "staffAllocation" JSONB,
    "operatingHours" JSONB,
    "visitingHours" JSONB,
    "securityLevel" TEXT,
    "accessControl" JSONB,
    "emergencyProcedures" JSONB,
    "infectionControl" JSONB,
    "qualityMetrics" JSONB,
    "patientSatisfaction" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isIsolationWard" BOOLEAN NOT NULL DEFAULT false,
    "supportsVentilation" BOOLEAN NOT NULL DEFAULT false,
    "hasNegativePressure" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT,
    "employeeId" TEXT,
    "personalDetails" JSONB,
    "contactDetails" JSONB,
    "emergencyContacts" JSONB,
    "identificationDocuments" JSONB,
    "professionalDetails" JSONB,
    "qualifications" JSONB,
    "certifications" JSONB,
    "licenses" JSONB,
    "specializations" JSONB,
    "experience" JSONB,
    "performanceMetrics" JSONB,
    "employmentDetails" JSONB,
    "contractDetails" JSONB,
    "payrollInformation" JSONB,
    "benefits" JSONB,
    "workSchedule" JSONB,
    "permissions" JSONB,
    "accessLevel" TEXT,
    "systemAccess" JSONB,
    "loginCredentials" JSONB,
    "role" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canLogin" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientNumber" TEXT,
    "mrn" TEXT,
    "abhaId" TEXT,
    "qrCode" TEXT,
    "barcode" TEXT,
    "personalDetails" JSONB,
    "contactDetails" JSONB,
    "emergencyContacts" JSONB,
    "demographics" JSONB,
    "identificationDocuments" JSONB,
    "bloodGroup" TEXT,
    "rhFactor" TEXT,
    "allergies" JSONB,
    "chronicConditions" JSONB,
    "familyHistory" JSONB,
    "socialHistory" JSONB,
    "medicalHistory" JSONB,
    "surgicalHistory" JSONB,
    "medicationHistory" JSONB,
    "immunizationRecords" JSONB,
    "insuranceDetails" JSONB,
    "financialInformation" JSONB,
    "paymentPreferences" JSONB,
    "creditLimit" DOUBLE PRECISION,
    "outstandingAmount" DOUBLE PRECISION,
    "preferences" JSONB,
    "communicationPreferences" JSONB,
    "culturalConsiderations" JSONB,
    "dietaryRestrictions" JSONB,
    "religiousPreferences" JSONB,
    "languagePreferences" TEXT[],
    "riskFactors" JSONB,
    "fallRiskScore" INTEGER,
    "infectionRiskLevel" TEXT,
    "medicationRiskFactors" JSONB,
    "biometricData" JSONB,
    "wearableDeviceData" JSONB,
    "digitalHealthRecords" JSONB,
    "telemedicinePreferences" JSONB,
    "consentStatus" JSONB,
    "privacySettings" JSONB,
    "dataSharingPreferences" JSONB,
    "patientType" TEXT,
    "patientStatus" TEXT NOT NULL DEFAULT 'active',
    "mobilityStatus" TEXT,
    "mentalStatus" TEXT,
    "communicationBarriers" JSONB,
    "patientSafetyAlerts" JSONB,
    "clinicalAlerts" JSONB,
    "drugInteractionAlerts" JSONB,
    "visitFrequency" JSONB,
    "loyaltyProgramStatus" JSONB,
    "satisfactionScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_visits" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitNumber" TEXT,
    "appointmentId" TEXT,
    "visitType" TEXT,
    "visitCategory" TEXT,
    "departmentId" TEXT,
    "doctorId" TEXT,
    "nurseId" TEXT,
    "attendingStaff" JSONB,
    "chiefComplaint" TEXT,
    "visitReason" TEXT,
    "referralSource" TEXT,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledDateTime" TIMESTAMP(3),
    "checkinTime" TIMESTAMP(3),
    "consultationStartTime" TIMESTAMP(3),
    "consultationEndTime" TIMESTAMP(3),
    "dischargeTime" TIMESTAMP(3),
    "totalWaitTime" INTEGER,
    "totalConsultationTime" INTEGER,
    "vitalSigns" JSONB,
    "symptoms" JSONB,
    "diagnosis" JSONB,
    "treatment" JSONB,
    "prescriptions" JSONB,
    "procedures" JSONB,
    "labTests" JSONB,
    "imaging" JSONB,
    "insurance" JSONB,
    "billing" JSONB,
    "payments" JSONB,
    "documents" JSONB,
    "notes" JSONB,
    "followUpInstructions" JSONB,
    "nextAppointment" JSONB,
    "satisfactionRating" INTEGER,
    "feedback" JSONB,
    "qualityMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examination_templates" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT,
    "templateName" TEXT NOT NULL,
    "templateType" TEXT,
    "specialtyArea" TEXT,
    "description" TEXT,
    "sections" JSONB,
    "fields" JSONB,
    "validations" JSONB,
    "scoring" JSONB,
    "defaultValues" JSONB,
    "conditionalLogic" JSONB,
    "printLayout" JSONB,
    "digitalSignature" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "lastModified" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examination_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_networks_networkCode_key" ON "hospital_networks"("networkCode");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_hospitalCode_key" ON "hospitals"("hospitalCode");

-- CreateIndex
CREATE UNIQUE INDEX "department_categories_categoryCode_key" ON "department_categories"("categoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "floors_hospitalId_floorNumber_key" ON "floors"("hospitalId", "floorNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_hospitalId_roomNumber_key" ON "rooms"("hospitalId", "roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "beds_hospitalId_bedNumber_key" ON "beds"("hospitalId", "bedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "wards_hospitalId_wardNumber_key" ON "wards"("hospitalId", "wardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "staff_employeeId_key" ON "staff"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patientNumber_key" ON "patients"("patientNumber");

-- CreateIndex
CREATE UNIQUE INDEX "patients_mrn_key" ON "patients"("mrn");

-- CreateIndex
CREATE UNIQUE INDEX "patient_visits_visitNumber_key" ON "patient_visits"("visitNumber");

-- AddForeignKey
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "hospital_networks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_categories" ADD CONSTRAINT "department_categories_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "department_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "department_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination_templates" ADD CONSTRAINT "examination_templates_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination_templates" ADD CONSTRAINT "examination_templates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
