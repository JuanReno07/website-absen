import { prisma } from '../src/lib/db';

async function inspect() {
  console.log('🔍 Memeriksa Data Pengguna di Turso Cloud DB...');
  const users = await prisma.user.findMany({
    include: { position: true },
    orderBy: { created_at: 'desc' },
  });

  console.log(`Found ${users.length} users:`);
  users.forEach((u) => {
    console.log(`- ID: ${u.id} | User: ${u.username} | Discord: ${u.discord_name} | Role: ${u.role} | Active: ${u.is_active} | Created: ${u.created_at.toISOString()}`);
  });

  const auditLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { created_at: 'desc' },
  });
  console.log(`\nLatest 10 Audit Logs:`);
  auditLogs.forEach((l) => {
    console.log(`- ${l.created_at.toISOString()} | Action: ${l.action} | Table: ${l.table_name} | Record: ${l.record_id}`);
  });

  await prisma.$disconnect();
}

inspect();
