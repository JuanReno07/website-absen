import { prisma } from '../src/lib/db';

async function auditAndCleanUsers() {
  console.log('🚨 Memeriksa Akun Pengguna Terkini di Turso Cloud DB...');
  const users = await prisma.user.findMany({
    include: { position: true },
    orderBy: { created_at: 'desc' },
  });

  console.log(`Total accounts: ${users.length}`);
  for (const u of users) {
    console.log(`- Username: ${u.username} | Discord: ${u.discord_name} | Role: ${u.role} | Created: ${u.created_at.toISOString()} | ID: ${u.id}`);
  }

  await prisma.$disconnect();
}

auditAndCleanUsers();
