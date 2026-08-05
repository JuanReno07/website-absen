import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

async function restoreAndSecure() {
  console.log('🛡️ Memulai Pemulihan & Amankan Turso Cloud Database...');

  try {
    // 1. Restore System Settings to clean default state
    const backupFilePath = path.join(process.cwd(), 'backups', 'latest_turso_db_backup.json');
    if (fs.existsSync(backupFilePath)) {
      const backupContent = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
      const originalSettings = backupContent.data?.systemSettings?.[0];

      if (originalSettings) {
        console.log('🔄 Memulihkan System Settings ke kondisi bersih...');
        await prisma.systemSettings.upsert({
          where: { id: 'default' },
          update: {
            company_name: originalSettings.company_name || 'ASE GROUP',
            system_name: originalSettings.system_name || 'ASE Duty Attendance System',
            logo: originalSettings.logo || '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
            favicon: originalSettings.favicon || '/favicon.ico',
            login_background: originalSettings.login_background || '',
            dashboard_background: originalSettings.dashboard_background || '',
            primary_color: originalSettings.primary_color || '#DC2626',
            secondary_color: originalSettings.secondary_color || '#1E293B',
            accent_color: originalSettings.accent_color || '#EF4444',
            theme_mode: originalSettings.theme_mode || 'BRANDED',
            require_duty_in_screenshot: originalSettings.require_duty_in_screenshot ?? true,
            require_duty_out_screenshot: originalSettings.require_duty_out_screenshot ?? true,
            max_upload_size_mb: originalSettings.max_upload_size_mb || 10,
            timezone: originalSettings.timezone || 'Asia/Jakarta',
            system_active: originalSettings.system_active ?? true,
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
        console.log('✅ System Settings berhasil dipulihkan!');
      }
    }

    // 2. Reset Admin Password & Ensure Admin Account is Active
    const newAdminPass = 'Prokemas100';
    const passHash = await bcrypt.hash(newAdminPass, 10);

    const adminUser = await prisma.user.upsert({
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

    console.log(`✅ Password Admin "${adminUser.username}" berhasil diperbarui & diamankan!`);

    // 3. Log Audit Trail for Security Recovery
    await prisma.auditLog.create({
      data: {
        admin_id: adminUser.id,
        action: 'SECURITY_RECOVERY_RESTORE',
        table_name: 'system_settings',
        record_id: 'default',
        new_data: JSON.stringify({ message: 'Cloud database restored and security hardened.' }),
      },
    });

    console.log('🛡️ Turso Cloud DB 100% Bersih, Aman, dan Dipulihkan!');
  } catch (error) {
    console.error('❌ Gagal mengamankan database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAndSecure();
