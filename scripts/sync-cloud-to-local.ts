import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

// 1. Read .env natively
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

async function syncCloudToLocal() {
  console.log('====================================================');
  console.log('🔄 SINKRONISASI DATABASE: CLOUD (TURSO) -> LOKAL (PC)');
  console.log('🔒 KEAMANAN: Database Cloud 100% READ-ONLY (Tanpa Perubahan)');
  console.log('====================================================');

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoAuthToken) {
    console.error('❌ Error: TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan di .env');
    process.exit(1);
  }

  const url = tursoUrl.startsWith('libsql://')
    ? tursoUrl.replace('libsql://', 'https://')
    : tursoUrl;

  // Cloud Client (READ ONLY)
  const libsql = createClient({ url, authToken: tursoAuthToken });
  const cloudAdapter = new PrismaLibSQL(libsql);
  const cloudPrisma = new PrismaClient({ adapter: cloudAdapter } as any);

  // Local Client (SQLite file:./prisma/dev.db)
  const localDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  console.log(`📂 Database Lokal Target: ${localDbPath}`);

  // Backup file dev.db lokal sebelum diubah
  if (fs.existsSync(localDbPath)) {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const localBackupFile = path.join(backupDir, `dev_db_before_cloud_sync_${Date.now()}.sqlite`);
    fs.copyFileSync(localDbPath, localBackupFile);
    console.log(`🛡️ Backup keamanan dev.db lokal tersimpan di: ${localBackupFile}`);
  }

  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${localDbPath}`,
      },
    },
  });

  const startTime = Date.now();

  try {
    console.log('\n📥 1. Mengambil data terbaru dari Cloud (Read-Only)...');
    const [
      systemSettings,
      positions,
      users,
      attendances,
      leaveRequests,
      userReports,
      userSessions,
      auditLogs,
    ] = await Promise.all([
      cloudPrisma.systemSettings.findMany(),
      cloudPrisma.position.findMany(),
      cloudPrisma.user.findMany(),
      cloudPrisma.attendance.findMany(),
      cloudPrisma.leaveRequest.findMany(),
      cloudPrisma.userReport.findMany(),
      cloudPrisma.userSession.findMany(),
      cloudPrisma.auditLog.findMany(),
    ]);

    console.log(`   ✓ System Settings : ${systemSettings.length}`);
    console.log(`   ✓ Positions       : ${positions.length}`);
    console.log(`   ✓ Users           : ${users.length}`);
    console.log(`   ✓ Attendances     : ${attendances.length}`);
    console.log(`   ✓ Leave Requests  : ${leaveRequests.length}`);
    console.log(`   ✓ User Reports    : ${userReports.length}`);
    console.log(`   ✓ User Sessions   : ${userSessions.length}`);
    console.log(`   ✓ Audit Logs      : ${auditLogs.length}`);

    console.log('\n🧹 2. Membersihkan tabel lokal lama agar persis sama dengan Cloud...');
    await localPrisma.auditLog.deleteMany({});
    await localPrisma.userSession.deleteMany({});
    await localPrisma.userReport.deleteMany({});
    await localPrisma.leaveRequest.deleteMany({});
    await localPrisma.attendance.deleteMany({});
    await localPrisma.user.deleteMany({});
    await localPrisma.position.deleteMany({});
    await localPrisma.systemSettings.deleteMany({});
    console.log('   ✓ Tabel lokal berhasil dibersihkan.');

    console.log('\n💾 3. Memasukkan data Cloud ke database lokal (dev.db)...');

    // 1. SystemSettings
    for (const s of systemSettings) {
      await localPrisma.systemSettings.create({
        data: {
          ...s,
          updated_at: new Date(s.updated_at),
        },
      });
    }
    console.log('   ✓ SystemSettings selesai.');

    // 2. Positions
    for (const p of positions) {
      await localPrisma.position.create({
        data: {
          id: p.id,
          name: p.name,
          description: p.description,
          is_active: p.is_active,
          created_at: new Date(p.created_at),
          updated_at: new Date(p.updated_at),
        },
      });
    }
    console.log('   ✓ Positions selesai.');

    // 3. Users
    for (const u of users) {
      await localPrisma.user.create({
        data: {
          id: u.id,
          username: u.username,
          password_hash: u.password_hash,
          discord_name: u.discord_name,
          position_id: u.position_id,
          ooc_name: u.ooc_name,
          steam_hex: u.steam_hex,
          avatar: u.avatar,
          role: u.role,
          session_version: (u as any).session_version ?? 1,
          is_active: u.is_active,
          last_login_at: u.last_login_at ? new Date(u.last_login_at) : null,
          created_at: new Date(u.created_at),
          updated_at: new Date(u.updated_at),
        },
      });
    }
    console.log('   ✓ Users selesai.');

    // 4. Attendances
    for (const a of attendances) {
      await localPrisma.attendance.create({
        data: {
          id: a.id,
          user_id: a.user_id,
          duty_in_time: new Date(a.duty_in_time),
          duty_out_time: a.duty_out_time ? new Date(a.duty_out_time) : null,
          duration_minutes: a.duration_minutes,
          duty_in_screenshot: a.duty_in_screenshot,
          duty_out_screenshot: a.duty_out_screenshot,
          status: a.status,
          user_note: a.user_note,
          admin_note: a.admin_note,
          reviewed_by: a.reviewed_by,
          reviewed_at: a.reviewed_at ? new Date(a.reviewed_at) : null,
          created_at: new Date(a.created_at),
          updated_at: new Date(a.updated_at),
          deleted_at: a.deleted_at ? new Date(a.deleted_at) : null,
        },
      });
    }
    console.log('   ✓ Attendances selesai.');

    // 5. LeaveRequests
    for (const l of leaveRequests) {
      await localPrisma.leaveRequest.create({
        data: {
          id: l.id,
          user_id: l.user_id,
          leave_type: l.leave_type,
          start_date: new Date(l.start_date),
          end_date: new Date(l.end_date),
          reason: l.reason,
          attachment: l.attachment,
          status: l.status,
          admin_note: l.admin_note,
          approved_by: l.approved_by,
          approved_at: l.approved_at ? new Date(l.approved_at) : null,
          created_at: new Date(l.created_at),
          updated_at: new Date(l.updated_at),
        },
      });
    }
    console.log('   ✓ LeaveRequests selesai.');

    // 6. UserReports
    for (const r of userReports) {
      await localPrisma.userReport.create({
        data: {
          id: r.id,
          user_id: r.user_id,
          title: r.title,
          category: r.category,
          content: r.content,
          screenshots: r.screenshots,
          status: r.status,
          admin_note: r.admin_note,
          reviewed_by: r.reviewed_by,
          reviewed_at: r.reviewed_at ? new Date(r.reviewed_at) : null,
          created_at: new Date(r.created_at),
          updated_at: new Date(r.updated_at),
        },
      });
    }
    console.log('   ✓ UserReports selesai.');

    // 7. UserSessions
    for (const s of userSessions) {
      await localPrisma.userSession.create({
        data: {
          id: s.id,
          user_id: s.user_id,
          token_id: s.token_id,
          ip_address: s.ip_address,
          device_type: s.device_type,
          browser_name: s.browser_name,
          os_name: s.os_name,
          user_agent: s.user_agent,
          last_active: new Date(s.last_active),
          is_active: s.is_active,
          created_at: new Date(s.created_at),
        },
      });
    }
    console.log('   ✓ UserSessions selesai.');

    // 8. AuditLogs
    for (const log of auditLogs) {
      await localPrisma.auditLog.create({
        data: {
          id: log.id,
          admin_id: log.admin_id,
          action: log.action,
          table_name: log.table_name,
          record_id: log.record_id,
          old_data: log.old_data,
          new_data: log.new_data,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: new Date(log.created_at),
        },
      });
    }
    console.log('   ✓ AuditLogs selesai.');

    // 4. Verifikasi Total Data Lokal vs Cloud
    console.log('\n📊 4. Verifikasi Perbandingan Data (Cloud vs Lokal):');
    const [
      localSettingsCount,
      localPosCount,
      localUserCount,
      localAttCount,
      localLeaveCount,
      localReportCount,
      localSessionCount,
      localAuditCount,
    ] = await Promise.all([
      localPrisma.systemSettings.count(),
      localPrisma.position.count(),
      localPrisma.user.count(),
      localPrisma.attendance.count(),
      localPrisma.leaveRequest.count(),
      localPrisma.userReport.count(),
      localPrisma.userSession.count(),
      localPrisma.auditLog.count(),
    ]);

    const checks = [
      { table: 'SystemSettings', cloud: systemSettings.length, local: localSettingsCount },
      { table: 'Position',       cloud: positions.length,      local: localPosCount },
      { table: 'User',           cloud: users.length,          local: localUserCount },
      { table: 'Attendance',     cloud: attendances.length,    local: localAttCount },
      { table: 'LeaveRequest',   cloud: leaveRequests.length,  local: localLeaveCount },
      { table: 'UserReport',     cloud: userReports.length,    local: localReportCount },
      { table: 'UserSession',    cloud: userSessions.length,   local: localSessionCount },
      { table: 'AuditLog',       cloud: auditLogs.length,      local: localAuditCount },
    ];

    console.table(checks);

    const allMatch = checks.every((c) => c.cloud === c.local);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('====================================================');
    if (allMatch) {
      console.log('✅ SINKRONISASI SUKSES 100%! DATA LOKAL PERSIS SAMA DENGAN CLOUD.');
    } else {
      console.log('⚠️ SINKRONISASI SELESAI DENGAN CATATAN (CEK TABEL DI ATAS).');
    }
    console.log(`⏱️ Waktu Eksekusi: ${duration} detik`);
    console.log('🔒 Production Cloud Status: AMAN & TIDAK TERSENTUH (Hanya Read-Only)');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Gagal melakukan sinkronisasi ke lokal:', error);
    process.exit(1);
  } finally {
    await cloudPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

syncCloudToLocal();
