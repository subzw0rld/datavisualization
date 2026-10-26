import { PrismaClient } from '@prisma/client';
import { SKILL_DATA, LEVEL_DATA, LOCATION_DATA, LEVEL_RADIUS_CONFIG, ORBITAL_DISTANCE_CONFIG } from '../../src/data/metadata';
import { PROJECT_DATA } from '../../src/data/projectData';
import { TEAM_DATA } from '../../src/data/teamData';
const prisma = new PrismaClient();
const LEVEL_MASS_CONFIG = {
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
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Seed Skills
    console.log('Seeding skills...');
    for (const [idStr, s] of Object.entries(SKILL_DATA)) {
        const id = Number(idStr);
        await prisma.skill.upsert({
            where: { id },
            update: { skill: s.skill, color: s.color },
            create: { id, skill: s.skill, color: s.color }
        });
    }
    // 2. Seed Levels
    console.log('Seeding levels...');
    for (const [idStr, l] of Object.entries(LEVEL_DATA)) {
        const id = Number(idStr);
        await prisma.level.upsert({
            where: { id },
            update: { level: l.level, color: l.color },
            create: { id, level: l.level, color: l.color }
        });
    }
    // 3. Seed Locations
    console.log('Seeding locations...');
    for (const [idStr, loc] of Object.entries(LOCATION_DATA)) {
        const id = Number(idStr);
        await prisma.location.upsert({
            where: { id },
            update: { location: loc.location, color: loc.color },
            create: { id, location: loc.location, color: loc.color }
        });
    }
    // 4. Seed System Configurations
    console.log('Seeding system configs...');
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
    // 5. Seed Project Employees
    console.log('Seeding project dataset...');
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
    // 6. Seed Team Employees
    console.log('Seeding team dataset...');
    for (const emp of Object.values(TEAM_DATA)) {
        await prisma.employee.upsert({
            where: {
                empID_dataset: {
                    empID: emp.empID,
                    dataset: 'team'
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
                dataset: 'team',
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
    console.log('✅ Seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
