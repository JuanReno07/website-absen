import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
  console.log('🔄 Memeriksa dan mereset password akun admin...');

  const pass = 'Prokemas100';
  const passHash = await bcrypt.hash(pass, 10);

  const updatedAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password_hash: passHash,
      is_active: true,
      role: 'ADMIN',
    },
    create: {
      username: 'admin',
      password_hash: passHash,
      discord_name: 'SuperAdmin#0001',
      ooc_name: 'Super Admin',
      steam_hex: '110000100000001',
      role: 'ADMIN',
      is_active: true,
      position: {
        connectOrCreate: {
          where: { name: 'President' },
          create: { name: 'President', description: 'Pimpinan Tertinggi Organization' },
        },
      },
    },
  });

  console.log('==============================================');
  console.log('✅ KREDENSIAL LOGIN ADMIN BERHASIL DIPERBARUI:');
  console.log('==============================================');
  console.log(`👤 Username : ${updatedAdmin.username}`);
  console.log(`🔑 Password : ${pass}`);
  console.log(`🛡️ Role     : ${updatedAdmin.role}`);
  console.log(`🟢 Is Active: ${updatedAdmin.is_active}`);
  console.log('==============================================');

  await prisma.$disconnect();
}

resetAdmin().catch((e) => {
  console.error('Reset Admin Error:', e);
  process.exit(1);
});
