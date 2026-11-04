import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdmin() {
  const newPass = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!newPass || newPass.length < 8) {
    throw new Error('Set environment variable ADMIN_DEFAULT_PASSWORD (minimal 8 karakter) sebelum menjalankan skrip ini.');
  }
  const hash = await bcrypt.hash(newPass, 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password_hash: hash },
  });
  console.log('✅ Admin password berhasil diperbarui.');
}

updateAdmin()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
