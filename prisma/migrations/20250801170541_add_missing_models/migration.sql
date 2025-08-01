-- AlterTable
ALTER TABLE "beds" ADD COLUMN     "bedTypeId" TEXT;

-- AlterTable
ALTER TABLE "patient_visits" ADD COLUMN     "attendingPhysicianId" TEXT,
ADD COLUMN     "referringPhysicianId" TEXT;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "roomTypeId" TEXT;

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "roleId" TEXT;

-- AlterTable
ALTER TABLE "wards" ADD COLUMN     "doctorInChargeId" TEXT;

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "typeCode" TEXT,
    "category" TEXT,
    "defaultCapacity" INTEGER,
    "equipmentRequirements" JSONB,
    "spaceRequirements" JSONB,
    "specialFeatures" JSONB,
    "infectionControlLevel" TEXT,
    "airChangesPerHour" INTEGER,
    "pressureRequirements" TEXT,
    "temperatureRange" JSONB,
    "humidityRange" JSONB,
    "noiseLevelLimits" JSONB,
    "lightingRequirements" JSONB,
    "medicalGasRequirements" JSONB,
    "powerRequirements" JSONB,
    "networkRequirements" JSONB,
    "accessibilityFeatures" JSONB,
    "costPerHour" DOUBLE PRECISION,
    "costPerDay" DOUBLE PRECISION,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bed_types" (
    "id" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "typeCode" TEXT,
    "category" TEXT,
    "medicalGrade" TEXT,
    "features" JSONB,
    "equipmentIncluded" JSONB,
    "maintenanceRequirements" JSONB,
    "dailyCharge" DOUBLE PRECISION,
    "hourlyCharge" DOUBLE PRECISION,
    "setupTimeMinutes" INTEGER NOT NULL DEFAULT 30,
    "cleaningTimeMinutes" INTEGER NOT NULL DEFAULT 15,
    "specifications" JSONB,
    "manufacturerDetails" JSONB,
    "warrantyInformation" JSONB,
    "complianceCertifications" JSONB,

    CONSTRAINT "bed_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_categories" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryDescription" TEXT,
    "hierarchyLevel" INTEGER,
    "parentCategoryId" TEXT,
    "reportingStructure" JSONB,
    "escalationMatrix" JSONB,
    "authorityLevels" JSONB,
    "responsibilityMatrix" JSONB,

    CONSTRAINT "role_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "roleName" TEXT NOT NULL,
    "roleCode" TEXT,
    "roleType" TEXT,
    "roleDescription" TEXT,
    "permissions" JSONB,
    "hierarchyLevel" INTEGER,
    "reportingStructure" JSONB,
    "responsibilities" TEXT[],
    "requiredQualifications" JSONB,
    "certificationRequirements" JSONB,
    "experienceRequirements" JSONB,
    "salaryRange" JSONB,
    "performanceMetrics" JSONB,
    "trainingRequirements" JSONB,
    "continuingEducation" JSONB,
    "legalRequirements" JSONB,
    "backgroundCheckLevel" TEXT,
    "securityClearanceRequired" TEXT,
    "isPatientFacing" BOOLEAN NOT NULL DEFAULT false,
    "isClinicalRole" BOOLEAN NOT NULL DEFAULT false,
    "isAdministrativeRole" BOOLEAN NOT NULL DEFAULT false,
    "shiftPatterns" JSONB,
    "onCallRequirements" JSONB,
    "delegationAuthority" JSONB,
    "approvalLimits" JSONB,
    "systemAccessLevels" JSONB,
    "dataAccessRestrictions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "doctorType" TEXT,
    "medicalRegistrationNumber" TEXT,
    "medicalCouncil" TEXT,
    "registrationDate" TIMESTAMP(3),
    "registrationExpiryDate" TIMESTAMP(3),
    "medicalDegree" TEXT,
    "specialization" TEXT,
    "subSpecialization" TEXT,
    "fellowshipDetails" JSONB,
    "boardCertifications" JSONB,
    "consultationFee" DOUBLE PRECISION,
    "followUpFee" DOUBLE PRECISION,
    "surgeryFee" DOUBLE PRECISION,
    "procedureFees" JSONB,
    "availableDays" INTEGER[],
    "consultationDuration" INTEGER NOT NULL DEFAULT 15,
    "maxPatientsPerDay" INTEGER,
    "maxPatientsPerSession" INTEGER,
    "appointmentSlots" JSONB,
    "breakTimes" JSONB,
    "autoAssignmentPriority" INTEGER NOT NULL DEFAULT 1,
    "telemedicineEnabled" BOOLEAN NOT NULL DEFAULT false,
    "homeVisitAvailable" BOOLEAN NOT NULL DEFAULT false,
    "emergencyOnCall" BOOLEAN NOT NULL DEFAULT false,
    "patientSatisfactionRating" DOUBLE PRECISION,
    "averageConsultationTime" INTEGER,
    "appointmentAdherenceRate" DOUBLE PRECISION,
    "patientOutcomeScores" JSONB,
    "complicationRates" JSONB,
    "readmissionRates" JSONB,
    "researchInterests" TEXT[],
    "publications" JSONB,
    "conferencesAttended" JSONB,
    "teachingResponsibilities" JSONB,
    "mentorshipRoles" JSONB,
    "malpracticeHistory" JSONB,
    "disciplinaryActions" JSONB,
    "qualityImprovementParticipation" JSONB,
    "safetyTrainingCompletion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurses" (
    "id" TEXT NOT NULL,
    "nursingRegistrationNumber" TEXT,
    "nursingCouncil" TEXT,
    "nursingDegree" TEXT,
    "specialization" TEXT,
    "certificationLevel" TEXT,
    "yearsOfExperience" INTEGER,
    "clinicalSpecializations" TEXT[],
    "technicalSkills" TEXT[],
    "equipmentCertifications" TEXT[],
    "preferredShifts" TEXT[],
    "wardPreferences" TEXT[],
    "patientTypePreferences" TEXT[],
    "patientCareQualityScore" DOUBLE PRECISION,
    "medicationAdministrationAccuracy" DOUBLE PRECISION,
    "documentationQualityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialType" TEXT,
    "credentialDataHash" TEXT,
    "salt" TEXT,
    "algorithm" TEXT,
    "keyDerivationParams" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "passwordHistory" JSONB,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" TEXT[],
    "deviceRegistrations" JSONB,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_configurations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "methodType" TEXT,
    "methodDetails" JSONB,
    "secretKeyEncrypted" TEXT,
    "backupCodes" TEXT[],
    "recoveryCodes" TEXT[],
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastVerified" TIMESTAMP(3),
    "setupCompletedAt" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "deviceTrustSettings" JSONB,
    "locationRestrictions" JSONB,

    CONSTRAINT "mfa_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTokenHash" TEXT,
    "refreshTokenHash" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "locationInfo" JSONB,
    "loginTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "logoutTimestamp" TIMESTAMP(3),
    "logoutReason" TEXT,
    "sessionType" TEXT,
    "securityLevel" TEXT,
    "privilegedOperations" JSONB,
    "concurrentSessions" INTEGER NOT NULL DEFAULT 1,
    "deviceTrusted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "permissionName" TEXT NOT NULL,
    "permissionCode" TEXT,
    "module" TEXT,
    "action" TEXT,
    "resource" TEXT,
    "description" TEXT,
    "permissionType" TEXT,
    "sensitivityLevel" TEXT,
    "complianceRequirements" TEXT[],
    "auditRequired" BOOLEAN NOT NULL DEFAULT false,
    "delegationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "temporaryGrantAllowed" BOOLEAN NOT NULL DEFAULT false,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "conditions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "timeRestrictions" JSONB,
    "locationRestrictions" JSONB,
    "dataRestrictions" JSONB,
    "approvalWorkflow" JSONB,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastReviewed" TIMESTAMP(3),
    "reviewFrequency" INTEGER,
    "isInherited" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_clients" (
    "id" TEXT NOT NULL,
    "clientSecretHash" TEXT,
    "clientName" TEXT,
    "clientType" TEXT,
    "redirectUris" TEXT[],
    "allowedScopes" TEXT[],
    "allowedGrantTypes" TEXT[],
    "accessTokenLifetime" INTEGER NOT NULL DEFAULT 3600,
    "refreshTokenLifetime" INTEGER NOT NULL DEFAULT 2592000,
    "pkceRequired" BOOLEAN NOT NULL DEFAULT true,
    "confidential" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "additionalInformation" JSONB,
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_access_tokens" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "accessTokenHash" TEXT,
    "refreshTokenHash" TEXT,
    "scopes" TEXT[],
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "additionalInformation" JSONB,

    CONSTRAINT "oauth_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icd10_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "chapter" TEXT,
    "block" TEXT,
    "version" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "genderSpecific" TEXT,
    "ageRestrictions" JSONB,
    "synonyms" TEXT[],
    "includes" TEXT[],
    "excludes" TEXT[],
    "notes" TEXT,
    "severityLevels" JSONB,
    "clinicalGuidelines" JSONB,
    "mortalityIndicator" BOOLEAN NOT NULL DEFAULT false,
    "morbidityIndicator" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icd10_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icd11_codes" (
    "id" TEXT NOT NULL,
    "foundationId" TEXT NOT NULL,
    "entityId" TEXT,
    "code" TEXT,
    "title" JSONB,
    "definition" JSONB,
    "parentId" TEXT,
    "chapter" TEXT,
    "blockTitle" TEXT,
    "codingNote" JSONB,
    "inclusionTerms" JSONB,
    "exclusionTerms" JSONB,
    "indexTerms" JSONB,
    "synonyms" JSONB,
    "narrowerTerms" TEXT[],
    "broaderTerms" TEXT[],
    "fullySpecifiedName" JSONB,
    "classificationProperties" JSONB,
    "mortalityCoding" BOOLEAN NOT NULL DEFAULT false,
    "morbidityCoding" BOOLEAN NOT NULL DEFAULT false,
    "primaryCareLowSettings" BOOLEAN NOT NULL DEFAULT false,
    "specialtyAdaptations" JSONB,
    "functioningProperties" JSONB,
    "anatomicalProperties" JSONB,
    "severityProperties" JSONB,
    "temporalProperties" JSONB,
    "releaseVersion" TEXT,
    "linearization" TEXT[],
    "browserUrl" TEXT,
    "apiUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icd11_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diseases" (
    "id" TEXT NOT NULL,
    "icd10CodeId" TEXT,
    "icd11CodeId" TEXT,
    "diseaseName" JSONB,
    "commonNames" JSONB,
    "specialty" TEXT,
    "subspecialty" TEXT,
    "diseaseCategory" TEXT,
    "pathophysiology" JSONB,
    "etiology" JSONB,
    "riskFactors" JSONB,
    "symptoms" JSONB,
    "signs" JSONB,
    "diagnosticCriteria" JSONB,
    "differentialDiagnosis" JSONB,
    "complications" JSONB,
    "prognosis" JSONB,
    "treatmentProtocols" JSONB,
    "medicationProtocols" JSONB,
    "surgicalOptions" JSONB,
    "rehabilitationProtocols" JSONB,
    "lifestyleModifications" JSONB,
    "preventionMeasures" JSONB,
    "followUpSchedule" JSONB,
    "researchNotes" JSONB,
    "clinicalTrials" JSONB,
    "evidenceBase" JSONB,
    "guidelinesReferences" JSONB,
    "prevalenceData" JSONB,
    "incidenceData" JSONB,
    "demographicPatterns" JSONB,
    "geographicalDistribution" JSONB,
    "seasonalPatterns" JSONB,
    "severityClassification" JSONB,
    "functionalImpact" JSONB,
    "environmentalFactors" JSONB,
    "geneticFactors" JSONB,
    "isNotifiable" BOOLEAN NOT NULL DEFAULT false,
    "notificationRequirements" JSONB,
    "reportingRequirements" JSONB,
    "isChronic" BOOLEAN NOT NULL DEFAULT false,
    "isHereditary" BOOLEAN NOT NULL DEFAULT false,
    "isContagious" BOOLEAN NOT NULL DEFAULT false,
    "isRareDisease" BOOLEAN NOT NULL DEFAULT false,
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en', 'hi', 'mr']::TEXT[],
    "clinicalGuidelinesUrl" JSONB,
    "patientEducationMaterials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "templateId" TEXT,
    "doctorId" TEXT NOT NULL,
    "examinationType" TEXT,
    "examinationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vitalSigns" JSONB,
    "physicalExamination" JSONB,
    "systemExamination" JSONB,
    "neurologicalExamination" JSONB,
    "mentalStatusExamination" JSONB,
    "functionalAssessment" JSONB,
    "anthropometricMeasurements" JSONB,
    "laboratoryValues" JSONB,
    "imagingFindings" JSONB,
    "diagnosticTestResults" JSONB,
    "findings" JSONB,
    "clinicalImpressions" TEXT,
    "assessment" JSONB,
    "plan" JSONB,
    "images" JSONB,
    "videos" JSONB,
    "audioRecordings" JSONB,
    "documents" JSONB,
    "preliminaryDiagnosis" TEXT[],
    "differentialDiagnosis" TEXT[],
    "finalDiagnosis" TEXT[],
    "diagnosticConfidence" JSONB,
    "recommendations" JSONB,
    "treatmentPlan" JSONB,
    "medicationRecommendations" JSONB,
    "followUpRequirements" JSONB,
    "riskAssessment" JSONB,
    "safetyAlerts" JSONB,
    "drugInteractions" JSONB,
    "contraindications" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "qualityScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "reviewedBy" TEXT,
    "reviewDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "examinationDuration" INTEGER,
    "completenessScore" DOUBLE PRECISION,
    "accuracyIndicators" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "examinationId" TEXT,
    "diseaseId" TEXT,
    "doctorId" TEXT NOT NULL,
    "diagnosisType" TEXT,
    "diagnosisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosisMethod" TEXT,
    "confidenceLevel" DOUBLE PRECISION,
    "severity" TEXT,
    "stage" TEXT,
    "grade" TEXT,
    "anatomicalLocation" JSONB,
    "affectedSystems" TEXT[],
    "laterality" TEXT,
    "onsetDate" TIMESTAMP(3),
    "duration" TEXT,
    "progression" TEXT,
    "supportingEvidence" JSONB,
    "diagnosticCriteriaMet" JSONB,
    "laboratoryEvidence" JSONB,
    "imagingEvidence" JSONB,
    "pathologyEvidence" JSONB,
    "treatmentResponse" TEXT,
    "prognosis" TEXT,
    "expectedOutcome" TEXT,
    "functionalImpact" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "reportable" BOOLEAN NOT NULL DEFAULT false,
    "workRelated" BOOLEAN NOT NULL DEFAULT false,
    "injuryRelated" BOOLEAN NOT NULL DEFAULT false,
    "peerReviewed" BOOLEAN NOT NULL DEFAULT false,
    "qualityAssured" BOOLEAN NOT NULL DEFAULT false,
    "codingReviewed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "revisionHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admin_credentials" (
    "id" TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL DEFAULT 'email',
    "credentialDataHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),

    CONSTRAINT "super_admin_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admin_sessions" (
    "id" TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "loginTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "logoutTimestamp" TIMESTAMP(3),

    CONSTRAINT "super_admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_types_typeCode_key" ON "room_types"("typeCode");

-- CreateIndex
CREATE UNIQUE INDEX "bed_types_typeCode_key" ON "bed_types"("typeCode");

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleCode_key" ON "roles"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_medicalRegistrationNumber_key" ON "doctors"("medicalRegistrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "nurses_nursingRegistrationNumber_key" ON "nurses"("nursingRegistrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permissionCode_key" ON "permissions"("permissionCode");

-- CreateIndex
CREATE UNIQUE INDEX "icd10_codes_code_key" ON "icd10_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "icd11_codes_foundationId_key" ON "icd11_codes"("foundationId");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_bedTypeId_fkey" FOREIGN KEY ("bedTypeId") REFERENCES "bed_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_doctorInChargeId_fkey" FOREIGN KEY ("doctorInChargeId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_attendingPhysicianId_fkey" FOREIGN KEY ("attendingPhysicianId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_referringPhysicianId_fkey" FOREIGN KEY ("referringPhysicianId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_categories" ADD CONSTRAINT "role_categories_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "role_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "role_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_id_fkey" FOREIGN KEY ("id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurses" ADD CONSTRAINT "nurses_id_fkey" FOREIGN KEY ("id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_configurations" ADD CONSTRAINT "mfa_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icd11_codes" ADD CONSTRAINT "icd11_codes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "icd11_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diseases" ADD CONSTRAINT "diseases_icd10CodeId_fkey" FOREIGN KEY ("icd10CodeId") REFERENCES "icd10_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diseases" ADD CONSTRAINT "diseases_icd11CodeId_fkey" FOREIGN KEY ("icd11CodeId") REFERENCES "icd11_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "patient_visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "examination_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_doctor_examination_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_reviewed_by_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_approved_by_fkey" FOREIGN KEY ("approvedBy") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "patient_visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "examinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "diseases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_doctor_diagnosis_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "super_admin_credentials" ADD CONSTRAINT "super_admin_credentials_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "super_admin_sessions" ADD CONSTRAINT "super_admin_sessions_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
