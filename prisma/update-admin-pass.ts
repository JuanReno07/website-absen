import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdmin() {
  const hash = await bcrypt.hash('Prokemas100', 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password_hash: hash },
  });
  console.log('✅ Admin password updated to Prokemas100');
}

updateAdmin()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
