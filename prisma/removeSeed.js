const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function removeAllData() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Delete all records from all models in the correct order to avoid foreign key constraints
    // Starting with dependent models first, then parent models
    
    console.log('Deleting OAuth Access Tokens...');
    await prisma.oauthAccessToken.deleteMany({});
    
    console.log('Deleting User Sessions...');
    await prisma.userSession.deleteMany({});
    
    console.log('Deleting MFA Configurations...');
    await prisma.mfaConfiguration.deleteMany({});
    
    console.log('Deleting User Credentials...');
    await prisma.userCredential.deleteMany({});
    
    console.log('Deleting Role Permissions...');
    await prisma.rolePermission.deleteMany({});
    
    console.log('Deleting Permissions...');
    await prisma.permission.deleteMany({});
    
    console.log('Deleting OAuth Clients...');
    await prisma.oauthClient.deleteMany({});
    
    console.log('Deleting Examinations...');
    await prisma.examination.deleteMany({});
    
    console.log('Deleting Examination Templates...');
    await prisma.examinationTemplate.deleteMany({});
    
    console.log('Deleting Diagnosis...');
    await prisma.diagnosis.deleteMany({});
    
    console.log('Deleting Patient Visits...');
    await prisma.patientVisit.deleteMany({});
    
    console.log('Deleting ICD10 Codes...');
    await prisma.icd10Code.deleteMany({});
    
    console.log('Deleting ICD11 Codes...');
    await prisma.icd11Code.deleteMany({});
    
    console.log('Deleting Diseases...');
    await prisma.disease.deleteMany({});
    
    console.log('Deleting Patients...');
    await prisma.patient.deleteMany({});
    
    console.log('Deleting Beds...');
    await prisma.bed.deleteMany({});
    
    console.log('Deleting Bed Types...');
    await prisma.bedType.deleteMany({});
    
    console.log('Deleting Wards...');
    await prisma.ward.deleteMany({});
    
    console.log('Deleting Rooms...');
    await prisma.room.deleteMany({});
    
    console.log('Deleting Room Types...');
    await prisma.roomType.deleteMany({});
    
    console.log('Deleting Floors...');
    await prisma.floor.deleteMany({});
    
    console.log('Deleting Nurses...');
    await prisma.nurse.deleteMany({});
    
    console.log('Deleting Doctors...');
    await prisma.doctor.deleteMany({});
    
    console.log('Deleting Staff...');
    await prisma.staff.deleteMany({});
    
    console.log('Deleting Roles...');
    await prisma.role.deleteMany({});
    
    console.log('Deleting Role Categories...');
    await prisma.roleCategory.deleteMany({});
    
    console.log('Deleting Departments...');
    await prisma.department.deleteMany({});
    
    console.log('Deleting Department Categories...');
    await prisma.departmentCategory.deleteMany({});
    
    console.log('Deleting Hospitals...');
    await prisma.hospital.deleteMany({});
    
    console.log('Deleting Hospital Networks...');
    await prisma.hospitalNetwork.deleteMany({});
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('All data has been removed from the database.');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the remove function if this file is executed directly
if (require.main === module) {
  removeAllData()
    .then(() => {
      console.log('🎉 Database cleanup script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = removeAllData;
