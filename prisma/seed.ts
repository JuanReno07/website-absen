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
  const adminPasswordHash = await bcrypt.hash('Prokemas100', 10);
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

  console.log('✅ Admin account ready (admin / Prokemas100)');

  // 3. Create Initial System Settings with 2nd logo (TRANSPARENT_ASERP_BLACK_SQUARE.png)
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

  console.log('✅ System Settings initialized');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
