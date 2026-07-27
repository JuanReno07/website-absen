import { prisma } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

async function backupDatabase() {
  console.log('🔄 Memulai Backup Database Turso Cloud ke Local PC...');
  const startTime = Date.now();

  try {
    const [
      systemSettings,
      positions,
      users,
      attendances,
      leaveRequests,
      auditLogs,
    ] = await Promise.all([
      prisma.systemSettings.findMany(),
      prisma.position.findMany(),
      prisma.user.findMany({ include: { position: true } }),
      prisma.attendance.findMany({ include: { user: { include: { position: true } } } }),
      prisma.leaveRequest.findMany({ include: { user: { include: { position: true } } } }),
      prisma.auditLog.findMany({ include: { admin: true } }),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      formatted_date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      database_source: process.env.DATABASE_URL || 'Turso Cloud DB',
      stats: {
        total_settings: systemSettings.length,
        total_positions: positions.length,
        total_users: users.length,
        total_attendances: attendances.length,
        total_leave_requests: leaveRequests.length,
        total_audit_logs: auditLogs.length,
      },
      data: {
        systemSettings,
        positions,
        users,
        attendances,
        leaveRequests,
        auditLogs,
      },
    };

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(backupDir, `turso_db_backup_${timestampStr}.json`);
    const latestJsonPath = path.join(backupDir, `latest_turso_db_backup.json`);

    fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf-8');
    fs.writeFileSync(latestJsonPath, JSON.stringify(backupData, null, 2), 'utf-8');

    // Generate SQL Insert Dump
    let sqlDump = `-- TURSO CLOUD DATABASE BACKUP DUMP\n`;
    sqlDump += `-- Backup Date: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database Source: ${process.env.DATABASE_URL}\n\n`;

    // SystemSettings SQL
    systemSettings.forEach((s) => {
      const bg1 = s.login_background ? `'${s.login_background.replace(/'/g, "''")}'` : "''";
      const bg2 = s.dashboard_background ? `'${s.dashboard_background.replace(/'/g, "''")}'` : "''";
      sqlDump += `INSERT OR REPLACE INTO "SystemSettings" ("id", "company_name", "system_name", "logo", "favicon", "login_background", "dashboard_background", "primary_color", "secondary_color", "accent_color", "theme_mode", "require_duty_in_screenshot", "require_duty_out_screenshot", "max_upload_size_mb", "timezone", "system_active", "updated_at") VALUES ('${s.id}', '${s.company_name.replace(/'/g, "''")}', '${s.system_name.replace(/'/g, "''")}', '${s.logo.replace(/'/g, "''")}', '${s.favicon.replace(/'/g, "''")}', ${bg1}, ${bg2}, '${s.primary_color}', '${s.secondary_color}', '${s.accent_color}', '${s.theme_mode}', ${s.require_duty_in_screenshot ? 1 : 0}, ${s.require_duty_out_screenshot ? 1 : 0}, ${s.max_upload_size_mb}, '${s.timezone}', ${s.system_active ? 1 : 0}, '${s.updated_at.toISOString()}');\n`;
    });

    // Positions SQL
    positions.forEach((p) => {
      const desc = p.description ? `'${p.description.replace(/'/g, "''")}'` : 'NULL';
      sqlDump += `INSERT OR REPLACE INTO "Position" ("id", "name", "description", "is_active", "created_at", "updated_at") VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', ${desc}, ${p.is_active ? 1 : 0}, '${p.created_at.toISOString()}', '${p.updated_at.toISOString()}');\n`;
    });

    // Users SQL
    users.forEach((u) => {
      const avatar = u.avatar ? `'${u.avatar.replace(/'/g, "''")}'` : 'NULL';
      const lastLogin = u.last_login_at ? `'${u.last_login_at.toISOString()}'` : 'NULL';
      sqlDump += `INSERT OR REPLACE INTO "User" ("id", "username", "password_hash", "discord_name", "position_id", "ooc_name", "steam_hex", "avatar", "role", "is_active", "last_login_at", "created_at", "updated_at") VALUES ('${u.id}', '${u.username.replace(/'/g, "''")}', '${u.password_hash}', '${u.discord_name.replace(/'/g, "''")}', '${u.position_id}', '${u.ooc_name.replace(/'/g, "''")}', '${u.steam_hex}', ${avatar}, '${u.role}', ${u.is_active ? 1 : 0}, ${lastLogin}, '${u.created_at.toISOString()}', '${u.updated_at.toISOString()}');\n`;
    });

    // Attendances SQL
    attendances.forEach((a) => {
      const outTime = a.duty_out_time ? `'${a.duty_out_time.toISOString()}'` : 'NULL';
      const dur = a.duration_minutes !== null ? a.duration_minutes : 'NULL';
      const outSs = a.duty_out_screenshot ? `'${a.duty_out_screenshot.replace(/'/g, "''")}'` : 'NULL';
      const uNote = a.user_note ? `'${a.user_note.replace(/'/g, "''")}'` : 'NULL';
      const aNote = a.admin_note ? `'${a.admin_note.replace(/'/g, "''")}'` : 'NULL';
      const revBy = a.reviewed_by ? `'${a.reviewed_by}'` : 'NULL';
      const revAt = a.reviewed_at ? `'${a.reviewed_at.toISOString()}'` : 'NULL';
      const delAt = a.deleted_at ? `'${a.deleted_at.toISOString()}'` : 'NULL';

      sqlDump += `INSERT OR REPLACE INTO "Attendance" ("id", "user_id", "duty_in_time", "duty_out_time", "duration_minutes", "duty_in_screenshot", "duty_out_screenshot", "status", "user_note", "admin_note", "reviewed_by", "reviewed_at", "created_at", "updated_at", "deleted_at") VALUES ('${a.id}', '${a.user_id}', '${a.duty_in_time.toISOString()}', ${outTime}, ${dur}, '${a.duty_in_screenshot.replace(/'/g, "''")}', ${outSs}, '${a.status}', ${uNote}, ${aNote}, ${revBy}, ${revAt}, '${a.created_at.toISOString()}', '${a.updated_at.toISOString()}', ${delAt});\n`;
    });

    // LeaveRequests SQL
    leaveRequests.forEach((l) => {
      const att = l.attachment ? `'${l.attachment.replace(/'/g, "''")}'` : 'NULL';
      const aNote = l.admin_note ? `'${l.admin_note.replace(/'/g, "''")}'` : 'NULL';
      const appBy = l.approved_by ? `'${l.approved_by}'` : 'NULL';
      const appAt = l.approved_at ? `'${l.approved_at.toISOString()}'` : 'NULL';

      sqlDump += `INSERT OR REPLACE INTO "LeaveRequest" ("id", "user_id", "leave_type", "start_date", "end_date", "reason", "attachment", "status", "admin_note", "approved_by", "approved_at", "created_at", "updated_at") VALUES ('${l.id}', '${l.user_id}', '${l.leave_type}', '${l.start_date.toISOString()}', '${l.end_date.toISOString()}', '${l.reason.replace(/'/g, "''")}', ${att}, '${l.status}', ${aNote}, ${appBy}, ${appAt}, '${l.created_at.toISOString()}', '${l.updated_at.toISOString()}');\n`;
    });

    // AuditLogs SQL
    auditLogs.forEach((log) => {
      const oldD = log.old_data ? `'${log.old_data.replace(/'/g, "''")}'` : 'NULL';
      const newD = log.new_data ? `'${log.new_data.replace(/'/g, "''")}'` : 'NULL';
      const ip = log.ip_address ? `'${log.ip_address}'` : 'NULL';
      const ua = log.user_agent ? `'${log.user_agent.replace(/'/g, "''")}'` : 'NULL';

      sqlDump += `INSERT OR REPLACE INTO "AuditLog" ("id", "admin_id", "action", "table_name", "record_id", "old_data", "new_data", "ip_address", "user_agent", "created_at") VALUES ('${log.id}', '${log.admin_id}', '${log.action}', '${log.table_name}', '${log.record_id}', ${oldD}, ${newD}, ${ip}, ${ua}, '${log.created_at.toISOString()}');\n`;
    });

    const sqlPath = path.join(backupDir, `turso_db_backup_${timestampStr}.sql`);
    const latestSqlPath = path.join(backupDir, `latest_turso_db_backup.sql`);

    fs.writeFileSync(sqlPath, sqlDump, 'utf-8');
    fs.writeFileSync(latestSqlPath, sqlDump, 'utf-8');

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log('✅ BACKUP DATABASE HARIAN BERHASIL EXECUTED!');
    console.log('====================================================');
    console.log(`⏱️ Waktu Eksekusi: ${durationSec} detik`);
    console.log(`📂 Folder Lokasi Backup: ${backupDir}`);
    console.log(`📄 File JSON Backup : ${jsonPath}`);
    console.log(`📄 File SQL Backup  : ${sqlPath}`);
    console.log(`----------------------------------------------------`);
    console.log(`📊 RINGKASAN DATA TER-BACKUP:`);
    console.log(`   • System Settings : ${systemSettings.length} konfigurasi`);
    console.log(`   • Positions/Jabatan: ${positions.length} data`);
    console.log(`   • Users/Anggota   : ${users.length} akun`);
    console.log(`   • Attendances/Absen: ${attendances.length} sesi`);
    console.log(`   • Leave Requests   : ${leaveRequests.length} pengajuan`);
    console.log(`   • Audit Logs       : ${auditLogs.length} rekam jejak`);
    console.log('====================================================');

  } catch (error) {
    console.error('❌ Gagal melakukan backup database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
