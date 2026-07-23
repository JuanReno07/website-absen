import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Positions
  const positions = [
    { name: 'Chief of Police', description: 'Kepala Kepolisian ASE Roleplay' },
    { name: 'Deputy Chief', description: 'Wakil Kepala Kepolisian' },
    { name: 'Captain', description: 'Perwira Menengah / Kepala Divisi' },
    { name: 'Lieutenant', description: 'Komandan Pengawas Lapangan' },
    { name: 'Sergeant', description: 'Pengawas Petugas Lapangan' },
    { name: 'Officer', description: 'Petugas Kepolisian Aktif' },
    { name: 'Cadet', description: 'Anggota Magang Kepolisian' },
    { name: 'EMS Director', description: 'Direktur Medis & Penyelamatan' },
    { name: 'Paramedic', description: 'Petugas Medis Lapangan' },
    { name: 'Staff Administrative', description: 'Staf Administrasi & Logistik' },
  ];

  const createdPositions: Record<string, string> = {};

  for (const pos of positions) {
    const p = await prisma.position.upsert({
      where: { name: pos.name },
      update: { description: pos.description },
      create: pos,
    });
    createdPositions[pos.name] = p.id;
  }

  console.log('✅ Positions created');

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('password123', 10);

  // 2. Create Admin Account
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      discord_name: 'SuperAdmin#0001',
      ooc_name: 'Budi Admin',
      steam_hex: '110000199887766',
      position_id: createdPositions['Chief of Police'],
      is_active: true,
    },
    create: {
      username: 'admin',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      discord_name: 'SuperAdmin#0001',
      ooc_name: 'Budi Admin',
      steam_hex: '110000199887766',
      position_id: createdPositions['Chief of Police'],
      is_active: true,
    },
  });

  console.log('✅ Admin account ready (admin / admin123)');

  // 3. Create Member Accounts (10 Users)
  const dummyMembers = [
    {
      username: 'officer1',
      discord_name: 'AlexRider#1234',
      ooc_name: 'Alex Supriadi',
      steam_hex: '11000014a5b6c7d',
      pos: 'Sergeant',
    },
    {
      username: 'officer2',
      discord_name: 'SarahCon#5678',
      ooc_name: 'Sarah Wijaya',
      steam_hex: '11000018e9f0a1b',
      pos: 'Officer',
    },
    {
      username: 'officer3',
      discord_name: 'RianGamer#9988',
      ooc_name: 'Rian Pratama',
      steam_hex: '11000011c2d3e4f',
      pos: 'Cadet',
    },
    {
      username: 'chief1',
      discord_name: 'DavidChief#0007',
      ooc_name: 'David Santoso',
      steam_hex: '11000017a8b9c0d',
      pos: 'Deputy Chief',
    },
    {
      username: 'medic1',
      discord_name: 'DocKevin#3322',
      ooc_name: 'Kevin Gunawan',
      steam_hex: '11000013f4e5d6c',
      pos: 'EMS Director',
    },
    {
      username: 'medic2',
      discord_name: 'NurseDewi#7711',
      ooc_name: 'Dewi Lestari',
      steam_hex: '11000012b1a0f9e',
      pos: 'Paramedic',
    },
    {
      username: 'officer4',
      discord_name: 'BagasTank#4455',
      ooc_name: 'Bagas Kurnia',
      steam_hex: '11000015c6d7e8f',
      pos: 'Lieutenant',
    },
    {
      username: 'officer5',
      discord_name: 'CitraPolice#8822',
      ooc_name: 'Citra Melati',
      steam_hex: '11000019d0e1f2a',
      pos: 'Officer',
    },
    {
      username: 'staff1',
      discord_name: 'EkoLogistics#1122',
      ooc_name: 'Eko Raharjo',
      steam_hex: '11000016b5a4c3d',
      pos: 'Staff Administrative',
    },
    {
      username: 'cadet1',
      discord_name: 'FajarNewbie#9900',
      ooc_name: 'Fajar Hidayat',
      steam_hex: '11000010f9e8d7c',
      pos: 'Cadet',
    },
  ];

  const createdUserIds: string[] = [];

  for (const m of dummyMembers) {
    const u = await prisma.user.upsert({
      where: { username: m.username },
      update: {
        password_hash: userPasswordHash,
        role: 'MEMBER',
        discord_name: m.discord_name,
        ooc_name: m.ooc_name,
        steam_hex: m.steam_hex,
        position_id: createdPositions[m.pos],
        is_active: true,
      },
      create: {
        username: m.username,
        password_hash: userPasswordHash,
        role: 'MEMBER',
        discord_name: m.discord_name,
        ooc_name: m.ooc_name,
        steam_hex: m.steam_hex,
        position_id: createdPositions[m.pos],
        is_active: true,
      },
    });
    createdUserIds.push(u.id);
  }

  console.log('✅ 10 Member accounts created (password: password123)');

  // 4. Create Initial System Settings with 2nd logo (TRANSPARENT_ASERP_BLACK_SQUARE.png)
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {
      company_name: 'ASE GROUP',
      system_name: 'ASE Duty Attendance System',
      logo: '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
      primary_color: '#DC2626',
      secondary_color: '#1E293B',
      accent_color: '#EF4444',
      theme_mode: 'BRANDED',
    },
    create: {
      id: 'default',
      company_name: 'ASE GROUP',
      system_name: 'ASE Duty Attendance System',
      logo: '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
      primary_color: '#DC2626',
      secondary_color: '#1E293B',
      accent_color: '#EF4444',
      theme_mode: 'BRANDED',
    },
  });

  console.log('✅ System Settings initialized with 2nd logo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
