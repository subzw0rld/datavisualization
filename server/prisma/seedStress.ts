import { PrismaClient } from '@prisma/client';
import { SKILL_DATA, LEVEL_DATA, LOCATION_DATA, LEVEL_RADIUS_CONFIG, ORBITAL_DISTANCE_CONFIG } from '../../src/data/metadata';
import { PROJECT_DATA } from '../../src/data/projectData';

const prisma = new PrismaClient();

const LEVEL_MASS_CONFIG: Record<string, number> = {
  '4A': 6.0,
  '4B': 5.5,
  '5A': 4.5,
  '5B': 4.0,
  '6A': 3.5,
  '6B': 3.0,
  '7A': 2.5,
  '7B': 2.0,
  '8A': 1.5,
  '8B': 1.0
};

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Chris', 'Pat', 'Jamie', 'Robin',
  'Aiden', 'Logan', 'Dakota', 'Cameron', 'Riley', 'Skyler', 'Jesse', 'Drew', 'Reese', 'Rowan',
  'Elena', 'Marcus', 'Priya', 'Hiroshi', 'Chloe', 'Mateo', 'Amina', 'Lucas', 'Fatima', 'Liam',
  'Oliver', 'Sophia', 'Noah', 'Emma', 'Arthur', 'Isabella', 'Mia', 'Arjun', 'Zoe', 'Wei',
  'Siddharth', 'Ananya', 'Chen', 'Mei', 'Dev', 'Maya', 'Kavita', 'Rohan', 'Kenji', 'Sakura'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Patel', 'Sharma', 'Gupta', 'Kumar', 'Singh', 'Takahashi', 'Tanaka', 'Watanabe', 'Chen', 'Wang',
  'Kim', 'Park', 'Lee', 'Müller', 'Schmidt', 'Schneider', 'Dubois', 'Leroy', 'Moreau', 'Costa'
];

const TECH_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Systems Architect',
  'Frontend Specialist', 'Backend Architect', 'Cloud Infrastructure Engineer', 'Data Scientist',
  'ML Engineer', 'DevOps Specialist', 'Security Analyst', 'Fullstack Developer',
  'Performance Engineer', 'Database Administrator', 'Site Reliability Engineer'
];

const CLIENTS = [
  'Global Finance Corp', 'Apex Healthcare', 'Omni Retail Global', 'Starlight Telecom',
  'Cyberdyne Media', 'Vanguard Logistics', 'Quantum Energy', 'Skyward Aerospace'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Starting 5,000 Team Dataset Database Seeding...');

  // 1. Ensure skills exist
  for (const [idStr, s] of Object.entries(SKILL_DATA)) {
    const id = Number(idStr);
    await prisma.skill.upsert({
      where: { id },
      update: { skill: s.skill, color: s.color },
      create: { id, skill: s.skill, color: s.color }
    });
  }

  // 2. Ensure levels exist
  for (const [idStr, l] of Object.entries(LEVEL_DATA)) {
    const id = Number(idStr);
    await prisma.level.upsert({
      where: { id },
      update: { level: l.level, color: l.color },
      create: { id, level: l.level, color: l.color }
    });
  }

  // 3. Ensure locations exist
  for (const [idStr, loc] of Object.entries(LOCATION_DATA)) {
    const id = Number(idStr);
    await prisma.location.upsert({
      where: { id },
      update: { location: loc.location, color: loc.color },
      create: { id, location: loc.location, color: loc.color }
    });
  }

  // 4. Ensure System Configurations
  await prisma.systemConfig.upsert({
    where: { key: 'levelRadius' },
    update: { value: LEVEL_RADIUS_CONFIG },
    create: { key: 'levelRadius', value: LEVEL_RADIUS_CONFIG }
  });
  await prisma.systemConfig.upsert({
    where: { key: 'orbitalDistance' },
    update: { value: ORBITAL_DISTANCE_CONFIG },
    create: { key: 'orbitalDistance', value: ORBITAL_DISTANCE_CONFIG }
  });
  await prisma.systemConfig.upsert({
    where: { key: 'levelMass' },
    update: { value: LEVEL_MASS_CONFIG },
    create: { key: 'levelMass', value: LEVEL_MASS_CONFIG }
  });

  // 5. Seed Project Employees (keep intact)
  console.log('Verifying project dataset (6 nodes)...');
  for (const emp of Object.values(PROJECT_DATA)) {
    await prisma.employee.upsert({
      where: {
        empID_dataset: {
          empID: emp.empID,
          dataset: 'project'
        }
      },
      update: {
        name: emp.name,
        avatar: emp.avatar || '',
        location: emp.location,
        desig: emp.desig,
        level: emp.level,
        supervisor: emp.supervisor ?? null,
        totalSupervisee: emp.totalSupervisee ?? 0,
        nucleus: emp.nucleus ?? false,
        email: emp.email ?? null,
        client: emp.client ?? [],
        skill: emp.skill ?? []
      },
      create: {
        empID: emp.empID,
        dataset: 'project',
        name: emp.name,
        avatar: emp.avatar || '',
        location: emp.location,
        desig: emp.desig,
        level: emp.level,
        supervisor: emp.supervisor ?? null,
        totalSupervisee: emp.totalSupervisee ?? 0,
        nucleus: emp.nucleus ?? false,
        email: emp.email ?? null,
        client: emp.client ?? [],
        skill: emp.skill ?? []
      }
    });
  }

  // 6. Delete old team dataset to cleanly insert exactly 5,000 records
  console.log('Cleaning old team dataset...');
  await prisma.employee.deleteMany({
    where: { dataset: 'team' }
  });

  console.log('Generating 5,000 hierarchical team members across 20 galaxy clusters (flagship cluster with 1,000 nodes)...');
  const rootsCount = 20;
  const totalEmployees: any[] = [];

  let nextEmpID = 10001;

  // Distribute 5,000 employees so that Cluster 0 is the primary flagship galaxy with 1,000 nodes (highest systemMass),
  // while the other 19 clusters are satellite galaxies (~210 nodes each).
  const clusterTargets: number[] = [1000];
  const remainingNodes = 5000 - 1000;
  const satelliteCount = rootsCount - 1;
  const baseSat = Math.floor(remainingNodes / satelliteCount);
  const remSat = remainingNodes % satelliteCount;
  for (let i = 0; i < satelliteCount; i++) {
    clusterTargets.push(baseSat + (i < remSat ? 1 : 0));
  }

  for (let r = 0; r < rootsCount; r++) {
    const clusterTarget = clusterTargets[r];
    const rootEmpID = nextEmpID++;
    const rootName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
    const rootLoc = (r % 7) + 1;
    const clientPool = [getRandomElement(CLIENTS), getRandomElement(CLIENTS)];

    // Managers count: 25 managers for the flagship 1,000-node cluster, 10 for satellites
    const managersCount = r === 0 ? 25 : 10;
    const icTotal = clusterTarget - 1 - managersCount;
    const baseIcPerManager = Math.floor(icTotal / managersCount);
    const remIc = icTotal % managersCount;

    // 1 Galaxy Nucleus (Managing Director / CTO)
    totalEmployees.push({
      empID: rootEmpID,
      dataset: 'team',
      name: rootName,
      avatar: '',
      location: rootLoc,
      desig: r === 0 ? 'Chief Technology Officer' : 'Managing Director',
      level: '4A',
      supervisor: null,
      totalSupervisee: clusterTarget - 1,
      nucleus: true,
      email: `${rootName.toLowerCase().replace(/[^a-z]/g, '.')}@enterprise.org`,
      client: clientPool,
      skill: [
        { id: (r % 10) + 1, level: 3 },
        { id: ((r + 2) % 10) + 1, level: 2 }
      ]
    });

    // Managers per cluster
    for (let m = 0; m < managersCount; m++) {
      const managerEmpID = nextEmpID++;
      const managerName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
      const mgrLoc = ((rootLoc + m) % 7) + 1;
      const icCount = baseIcPerManager + (m < remIc ? 1 : 0);

      totalEmployees.push({
        empID: managerEmpID,
        dataset: 'team',
        name: managerName,
        avatar: '',
        location: mgrLoc,
        desig: m % 2 === 0 ? 'Engineering Director' : 'Principal Engineering Lead',
        level: m % 2 === 0 ? '4B' : '5A',
        supervisor: rootEmpID,
        totalSupervisee: icCount,
        nucleus: false,
        email: `${managerName.toLowerCase().replace(/[^a-z]/g, '.')}@enterprise.org`,
        client: [clientPool[m % clientPool.length]],
        skill: [
          { id: ((m * 2) % 10) + 1, level: 2 },
          { id: ((m * 2 + 3) % 10) + 1, level: 3 }
        ]
      });

      // Individual Contributors under this manager
      for (let ic = 0; ic < icCount; ic++) {
        const icEmpID = nextEmpID++;
        const icName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
        const icLoc = ((mgrLoc + ic) % 7) + 1;
        const levelCode = ic % 5 === 0 ? '5B' : ic % 3 === 0 ? '6A' : ic % 2 === 0 ? '6B' : '7A';

        const skillList = [
          { id: ((ic * 3 + r) % 10) + 1, level: getRandomInt(1, 3) }
        ];
        if (ic % 2 === 0) {
          skillList.push({ id: ((ic * 7 + m) % 10) + 1, level: getRandomInt(1, 2) });
        }

        totalEmployees.push({
          empID: icEmpID,
          dataset: 'team',
          name: icName,
          avatar: '',
          location: icLoc,
          desig: getRandomElement(TECH_TITLES),
          level: levelCode,
          supervisor: managerEmpID,
          totalSupervisee: 0,
          nucleus: false,
          email: `${icName.toLowerCase().replace(/[^a-z]/g, '.')}@enterprise.org`,
          client: [clientPool[0]],
          skill: skillList
        });
      }
    }
  }

  console.log(`Generated total ${totalEmployees.length} employee records.`);

  // Batch insert into PostgreSQL using createMany for maximum throughput
  const chunkSize = 1000;
  for (let i = 0; i < totalEmployees.length; i += chunkSize) {
    const chunk = totalEmployees.slice(i, i + chunkSize);
    console.log(`Inserting records ${i + 1} to ${i + chunk.length}...`);
    await prisma.employee.createMany({
      data: chunk
    });
  }

  console.log('✅ Successfully seeded 5,000 Team dataset records into PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('❌ Error during 5,000 seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
