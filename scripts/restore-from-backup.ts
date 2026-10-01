import * as path from 'path';
import * as fs from 'fs';

// Read .env file natively
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIdx = trimmed.indexOf('=');
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { prisma } from '../src/lib/db';

async function restoreDatabase() {
  const targetFile = process.argv[2] || path.join(process.cwd(), 'backups', 'latest_db_backup.json');

  console.log('🔄 Memulai Restore Database dari file backup...');
  console.log(`📄 Target File Backup: ${targetFile}`);

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ File backup tidak ditemukan di: ${targetFile}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(targetFile, 'utf-8');
  const backup = JSON.parse(raw);
  const data = backup.data;

  if (!data) {
    console.error('❌ Format data backup tidak valid (properti "data" tidak ditemukan).');
    process.exit(1);
  }

  const targetDb = process.env.TURSO_DATABASE_URL ? 'Turso Cloud (Live)' : 'Local SQLite (dev.db)';
  console.log(`🎯 Target Database: ${targetDb}`);
  console.log(`📅 Tanggal Backup Asal: ${backup.formatted_date || backup.timestamp}`);

  const startTime = Date.now();

  try {
    // 1. Restore SystemSettings
    if (data.systemSettings && data.systemSettings.length > 0) {
      console.log(`⏳ Memulihkan SystemSettings (${data.systemSettings.length} record)...`);
      for (const s of data.systemSettings) {
        await prisma.systemSettings.upsert({
          where: { id: s.id },
          update: { ...s, updated_at: new Date(s.updated_at) },
          create: { ...s, updated_at: new Date(s.updated_at) },
        });
      }
    }

    // 2. Restore Positions
    if (data.positions && data.positions.length > 0) {
      console.log(`⏳ Memulihkan Positions (${data.positions.length} record)...`);
      for (const p of data.positions) {
        await prisma.position.upsert({
          where: { id: p.id },
          update: {
            name: p.name,
            description: p.description,
            is_active: p.is_active,
            updated_at: new Date(p.updated_at),
          },
          create: {
            id: p.id,
            name: p.name,
            description: p.description,
            is_active: p.is_active,
            created_at: new Date(p.created_at),
            updated_at: new Date(p.updated_at),
          },
        });
      }
    }

    // 3. Restore Users
    if (data.users && data.users.length > 0) {
      console.log(`⏳ Memulihkan Users (${data.users.length} akun)...`);
      for (const u of data.users) {
        const { position, attendances, leave_requests, reports, audit_logs, user_sessions, ...userData } = u;
        await prisma.user.upsert({
          where: { id: u.id },
          update: {
            ...userData,
            last_login_at: userData.last_login_at ? new Date(userData.last_login_at) : null,
            updated_at: new Date(userData.updated_at),
          },
          create: {
            ...userData,
            last_login_at: userData.last_login_at ? new Date(userData.last_login_at) : null,
            created_at: new Date(userData.created_at),
            updated_at: new Date(userData.updated_at),
          },
        });
      }
    }

    // 4. Restore Attendances
    if (data.attendances && data.attendances.length > 0) {
      console.log(`⏳ Memulihkan Attendances (${data.attendances.length} sesi)...`);
      for (const a of data.attendances) {
        const { user, ...attData } = a;
        await prisma.attendance.upsert({
          where: { id: a.id },
          update: {
            ...attData,
            duty_in_time: new Date(attData.duty_in_time),
            duty_out_time: attData.duty_out_time ? new Date(attData.duty_out_time) : null,
            reviewed_at: attData.reviewed_at ? new Date(attData.reviewed_at) : null,
            deleted_at: attData.deleted_at ? new Date(attData.deleted_at) : null,
            updated_at: new Date(attData.updated_at),
          },
          create: {
            ...attData,
            duty_in_time: new Date(attData.duty_in_time),
            duty_out_time: attData.duty_out_time ? new Date(attData.duty_out_time) : null,
            reviewed_at: attData.reviewed_at ? new Date(attData.reviewed_at) : null,
            deleted_at: attData.deleted_at ? new Date(attData.deleted_at) : null,
            created_at: new Date(attData.created_at),
            updated_at: new Date(attData.updated_at),
          },
        });
      }
    }

    // 5. Restore LeaveRequests
    if (data.leaveRequests && data.leaveRequests.length > 0) {
      console.log(`⏳ Memulihkan LeaveRequests (${data.leaveRequests.length} pengajuan)...`);
      for (const l of data.leaveRequests) {
        const { user, ...leaveData } = l;
        await prisma.leaveRequest.upsert({
          where: { id: l.id },
          update: {
            ...leaveData,
            start_date: new Date(leaveData.start_date),
            end_date: new Date(leaveData.end_date),
            approved_at: leaveData.approved_at ? new Date(leaveData.approved_at) : null,
            updated_at: new Date(leaveData.updated_at),
          },
          create: {
            ...leaveData,
            start_date: new Date(leaveData.start_date),
            end_date: new Date(leaveData.end_date),
            approved_at: leaveData.approved_at ? new Date(leaveData.approved_at) : null,
            created_at: new Date(leaveData.created_at),
            updated_at: new Date(leaveData.updated_at),
          },
        });
      }
    }

    // 6. Restore UserReports
    if (data.userReports && data.userReports.length > 0) {
      console.log(`⏳ Memulihkan UserReports (${data.userReports.length} laporan)...`);
      for (const r of data.userReports) {
        const { user, ...repData } = r;
        await prisma.userReport.upsert({
          where: { id: r.id },
          update: {
            ...repData,
            reviewed_at: repData.reviewed_at ? new Date(repData.reviewed_at) : null,
            updated_at: new Date(repData.updated_at),
          },
          create: {
            ...repData,
            reviewed_at: repData.reviewed_at ? new Date(repData.reviewed_at) : null,
            created_at: new Date(repData.created_at),
            updated_at: new Date(repData.updated_at),
          },
        });
      }
    }

    // 7. Restore UserSessions
    if (data.userSessions && data.userSessions.length > 0) {
      console.log(`⏳ Memulihkan UserSessions (${data.userSessions.length} sesi)...`);
      for (const s of data.userSessions) {
        const { user, ...sessData } = s;
        await prisma.userSession.upsert({
          where: { id: s.id },
          update: {
            ...sessData,
            last_active: new Date(sessData.last_active),
          },
          create: {
            ...sessData,
            last_active: new Date(sessData.last_active),
            created_at: new Date(sessData.created_at),
          },
        });
      }
    }

    // 8. Restore AuditLogs
    if (data.auditLogs && data.auditLogs.length > 0) {
      console.log(`⏳ Memulihkan AuditLogs (${data.auditLogs.length} rekam jejak)...`);
      for (const log of data.auditLogs) {
        const { admin, ...logData } = log;
        await prisma.auditLog.upsert({
          where: { id: log.id },
          update: logData,
          create: {
            ...logData,
            created_at: new Date(logData.created_at),
          },
        });
      }
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log('✅ RESTORE DATABASE BERHASIL SELESAI 100%!');
    console.log('====================================================');
    console.log(`⏱️ Waktu Eksekusi: ${durationSec} detik`);
    console.log(`🎯 Target DB: ${targetDb}`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Gagal melakukan restore database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
