import { prisma } from '../src/lib/db';

async function deleteUnauthorizedUser() {
  console.log('🚨 Menghapus akun tidak dikenal "ASE - Berlin" (cmsgf1nuf0001xtccfx75w8yc)...');

  // Delete audit logs created by this user if any
  await prisma.auditLog.deleteMany({
    where: { admin_id: 'cmsgf1nuf0001xtccfx75w8yc' },
  });

  // Delete user
  const deleted = await prisma.user.delete({
    where: { id: 'cmsgf1nuf0001xtccfx75w8yc' },
  });

  console.log(`✅ Akun "${deleted.username}" (${deleted.discord_name}) BERHASIL DIHAPUS PERMANEN!`);

  // Log emergency audit trail
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (admin) {
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'SECURITY_PURGE_UNAUTHORIZED_ACCOUNT',
        table_name: 'users',
        record_id: 'cmsgf1nuf0001xtccfx75w8yc',
        old_data: JSON.stringify({ username: deleted.username, discord_name: deleted.discord_name, role: deleted.role }),
      },
    });
  }

  await prisma.$disconnect();
}

deleteUnauthorizedUser();
