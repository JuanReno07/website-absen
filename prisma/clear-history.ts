import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearMembers() {
  console.log('🧹 Clearing dummy member data...');

  // Delete all attendance records
  await prisma.attendance.deleteMany({});
  
  // Delete all leave requests
  await prisma.leaveRequest.deleteMany({});
  
  // Delete all audit logs
  await prisma.auditLog.deleteMany({});

  // Delete all member accounts (except Superadmin account)
  const deletedMembers = await prisma.user.deleteMany({
    where: {
      role: 'MEMBER',
    },
  });

  console.log(`✅ Deleted ${deletedMembers.count} member accounts.`);
  console.log('👑 Admin account (admin / admin123) preserved for Admin management.');
  console.log('✨ All member data cleared successfully!');
}

clearMembers()
  .catch((e) => {
    console.error('Error clearing member data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
