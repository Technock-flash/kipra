import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin@2024', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@kipra.org' },
    update: {},
    create: {
      email: 'superadmin@kipra.org',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: 'ACTIVE',
    },
  });
  console.log('Created Super Admin:', superAdmin.email);

  // Create Admin
  const adminPassword = await bcrypt.hash('Admin@2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kipra.org' },
    update: {},
    create: {
      email: 'admin@kipra.org',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: 'ACTIVE',
    },
  });
  console.log('Created Admin:', admin.email);

  // Create Treasurer
  const treasurerPassword = await bcrypt.hash('Treasurer@2024', 12);
  const treasurer = await prisma.user.upsert({
    where: { email: 'treasurer@kipra.org' },
    update: {},
    create: {
      email: 'treasurer@kipra.org',
      password: treasurerPassword,
      firstName: 'Chief',
      lastName: 'Treasurer',
      role: UserRole.TREASURER,
      status: 'ACTIVE',
    },
  });
  console.log('Created Treasurer:', treasurer.email);

  // Create Secretary
  const secretaryPassword = await bcrypt.hash('Secretary@2024', 12);
  const secretary = await prisma.user.upsert({
    where: { email: 'secretary@kipra.org' },
    update: {},
    create: {
      email: 'secretary@kipra.org',
      password: secretaryPassword,
      firstName: 'Church',
      lastName: 'Secretary',
      role: UserRole.SECRETARY,
      status: 'ACTIVE',
    },
  });
  console.log('Created Secretary:', secretary.email);

  // Create Apostle
  const apostlePassword = await bcrypt.hash('Apostle@2024', 12);
  const apostle = await prisma.user.upsert({
    where: { email: 'apostle@kipra.org' },
    update: {},
    create: {
      email: 'apostle@kipra.org',
      password: apostlePassword,
      firstName: 'Senior',
      lastName: 'Apostle',
      role: UserRole.APOSTLE,
      status: 'ACTIVE',
    },
  });
  console.log('Created Apostle:', apostle.email);

  // Create Leader
  const leaderPassword = await bcrypt.hash('Leader@2024', 12);
  const leader = await prisma.user.upsert({
    where: { email: 'leader@kipra.org' },
    update: {},
    create: {
      email: 'leader@kipra.org',
      password: leaderPassword,
      firstName: 'Department',
      lastName: 'Leader',
      role: UserRole.LEADER,
      status: 'ACTIVE',
    },
  });
  console.log('Created Leader:', leader.email);

  // Create sample departments
  const departments = [
    { name: 'Ushering', description: 'Welcoming and seating of congregation', color: '#3b82f6' },
    { name: 'Praise & Worship', description: 'Leading worship sessions', color: '#8b5cf6' },
    { name: 'Media & Technical', description: 'Sound, visuals, and livestream', color: '#10b981' },
    { name: 'Children Ministry', description: 'Children church and activities', color: '#f59e0b' },
    { name: 'Evangelism', description: 'Outreach and soul winning', color: '#ef4444' },
    { name: 'Protocol', description: 'Order and event coordination', color: '#6366f1' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log('Created departments');

  // Create sample members
  const sampleMembers = [
    { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '0244123456', gender: 'MALE', isLeader: true, leaderRole: 'Head of Ushering' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '0244234567', gender: 'FEMALE', isLeader: true, leaderRole: 'Worship Leader' },
    { firstName: 'Michael', lastName: 'Johnson', email: 'michael@example.com', phone: '0244345678', gender: 'MALE' },
    { firstName: 'Sarah', lastName: 'Williams', email: 'sarah@example.com', phone: '0244456789', gender: 'FEMALE' },
    { firstName: 'David', lastName: 'Brown', email: 'david@example.com', phone: '0244567890', gender: 'MALE' },
  ];

  for (let i = 0; i < sampleMembers.length; i++) {
    const member = sampleMembers[i];
    await prisma.member.create({
      data: {
        ...member,
        memberNumber: `KPRA-${1000 + i}`,
        departmentId: i < 3 ? (await prisma.department.findFirst({ where: { name: departments[i].name } }))?.id : null,
        joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      },
    });
  }
  console.log('Created sample members');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

