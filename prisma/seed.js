// prisma/seed.js
const { PrismaClient } = require('../generated/prisma')
const { faker } = require('@faker-js/faker')

const prisma = new PrismaClient()

// Helper functions
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}

const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

const createPersonalDetails = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  middleName: faker.person.middleName(),
  dateOfBirth: faker.date.past({ years: 60 }),
  gender: getRandomElement(['male', 'female', 'other']),
  maritalStatus: getRandomElement(['single', 'married', 'divorced', 'widowed']),
  nationality: 'Indian',
  religion: getRandomElement(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other']),
  occupation: faker.person.jobTitle(),
  bloodGroup: getRandomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  height: faker.number.int({ min: 150, max: 190 }),
  weight: faker.number.int({ min: 40, max: 120 }),
})

const createContactDetails = () => ({
  primaryPhone: faker.phone.number('##########'),
  secondaryPhone: faker.phone.number('##########'),
  email: faker.internet.email(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu']),
    pincode: faker.location.zipCode('######'),
    country: 'India'
  }
})

const createMedicalHistory = () => ({
  allergies: getRandomElements(['Penicillin', 'Aspirin', 'Dust', 'Pollen', 'Shellfish', 'Nuts'], faker.number.int({ min: 0, max: 3 })),
  chronicConditions: getRandomElements(['Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Heart Disease'], faker.number.int({ min: 0, max: 2 })),
  pastSurgeries: faker.helpers.arrayElements([
    'Appendectomy',
    'Gallbladder Surgery',
    'Knee Replacement',
    'Cataract Surgery',
    'Hernia Repair'
  ], faker.number.int({ min: 0, max: 2 })),
  medications: faker.helpers.arrayElements([
    'Metformin',
    'Lisinopril',
    'Amlodipine',
    'Atorvastatin',
    'Levothyroxine'
  ], faker.number.int({ min: 0, max: 3 }))
})

async function seedHospitalNetworks() {
  console.log('Seeding Hospital Networks...')
  
  const networks = []
  for (let i = 0; i < 3; i++) {
    const network = await prisma.hospitalNetwork.create({
      data: {
        networkName: faker.company.name() + ' Healthcare Network',
        networkCode: `HN${String(i + 1).padStart(3, '0')}`,
        headquartersAddress: faker.location.streetAddress(),
        registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
        taxId: faker.string.numeric(11),
        gstin: faker.string.alphanumeric(15).toUpperCase(),
        primaryContact: createContactDetails(),
        networkType: getRandomElement(['corporate', 'government', 'trust', 'private']),
        accreditationDetails: {
          nabh: true,
          jci: faker.datatype.boolean(),
          iso: true
        },
        regulatoryCompliance: {
          mciRegistered: true,
          stateHealthDept: true,
          fireSafety: true
        }
      }
    })
    networks.push(network)
  }
  
  return networks
}

async function seedHospitals(networks) {
  console.log('Seeding Hospitals...')
  
  const hospitals = []
  for (let i = 0; i < 5; i++) {
    const hospital = await prisma.hospital.create({
      data: {
        networkId: networks[i % networks.length].id,
        name: faker.company.name() + ' Hospital',
        hospitalCode: `HOS${String(i + 1).padStart(3, '0')}`,
        hospitalType: getRandomElement(['general', 'specialty', 'super_specialty', 'clinic']),
        address: faker.location.streetAddress(),
        coordinates: {
          type: 'Point',
          coordinates: [faker.location.longitude(), faker.location.latitude()]
        },
        contactDetails: createContactDetails(),
        facilities: {
          bedCount: faker.number.int({ min: 50, max: 500 }),
          operationTheaters: faker.number.int({ min: 2, max: 20 }),
          icuBeds: faker.number.int({ min: 10, max: 50 }),
          emergencyBeds: faker.number.int({ min: 5, max: 25 }),
          ambulances: faker.number.int({ min: 2, max: 10 })
        },
        capacityDetails: {
          totalBeds: faker.number.int({ min: 50, max: 500 }),
          availableBeds: faker.number.int({ min: 10, max: 100 }),
          occupiedBeds: faker.number.int({ min: 20, max: 200 })
        },
        operationalHours: {
          weekdays: '24/7',
          weekends: '24/7',
          holidays: '24/7'
        },
        emergencyServices: true,
        traumaCenterLevel: getRandomElement(['Level I', 'Level II', 'Level III', null]),
        teachingHospital: faker.datatype.boolean(),
        researchFacility: faker.datatype.boolean(),
        telemedicineEnabled: faker.datatype.boolean(),
        abdmRegistration: {
          registered: true,
          facilityId: faker.string.alphanumeric(10).toUpperCase(),
          registrationDate: faker.date.past()
        }
      }
    })
    hospitals.push(hospital)
  }
  
  return hospitals
}

async function seedDepartmentCategories() {
  console.log('Seeding Department Categories...')
  
  const categories = [
    { name: 'Medical', code: 'MED', type: 'medical' },
    { name: 'Surgical', code: 'SURG', type: 'surgical' },
    { name: 'Diagnostic', code: 'DIAG', type: 'diagnostic' },
    { name: 'Administrative', code: 'ADMIN', type: 'administrative' },
    { name: 'Support Services', code: 'SUPP', type: 'support' }
  ]
  
  const createdCategories = []
  for (const category of categories) {
    const created = await prisma.departmentCategory.create({
      data: {
        categoryName: category.name,
        categoryCode: category.code,
        description: `${category.name} departments and services`,
        specializationType: category.type,
        icon: `${category.code.toLowerCase()}-icon`,
        colorCode: faker.color.rgb()
      }
    })
    createdCategories.push(created)
  }
  
  return createdCategories
}

async function seedFloors(hospitals) {
  console.log('Seeding Floors...')
  
  const floors = []
  for (const hospital of hospitals) {
    const floorCount = faker.number.int({ min: 3, max: 8 })
    for (let i = 0; i < floorCount; i++) {
      const floor = await prisma.floor.create({
        data: {
          hospitalId: hospital.id,
          floorNumber: i + 1,
          floorName: i === 0 ? 'Ground Floor' : `Floor ${i + 1}`,
          floorType: getRandomElement(['general', 'icu', 'operation', 'administrative']),
          totalArea: faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 }),
          usableArea: faker.number.float({ min: 800, max: 4000, fractionDigits: 2 }),
          accessible: true,
          emergencyExits: faker.number.int({ min: 2, max: 6 }),
          fireSafetyRating: getRandomElement(['A', 'B', 'C']),
          powerBackupAvailable: true,
          securityLevel: getRandomElement(['low', 'medium', 'high']),
          description: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} floor of the hospital`
        }
      })
      floors.push(floor)
    }
  }
  
  return floors
}

async function seedDepartments(hospitals, categories, floors) {
  console.log('Seeding Departments...')
  
  const departmentNames = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
    'General Surgery', 'Emergency Medicine', 'Radiology', 'Pathology',
    'Anesthesiology', 'Dermatology', 'Psychiatry', 'Ophthalmology',
    'ENT', 'Oncology', 'Nephrology', 'Gastroenterology', 'Pulmonology'
  ]
  
  const departments = []
  for (const hospital of hospitals) {
    const hospitalFloors = floors.filter(f => f.hospitalId === hospital.id)
    const deptCount = faker.number.int({ min: 8, max: 15 })
    const selectedDepts = getRandomElements(departmentNames, deptCount)
    
    for (let i = 0; i < selectedDepts.length; i++) {
      const deptName = selectedDepts[i]
      const department = await prisma.department.create({
        data: {
          hospitalId: hospital.id,
          categoryId: categories[i % categories.length].id,
          floorId: hospitalFloors[i % hospitalFloors.length]?.id,
          name: deptName,
          code: deptName.substring(0, 3).toUpperCase() + String(i + 1).padStart(2, '0'),
          departmentType: getRandomElement(['inpatient', 'outpatient', 'both']),
          servicesOffered: [
            `${deptName} consultation`,
            `${deptName} procedures`,
            `${deptName} diagnostics`
          ],
          operationalHours: {
            monday: '9:00-17:00',
            tuesday: '9:00-17:00',
            wednesday: '9:00-17:00',
            thursday: '9:00-17:00',
            friday: '9:00-17:00',
            saturday: '9:00-13:00',
            sunday: 'Closed'
          },
          emergencyAvailability: getRandomElement([true, false]),
          telemedicineEnabled: faker.datatype.boolean(),
          consultationFeeRange: {
            minimum: faker.number.int({ min: 500, max: 1000 }),
            maximum: faker.number.int({ min: 2000, max: 5000 })
          }
        }
      })
      departments.push(department)
    }
  }
  
  return departments
}

async function seedRoomTypes() {
  console.log('Seeding Room Types...')
  
  const roomTypes = [
    { name: 'General Ward', code: 'GW', capacity: 4, cost: 1000 },
    { name: 'Semi-Private', code: 'SP', capacity: 2, cost: 2000 },
    { name: 'Private Room', code: 'PR', capacity: 1, cost: 3000 },
    { name: 'ICU', code: 'ICU', capacity: 1, cost: 5000 },
    { name: 'Operation Theater', code: 'OT', capacity: 1, cost: 10000 },
    { name: 'Emergency Room', code: 'ER', capacity: 1, cost: 2500 }
  ]
  
  const createdRoomTypes = []
  for (const roomType of roomTypes) {
    const created = await prisma.roomType.create({
      data: {
        typeName: roomType.name,
        typeCode: roomType.code,
        category: getRandomElement(['patient_care', 'treatment', 'diagnostic', 'administrative']),
        defaultCapacity: roomType.capacity,
        equipmentRequirements: {
          basicEquipment: ['Bed', 'Monitor', 'Oxygen outlet'],
          specialEquipment: roomType.code === 'ICU' ? ['Ventilator', 'Defibrillator'] : []
        },
        costPerDay: roomType.cost,
        costPerHour: Math.floor(roomType.cost / 24)
      }
    })
    createdRoomTypes.push(created)
  }
  
  return createdRoomTypes
}

async function seedRooms(hospitals, floors, departments, roomTypes) {
  console.log('Seeding Rooms...')
  
  const rooms = []
  for (const hospital of hospitals) {
    const hospitalFloors = floors.filter(f => f.hospitalId === hospital.id)
    const hospitalDepartments = departments.filter(d => d.hospitalId === hospital.id)
    
    for (const floor of hospitalFloors) {
      const roomCount = faker.number.int({ min: 10, max: 30 })
      for (let i = 1; i <= roomCount; i++) {
        const roomType = getRandomElement(roomTypes)
        const room = await prisma.room.create({
          data: {
            hospitalId: hospital.id,
            floorId: floor.id,
            departmentId: getRandomElement(hospitalDepartments).id,
            roomTypeId: roomType.id,
            roomNumber: `${floor.floorNumber}${String(i).padStart(2, '0')}`,
            roomName: `${roomType.typeName} ${i}`,
            capacity: roomType.defaultCapacity,
            area: faker.number.float({ min: 100, max: 500, fractionDigits: 2 }),
            status: getRandomElement(['available', 'occupied', 'maintenance', 'cleaning']),
            occupancyStatus: getRandomElement(['vacant', 'occupied', 'reserved']),
            cleaningStatus: getRandomElement(['clean', 'cleaning', 'dirty']),
            maintenanceStatus: getRandomElement(['operational', 'maintenance', 'out_of_order']),
            dailyRate: roomType.costPerDay,
            hourlyRate: roomType.costPerHour,
            amenities: {
              airConditioning: true,
              television: faker.datatype.boolean(),
              wifi: true,
              privateWashroom: roomType.defaultCapacity === 1
            }
          }
        })
        rooms.push(room)
      }
    }
  }
  
  return rooms
}

async function seedBedTypes() {
  console.log('Seeding Bed Types...')
  
  const bedTypes = [
    { name: 'Standard Bed', code: 'STD', charge: 500 },
    { name: 'Electric Bed', code: 'ELC', charge: 800 },
    { name: 'ICU Bed', code: 'ICU', charge: 1500 },
    { name: 'Pediatric Bed', code: 'PED', charge: 600 },
    { name: 'Bariatric Bed', code: 'BAR', charge: 1000 }
  ]
  
  const createdBedTypes = []
  for (const bedType of bedTypes) {
    const created = await prisma.bedType.create({
      data: {
        typeName: bedType.name,
        typeCode: bedType.code,
        category: getRandomElement(['standard', 'specialized', 'pediatric', 'geriatric']),
        medicalGrade: getRandomElement(['basic', 'intermediate', 'advanced']),
        dailyCharge: bedType.charge,
        hourlyCharge: Math.floor(bedType.charge / 24),
        features: {
          adjustableHeight: true,
          electricControls: bedType.code === 'ELC' || bedType.code === 'ICU',
          sideRails: true,
          mobilityFeatures: faker.datatype.boolean()
        }
      }
    })
    createdBedTypes.push(created)
  }
  
  return createdBedTypes
}

async function seedBeds(hospitals, rooms, departments, bedTypes) {
  console.log('Seeding Beds...')
  
  const beds = []
  for (const room of rooms) {
    const bedCount = faker.number.int({ min: 1, max: room.capacity || 1 })
    for (let i = 1; i <= bedCount; i++) {
      const bedType = getRandomElement(bedTypes)
      const bed = await prisma.bed.create({
        data: {
          hospitalId: room.hospitalId,
          roomId: room.id,
          departmentId: room.departmentId,
          bedTypeId: bedType.id,
          bedNumber: `${room.roomNumber}-${String(i).padStart(2, '0')}`,
          bedName: `Bed ${i} in Room ${room.roomNumber}`,
          positionInRoom: i,
          status: getRandomElement(['available', 'occupied', 'maintenance', 'cleaning']),
          dailyRate: bedType.dailyCharge,
          specialRequirements: {
            isolationCapable: faker.datatype.boolean(),
            ventilationSupport: bedType.typeCode === 'ICU',
            monitoringLevel: getRandomElement(['basic', 'intermediate', 'intensive'])
          },
          allocationPriority: faker.number.int({ min: 1, max: 5 }),
          emergencyAccess: true
        }
      })
      beds.push(bed)
    }
  }
  
  return beds
}

async function seedRoleCategories() {
  console.log('Seeding Role Categories...')
  
  const categories = [
    { name: 'Medical Staff', level: 1 },
    { name: 'Nursing Staff', level: 2 },
    { name: 'Administrative Staff', level: 3 },
    { name: 'Support Staff', level: 4 },
    { name: 'Technical Staff', level: 5 }
  ]
  
  const createdCategories = []
  for (const category of categories) {
    const created = await prisma.roleCategory.create({
      data: {
        categoryName: category.name,
        categoryDescription: `${category.name} roles and responsibilities`,
        hierarchyLevel: category.level
      }
    })
    createdCategories.push(created)
  }
  
  return createdCategories
}

async function seedRoles(categories) {
  console.log('Seeding Roles...')
  
  const roles = [
    { name: 'Chief Medical Officer', code: 'CMO', category: 'Medical Staff', clinical: true },
    { name: 'Senior Consultant', code: 'SCN', category: 'Medical Staff', clinical: true },
    { name: 'Consultant', code: 'CON', category: 'Medical Staff', clinical: true },
    { name: 'Resident Doctor', code: 'RES', category: 'Medical Staff', clinical: true },
    { name: 'Chief Nursing Officer', code: 'CNO', category: 'Nursing Staff', clinical: true },
    { name: 'Staff Nurse', code: 'SNR', category: 'Nursing Staff', clinical: true },
    { name: 'Hospital Administrator', code: 'ADM', category: 'Administrative Staff', clinical: false },
    { name: 'Medical Records Officer', code: 'MRO', category: 'Administrative Staff', clinical: false },
    { name: 'Pharmacist', code: 'PHR', category: 'Medical Staff', clinical: true },
    { name: 'Lab Technician', code: 'LTH', category: 'Technical Staff', clinical: true }
  ]
  
  const createdRoles = []
  for (const role of roles) {
    const category = categories.find(c => c.categoryName === role.category)
    const created = await prisma.role.create({
      data: {
        categoryId: category?.id,
        roleName: role.name,
        roleCode: role.code,
        roleType: getRandomElement(['permanent', 'contract', 'consultant']),
        roleDescription: `Responsible for ${role.name.toLowerCase()} duties`,
        hierarchyLevel: faker.number.int({ min: 1, max: 10 }),
        responsibilities: [
          `Perform ${role.name.toLowerCase()} duties`,
          'Maintain patient care standards',
          'Follow hospital protocols'
        ],
        isClinicalRole: role.clinical,
        isPatientFacing: role.clinical,
        permissions: {
          read: ['patients', 'appointments'],
          write: role.clinical ? ['medical_records', 'prescriptions'] : ['administrative_records'],
          delete: []
        }
      }
    })
    createdRoles.push(created)
  }
  
  return createdRoles
}

async function seedStaff(hospitals, roles, departments) {
  console.log('Seeding Staff...')
  
  const staff = []
  for (const hospital of hospitals) {
    const hospitalDepartments = departments.filter(d => d.hospitalId === hospital.id)
    const staffCount = faker.number.int({ min: 50, max: 200 })
    
    for (let i = 0; i < staffCount; i++) {
      const personal = createPersonalDetails()
      const contact = createContactDetails()
      const role = getRandomElement(roles)
      const department = getRandomElement(hospitalDepartments)
      
      const staffMember = await prisma.staff.create({
        data: {
          hospitalId: hospital.id,
          employeeId: `EMP${String(i + 1).padStart(5, '0')}`,
          personalDetails: personal,
          contactDetails: contact,
          roleId: role.id,
          departmentId: department.id,
          employmentType: getRandomElement(['permanent', 'contract', 'consultant', 'temporary']),
          employmentStatus: getRandomElement(['active', 'inactive', 'on_leave']),
          joiningDate: faker.date.past({ years: 10 }),
          qualifications: {
            education: [
              {
                degree: faker.helpers.arrayElement(['MBBS', 'MD', 'MS', 'BSc Nursing', 'MSc Nursing', 'BBA', 'MBA']),
                institution: faker.company.name() + ' University',
                year: faker.date.past({ years: 20 }).getFullYear()
              }
            ]
          },
          specializations: role.isClinicalRole ? [
            getRandomElement(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'])
          ] : [],
          languagesSpoken: getRandomElements(['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil'], 2),
          salaryDetails: {
            baseSalary: faker.number.int({ min: 30000, max: 200000 }),
            allowances: faker.number.int({ min: 5000, max: 50000 }),
            currency: 'INR'
          },
          performanceRatings: {
            overall: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
            lastReviewDate: faker.date.recent()
          }
        }
      })
      staff.push(staffMember)
    }
  }
  
  return staff
}

async function seedDoctors(staff) {
  console.log('Seeding Doctors...')
  
  const doctors = []
  // Filter staff members who should be doctors based on their roles
  const medicalStaff = staff.filter(s => {
    // Since we don't have role info in the staff object here, we'll take first portion of staff
    return true // We'll create doctors for a subset of staff
  }).slice(0, 50) // Take first 50 staff members as doctors
  
  for (const staffMember of medicalStaff) {
    const doctor = await prisma.doctor.create({
      data: {
        id: staffMember.id,
        doctorType: getRandomElement(['general_practitioner', 'specialist', 'super_specialist', 'consultant']),
        medicalRegistrationNumber: `MR${faker.string.numeric(8)}`,
        medicalCouncil: getRandomElement(['Medical Council of India', 'Maharashtra Medical Council', 'Delhi Medical Council']),
        registrationDate: faker.date.past({ years: 15 }),
        registrationExpiry: faker.date.future({ years: 5 }),
        medicalDegree: getRandomElement(['MBBS', 'MBBS, MD', 'MBBS, MS', 'MBBS, DNB']),
        specialization: getRandomElement(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine']),
        consultationFee: faker.number.int({ min: 500, max: 2000 }),
        followUpFee: faker.number.int({ min: 300, max: 1000 }),
        availableDays: [1, 2, 3, 4, 5], // Monday to Friday
        consultationDuration: getRandomElement([15, 20, 30]),
        maxPatientsPerDay: faker.number.int({ min: 20, max: 50 }),
        telemedicineEnabled: faker.datatype.boolean(),
        emergencyOnCall: faker.datatype.boolean(),
        patientSatisfactionRating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
        averageConsultationTime: faker.number.int({ min: 15, max: 45 })
      }
    })
    doctors.push(doctor)
  }
  
  return doctors
}

async function seedNurses(staff) {
  console.log('Seeding Nurses...')
  
  const nurses = []
  // Take different staff members for nurses
  const nursingStaff = staff.slice(50, 150) // Take staff members 50-150 as nurses
  
  for (const staffMember of nursingStaff) {
    const nurse = await prisma.nurse.create({
      data: {
        id: staffMember.id,
        nursingRegistrationNumber: `NR${faker.string.numeric(8)}`,
        nursingCouncil: getRandomElement(['Indian Nursing Council', 'Maharashtra Nursing Council', 'Delhi Nursing Council']),
        nursingDegree: getRandomElement(['GNM', 'BSc Nursing', 'MSc Nursing']),
        specialization: getRandomElement(['Critical Care', 'Pediatric', 'Psychiatric', 'Surgical', 'General']),
        certificationLevel: getRandomElement(['Staff Nurse', 'Senior Staff Nurse', 'Ward Sister', 'Nursing Supervisor']),
        yearsOfExperience: faker.number.int({ min: 1, max: 20 }),
        clinicalSpecializations: getRandomElements(['ICU', 'Emergency', 'OT', 'Ward'], 2),
        preferredShifts: getRandomElements(['morning', 'evening', 'night'], 2),
        patientCareQualityScore: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 })
      }
    })
    nurses.push(nurse)
  }
  
  return nurses
}

async function seedWards(hospitals, departments, floors, doctors) {
  console.log('Seeding Wards...')
  
  const wards = []
  for (const hospital of hospitals) {
    const hospitalDepartments = departments.filter(d => d.hospitalId === hospital.id)
    const hospitalFloors = floors.filter(f => f.hospitalId === hospital.id)
    const hospitalDoctors = doctors // We'll use all doctors for now
    
    const wardCount = faker.number.int({ min: 5, max: 15 })
    for (let i = 0; i < wardCount; i++) {
      const ward = await prisma.ward.create({
        data: {
          hospitalId: hospital.id,
          departmentId: getRandomElement(hospitalDepartments).id,
          floorId: getRandomElement(hospitalFloors).id,
          wardName: `Ward ${String.fromCharCode(65 + i)}`, // Ward A, B, C, etc.
          wardCode: `W${String.fromCharCode(65 + i)}`,
          wardType: getRandomElement(['general', 'icu', 'isolation', 'pediatric', 'maternity']),
          totalBeds: faker.number.int({ min: 10, max: 50 }),
          availableBeds: faker.number.int({ min: 5, max: 25 }),
          occupiedBeds: faker.number.int({ min: 5, max: 25 }),
          doctorInChargeId: hospitalDoctors.length > 0 ? getRandomElement(hospitalDoctors).id : null,
          visitingHours: {
            weekdays: '10:00-12:00, 16:00-18:00',
            weekends: '10:00-12:00, 16:00-17:00'
          },
          infectionControlLevel: getRandomElement(['standard', 'enhanced', 'isolation']),
          emergencyProtocols: {
            codeBlue: true,
            fireEvacuation: true,
            securityAlert: true
          }
        }
      })
      wards.push(ward)
    }
  }
  
  return wards
}

async function seedPatients(hospitals) {
  console.log('Seeding Patients...')
  
  const patients = []
  for (const hospital of hospitals) {
    const patientCount = faker.number.int({ min: 100, max: 500 })
    
    for (let i = 0; i < patientCount; i++) {
      const personal = createPersonalDetails()
      const contact = createContactDetails()
      const medical = createMedicalHistory()
      
      const patient = await prisma.patient.create({
        data: {
          hospitalId: hospital.id,
          patientNumber: `PAT${String(i + 1).padStart(6, '0')}`,
          mrn: `MRN${faker.string.numeric(8)}`,
          abhaId: faker.string.numeric(14),
          personalDetails: personal,
          contactDetails: contact,
          bloodGroup: personal.bloodGroup,
          allergies: medical.allergies,
          chronicConditions: medical.chronicConditions,
          familyHistory: {
            diabetes: faker.datatype.boolean(),
            hypertension: faker.datatype.boolean(),
            heartDisease: faker.datatype.boolean(),
            cancer: faker.datatype.boolean()
          },
          medicalHistory: medical,
          insuranceDetails: {
            provider: getRandomElement(['HDFC ERGO', 'ICICI Lombard', 'Star Health', 'Max Bupa', 'Government Scheme']),
            policyNumber: faker.string.alphanumeric(12).toUpperCase(),
            coverageAmount: faker.number.int({ min: 100000, max: 1000000 }),
            validUntil: faker.date.future()
          },
          patientType: getRandomElement(['regular', 'vip', 'staff', 'emergency']),
          preferences: {
            preferredLanguage: getRandomElement(['English', 'Hindi', 'Marathi']),
            dietaryRestrictions: getRandomElements(['Vegetarian', 'Diabetic', 'Low Sodium'], 1),
            communicationMode: getRandomElement(['phone', 'email', 'sms'])
          },
          riskFactors: {
            fallRisk: getRandomElement(['low', 'medium', 'high']),
            infectionRisk: getRandomElement(['low', 'medium', 'high']),
            allergicReactions: medical.allergies.length > 0
          }
        }
      })
      patients.push(patient)
    }
  }
  
  return patients
}

async function seedIcdCodes() {
  console.log('Seeding ICD Codes...')
  
  const icd10Codes = [
    { code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiovascular' },
    { code: 'E11', description: 'Type 2 diabetes mellitus', category: 'Endocrine' },
    { code: 'J44', description: 'Chronic obstructive pulmonary disease', category: 'Respiratory' },
    { code: 'M79.3', description: 'Panniculitis, unspecified', category: 'Musculoskeletal' },
    { code: 'K59.00', description: 'Constipation, unspecified', category: 'Digestive' },
    { code: 'N39.0', description: 'Urinary tract infection, site not specified', category: 'Genitourinary' },
    { code: 'H52.4', description: 'Presbyopia', category: 'Eye and Adnexa' },
    { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', category: 'Mental Health' }
  ]
  
  const createdIcd10 = []
  for (const code of icd10Codes) {
    const created = await prisma.icd10Code.create({
      data: {
        code: code.code,
        description: code.description,
        category: code.category,
        chapter: `Chapter ${faker.number.int({ min: 1, max: 22 })}`,
        billable: true,
        synonyms: [faker.lorem.words(2), faker.lorem.words(3)],
        notes: `Clinical notes for ${code.description}`
      }
    })
    createdIcd10.push(created)
  }
  
  return createdIcd10
}

async function seedDiseases(icd10Codes) {
  console.log('Seeding Diseases...')
  
  const diseases = []
  for (const icdCode of icd10Codes) {
    const disease = await prisma.disease.create({
      data: {
        icd10CodeId: icdCode.id,
        diseaseName: {
          en: icdCode.description,
          hi: `${icdCode.description} (Hindi)`,
          mr: `${icdCode.description} (Marathi)`
        },
        commonNames: {
          en: [faker.lorem.words(2)],
          hi: [faker.lorem.words(2)],
          mr: [faker.lorem.words(2)]
        },
        specialty: getRandomElement(['Internal Medicine', 'Cardiology', 'Endocrinology', 'Pulmonology']),
        diseaseCategory: getRandomElement(['chronic', 'acute', 'infectious', 'genetic']),
        pathophysiology: {
          description: faker.lorem.paragraph(),
          mechanism: faker.lorem.sentence()
        },
        riskFactors: getRandomElements(['Age', 'Genetics', 'Lifestyle', 'Environment'], 2),
        symptoms: getRandomElements(['Fatigue', 'Pain', 'Fever', 'Nausea', 'Headache'], 3),
        diagnosticCriteria: {
          clinical: faker.lorem.sentence(),
          laboratory: faker.lorem.sentence(),
          imaging: faker.lorem.sentence()
        },
        treatmentProtocols: {
          firstLine: faker.lorem.sentence(),
          secondLine: faker.lorem.sentence(),
          surgical: faker.datatype.boolean() ? faker.lorem.sentence() : null
        },
        prognosis: getRandomElement(['excellent', 'good', 'fair', 'poor']),
        isChronic: faker.datatype.boolean(),
        isContagious: faker.datatype.boolean(),
        prevalenceData: {
          global: `${faker.number.float({ min: 0.1, max: 10, fractionDigits: 1 })}%`,
          india: `${faker.number.float({ min: 0.1, max: 15, fractionDigits: 1 })}%`
        }
      }
    })
    diseases.push(disease)
  }
  
  return diseases
}

async function seedExaminationTemplates(hospitals, departments, staff) {
  console.log('Seeding Examination Templates...')
  
  const templates = []
  const templateTypes = [
    'General Physical Examination',
    'Cardiovascular Assessment',
    'Neurological Examination',
    'Respiratory Assessment',
    'Gastrointestinal Examination',
    'Musculoskeletal Assessment'
  ]
  
  for (const hospital of hospitals) {
    const hospitalDepartments = departments.filter(d => d.hospitalId === hospital.id)
    const hospitalStaff = staff.filter(s => s.hospitalId === hospital.id)
    
    for (const templateType of templateTypes) {
      const template = await prisma.examinationTemplate.create({
        data: {
          hospitalId: hospital.id,
          departmentId: getRandomElement(hospitalDepartments).id,
          templateName: templateType,
          templateType: getRandomElement(['assessment', 'examination', 'screening']),
          specialty: getRandomElement(['General Medicine', 'Cardiology', 'Neurology', 'Pulmonology']),
          examinationType: getRandomElement(['routine', 'specialized', 'emergency']),
          templateStructure: {
            sections: [
              {
                name: 'History',
                fields: ['chief_complaint', 'history_of_present_illness', 'past_medical_history']
              },
              {
                name: 'Physical Examination',
                fields: ['vital_signs', 'general_appearance', 'system_examination']
              },
              {
                name: 'Assessment',
                fields: ['clinical_impression', 'diagnosis', 'plan']
              }
            ]
          },
          formFields: {
            vital_signs: {
              blood_pressure: { type: 'text', required: true },
              heart_rate: { type: 'number', required: true },
              temperature: { type: 'number', required: true },
              respiratory_rate: { type: 'number', required: true }
            }
          },
          mandatoryFields: ['chief_complaint', 'vital_signs', 'clinical_impression'],
          optionalFields: ['family_history', 'social_history', 'review_of_systems'],
          normalRanges: {
            blood_pressure: '120/80 mmHg',
            heart_rate: '60-100 bpm',
            temperature: '98.6°F (37°C)',
            respiratory_rate: '12-20 breaths/min'
          },
          createdBy: getRandomElement(hospitalStaff).id,
          version: '1.0'
        }
      })
      templates.push(template)
    }
  }
  
  return templates
}

async function seedPatientVisits(patients, hospitals, doctors) {
  console.log('Seeding Patient Visits...')
  
  const visits = []
  
  for (let i = 0; i < 1000; i++) {
    const patient = getRandomElement(patients)
    const hospital = hospitals.find(h => h.id === patient.hospitalId)
    const hospitalDoctors = doctors // Use all doctors for now
    
    const visit = await prisma.patientVisit.create({
      data: {
        patientId: patient.id,
        hospitalId: hospital.id,
        visitNumber: `VIS${String(i + 1).padStart(8, '0')}`,
        visitType: getRandomElement(['OPD', 'IPD', 'Emergency', 'Day_Care']),
        visitCategory: getRandomElement(['consultation', 'procedure', 'follow_up']),
        episodeType: getRandomElement(['new', 'follow_up', 'continuation']),
        visitDate: faker.date.recent({ days: 30 }),
        chiefComplaint: getRandomElement([
          'Chest pain',
          'Shortness of breath',
          'Abdominal pain',
          'Headache',
          'Fever',
          'Back pain',
          'Joint pain',
          'Fatigue'
        ]),
        presentingSymptoms: {
          primary: getRandomElements(['pain', 'swelling', 'fever', 'nausea'], 2),
          duration: getRandomElement(['1 day', '3 days', '1 week', '2 weeks', '1 month']),
          severity: getRandomElement(['mild', 'moderate', 'severe'])
        },
        status: getRandomElement(['registered', 'in_progress', 'completed', 'cancelled']),
        priorityLevel: faker.number.int({ min: 1, max: 5 }),
        urgencyLevel: getRandomElement(['routine', 'urgent', 'emergent']),
        attendingPhysicianId: hospitalDoctors.length > 0 ? getRandomElement(hospitalDoctors).id : null,
        admittingDiagnosis: getRandomElement([
          'Hypertension',
          'Diabetes mellitus',
          'Upper respiratory infection',
          'Gastroenteritis',
          'Musculoskeletal pain'
        ]),
        vitalSignsOnArrival: {
          bloodPressure: `${faker.number.int({ min: 110, max: 140 })}/${faker.number.int({ min: 70, max: 90 })}`,
          heartRate: faker.number.int({ min: 60, max: 100 }),
          temperature: faker.number.float({ min: 97.0, max: 102.0, fractionDigits: 1 }),
          respiratoryRate: faker.number.int({ min: 12, max: 24 }),
          oxygenSaturation: faker.number.int({ min: 95, max: 100 })
        },
        initialAssessment: faker.lorem.paragraph(),
        estimatedCost: faker.number.int({ min: 1000, max: 50000 }),
        visitOutcome: getRandomElement(['improved', 'stable', 'referred', 'admitted'])
      }
    })
    visits.push(visit)
  }
  
  return visits
}

async function seedExaminations(visits, templates, staff) {
  console.log('Seeding Examinations...')
  
  const examinations = []
  
  for (let i = 0; i < 500; i++) {
    const visit = getRandomElement(visits)
    const template = getRandomElement(templates)
    const doctor = getRandomElement(staff)
    
    const examination = await prisma.examination.create({
      data: {
        visitId: visit.id,
        templateId: template.id,
        doctorId: doctor.id,
        examinationType: getRandomElement(['routine', 'comprehensive', 'focused', 'follow_up']),
        vitalSigns: {
          bloodPressure: `${faker.number.int({ min: 110, max: 140 })}/${faker.number.int({ min: 70, max: 90 })}`,
          heartRate: faker.number.int({ min: 60, max: 100 }),
          temperature: faker.number.float({ min: 97.0, max: 102.0, fractionDigits: 1 }),
          respiratoryRate: faker.number.int({ min: 12, max: 24 }),
          weight: faker.number.float({ min: 40, max: 120, fractionDigits: 1 }),
          height: faker.number.int({ min: 150, max: 190 })
        },
        physicalExamination: {
          generalAppearance: getRandomElement(['Well-appearing', 'Appears ill', 'In distress', 'Alert and oriented']),
          skinExam: getRandomElement(['Normal', 'Rash present', 'Pale', 'Cyanotic']),
          headNeckExam: getRandomElement(['Normal', 'Lymphadenopathy', 'Thyromegaly']),
          cardiovascularExam: getRandomElement(['Regular rate and rhythm', 'Murmur present', 'Irregular rhythm']),
          respiratoryExam: getRandomElement(['Clear to auscultation', 'Crackles present', 'Wheezing']),
          abdominalExam: getRandomElement(['Soft, non-tender', 'Tenderness present', 'Distended']),
          neurologicalExam: getRandomElement(['Grossly intact', 'Focal deficits', 'Altered mental status'])
        },
        findings: {
          significant: faker.lorem.sentences(2),
          normal: faker.lorem.sentences(1),
          abnormal: faker.lorem.sentences(1)
        },
        clinicalImpressions: faker.lorem.paragraph(),
        assessment: {
          primaryDiagnosis: getRandomElement([
            'Essential hypertension',
            'Type 2 diabetes mellitus',
            'Upper respiratory infection',
            'Gastroesophageal reflux disease',
            'Osteoarthritis'
          ]),
          secondaryDiagnoses: getRandomElements([
            'Obesity',
            'Hyperlipidemia',
            'Anxiety disorder',
            'Vitamin D deficiency'
          ], faker.number.int({ min: 0, max: 2 }))
        },
        plan: {
          medications: getRandomElements([
            'Lisinopril 10mg daily',
            'Metformin 500mg twice daily',
            'Ibuprofen 400mg as needed',
            'Omeprazole 20mg daily'
          ], faker.number.int({ min: 1, max: 3 })),
          followUp: getRandomElement(['2 weeks', '1 month', '3 months', '6 months']),
          labOrders: getRandomElements([
            'Complete blood count',
            'Comprehensive metabolic panel',
            'Lipid panel',
            'HbA1c'
          ], faker.number.int({ min: 0, max: 2 }))
        },
        status: getRandomElement(['in_progress', 'completed', 'pending_review']),
        examinationDuration: faker.number.int({ min: 15, max: 60 }),
        completenessScore: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 })
      }
    })
    examinations.push(examination)
  }
  
  return examinations
}

async function seedDiagnoses(visits, examinations, diseases, staff) {
  console.log('Seeding Diagnoses...')
  
  const diagnoses = []
  
  for (let i = 0; i < 800; i++) {
    const visit = getRandomElement(visits)
    const examination = getRandomElement(examinations.filter(e => e.visitId === visit.id)) || getRandomElement(examinations)
    const disease = getRandomElement(diseases)
    const doctor = getRandomElement(staff)
    
    const diagnosis = await prisma.diagnosis.create({
      data: {
        visitId: visit.id,
        examinationId: examination?.id,
        diseaseId: disease.id,
        doctorId: doctor.id,
        diagnosisType: getRandomElement(['primary', 'secondary', 'complication', 'comorbidity']),
        diagnosisMethod: getRandomElement(['clinical', 'laboratory', 'imaging', 'biopsy']),
        confidenceLevel: faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 2 }),
        severity: getRandomElement(['mild', 'moderate', 'severe']),
        stage: getRandomElement(['early', 'intermediate', 'advanced']),
        onsetDate: faker.date.recent({ days: 30 }),
        duration: getRandomElement(['acute', 'chronic', 'subacute']),
        progression: getRandomElement(['stable', 'improving', 'worsening', 'progressive']),
        supportingEvidence: {
          symptoms: getRandomElements(['fever', 'pain', 'swelling', 'fatigue'], 2),
          signs: getRandomElements(['tenderness', 'swelling', 'rash', 'murmur'], 1),
          labResults: faker.datatype.boolean() ? ['Elevated WBC count'] : [],
          imagingResults: faker.datatype.boolean() ? ['Abnormal chest X-ray'] : []
        },
        treatmentResponse: getRandomElement(['excellent', 'good', 'partial', 'poor']),
        prognosis: getRandomElement(['excellent', 'good', 'fair', 'guarded', 'poor']),
        functionalImpact: {
          mobility: getRandomElement(['none', 'mild', 'moderate', 'severe']),
          dailyActivities: getRandomElement(['none', 'mild', 'moderate', 'severe']),
          workCapacity: getRandomElement(['full', 'limited', 'unable'])
        },
        isPrimary: faker.datatype.boolean({ probability: 0.6 }),
        billable: true,
        reportable: faker.datatype.boolean({ probability: 0.1 }),
        notes: faker.lorem.sentence()
      }
    })
    diagnoses.push(diagnosis)
  }
  
  return diagnoses
}

// Main seed function
async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Note: Skipping cleanup to avoid MongoDB replica set requirement
    console.log('📝 Seeding data (without cleanup)...')
    
    // Seed in order of dependencies
    const networks = await seedHospitalNetworks()
    const hospitals = await seedHospitals(networks)
    const categories = await seedDepartmentCategories()
    const floors = await seedFloors(hospitals)
    const departments = await seedDepartments(hospitals, categories, floors)
    
    const roomTypes = await seedRoomTypes()
    const rooms = await seedRooms(hospitals, floors, departments, roomTypes)
    
    const bedTypes = await seedBedTypes()
    const beds = await seedBeds(hospitals, rooms, departments, bedTypes)
    
    const roleCategories = await seedRoleCategories()
    const roles = await seedRoles(roleCategories)
    const staff = await seedStaff(hospitals, roles, departments)
    
    const doctors = await seedDoctors(staff)
    const nurses = await seedNurses(staff)
    const wards = await seedWards(hospitals, departments, floors, doctors)
    
    const patients = await seedPatients(hospitals)
    
    const icd10Codes = await seedIcdCodes()
    const diseases = await seedDiseases(icd10Codes)
    
    const templates = await seedExaminationTemplates(hospitals, departments, staff)
    const visits = await seedPatientVisits(patients, hospitals, doctors)
    const examinations = await seedExaminations(visits, templates, staff)
    const diagnoses = await seedDiagnoses(visits, examinations, diseases, staff)
    
    console.log('✅ Database seeding completed successfully!')
    console.log(`📊 Seeding Summary:`)
    console.log(`   Hospital Networks: ${networks.length}`)
    console.log(`   Hospitals: ${hospitals.length}`)
    console.log(`   Departments: ${departments.length}`)
    console.log(`   Floors: ${floors.length}`)
    console.log(`   Rooms: ${rooms.length}`)
    console.log(`   Beds: ${beds.length}`)
    console.log(`   Staff: ${staff.length}`)
    console.log(`   Doctors: ${doctors.length}`)
    console.log(`   Nurses: ${nurses.length}`)
    console.log(`   Wards: ${wards.length}`)
    console.log(`   Patients: ${patients.length}`)
    console.log(`   Diseases: ${diseases.length}`)
    console.log(`   Patient Visits: ${visits.length}`)
    console.log(`   Examinations: ${examinations.length}`)
    console.log(`   Diagnoses: ${diagnoses.length}`)
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

module.exports = main
