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

function sqlStr(value: string | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

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
      userReports,
      userSessions,
    ] = await Promise.all([
      prisma.systemSettings.findMany(),
      prisma.position.findMany(),
      prisma.user.findMany({ include: { position: true } }),
      prisma.attendance.findMany({ include: { user: { include: { position: true } } } }),
      prisma.leaveRequest.findMany({ include: { user: { include: { position: true } } } }),
      prisma.auditLog.findMany({ include: { admin: true } }),
      prisma.userReport.findMany({ include: { user: { include: { position: true } } } }),
      prisma.userSession.findMany({ include: { user: true } }),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      formatted_date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      database_source: 'Turso / Local SQLite DB',
      stats: {
        total_settings: systemSettings.length,
        total_positions: positions.length,
        total_users: users.length,
        total_attendances: attendances.length,
        total_leave_requests: leaveRequests.length,
        total_audit_logs: auditLogs.length,
        total_reports: userReports.length,
        total_sessions: userSessions.length,
      },
      data: {
        systemSettings,
        positions,
        users,
        attendances,
        leaveRequests,
        auditLogs,
        userReports,
        userSessions,
      },
    };

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(backupDir, `db_backup_${timestampStr}.json`);
    const latestJsonPath = path.join(backupDir, `latest_db_backup.json`);

    fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf-8');
    fs.writeFileSync(latestJsonPath, JSON.stringify(backupData, null, 2), 'utf-8');

    // Also backup local dev.db file if exists
    const localDevDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(localDevDbPath)) {
      fs.copyFileSync(localDevDbPath, path.join(backupDir, `dev_db_backup_${timestampStr}.sqlite`));
      fs.copyFileSync(localDevDbPath, path.join(backupDir, `latest_dev.db`));
      console.log('📦 File dev.db lokal juga berhasil dicopy ke folder backups.');
    }

    // Generate SQL Insert Dump
    let sqlDump = `-- DATABASE BACKUP DUMP\n`;
    sqlDump += `-- Backup Date: ${new Date().toISOString()}\n\n`;

    // SystemSettings SQL
    systemSettings.forEach((s) => {
      const bg1 = sqlStr(s.login_background || '');
      const bg2 = sqlStr(s.dashboard_background || '');
      sqlDump += `INSERT OR REPLACE INTO "SystemSettings" ("id", "company_name", "system_name", "logo", "favicon", "login_background", "dashboard_background", "primary_color", "secondary_color", "accent_color", "theme_mode", "require_duty_in_screenshot", "require_duty_out_screenshot", "max_upload_size_mb", "timezone", "system_active", "updated_at") VALUES (${sqlStr(s.id)}, ${sqlStr(s.company_name)}, ${sqlStr(s.system_name)}, ${sqlStr(s.logo)}, ${sqlStr(s.favicon)}, ${bg1}, ${bg2}, ${sqlStr(s.primary_color)}, ${sqlStr(s.secondary_color)}, ${sqlStr(s.accent_color)}, ${sqlStr(s.theme_mode)}, ${s.require_duty_in_screenshot ? 1 : 0}, ${s.require_duty_out_screenshot ? 1 : 0}, ${Number(s.max_upload_size_mb) || 10}, ${sqlStr(s.timezone)}, ${s.system_active ? 1 : 0}, ${sqlStr(s.updated_at.toISOString())});\n`;
    });

    // Positions SQL
    positions.forEach((p) => {
      sqlDump += `INSERT OR REPLACE INTO "Position" ("id", "name", "description", "is_active", "created_at", "updated_at") VALUES (${sqlStr(p.id)}, ${sqlStr(p.name)}, ${sqlStr(p.description)}, ${p.is_active ? 1 : 0}, ${sqlStr(p.created_at.toISOString())}, ${sqlStr(p.updated_at.toISOString())});\n`;
    });

    // Users SQL
    users.forEach((u) => {
      const lastLogin = u.last_login_at ? sqlStr(u.last_login_at.toISOString()) : 'NULL';
      const sessionVersion = Number((u as any).session_version ?? 1);
      sqlDump += `INSERT OR REPLACE INTO "User" ("id", "username", "password_hash", "discord_name", "position_id", "ooc_name", "steam_hex", "avatar", "role", "session_version", "is_active", "last_login_at", "created_at", "updated_at") VALUES (${sqlStr(u.id)}, ${sqlStr(u.username)}, ${sqlStr(u.password_hash)}, ${sqlStr(u.discord_name)}, ${sqlStr(u.position_id)}, ${sqlStr(u.ooc_name)}, ${sqlStr(u.steam_hex)}, ${sqlStr(u.avatar)}, ${sqlStr(u.role)}, ${sessionVersion}, ${u.is_active ? 1 : 0}, ${lastLogin}, ${sqlStr(u.created_at.toISOString())}, ${sqlStr(u.updated_at.toISOString())});\n`;
    });

    // Attendances SQL (Fixed 15 columns = 15 values including deleted_at)
    attendances.forEach((a) => {
      const outTime = a.duty_out_time ? sqlStr(a.duty_out_time.toISOString()) : 'NULL';
      const dur = a.duration_minutes !== null && a.duration_minutes !== undefined ? Number(a.duration_minutes) : 'NULL';
      const outSs = sqlStr(a.duty_out_screenshot);
      const uNote = sqlStr(a.user_note);
      const aNote = sqlStr(a.admin_note);
      const revBy = sqlStr(a.reviewed_by);
      const revAt = a.reviewed_at ? sqlStr(a.reviewed_at.toISOString()) : 'NULL';
      const delAt = a.deleted_at ? sqlStr(a.deleted_at.toISOString()) : 'NULL';

      sqlDump += `INSERT OR REPLACE INTO "Attendance" ("id", "user_id", "duty_in_time", "duty_out_time", "duration_minutes", "duty_in_screenshot", "duty_out_screenshot", "status", "user_note", "admin_note", "reviewed_by", "reviewed_at", "created_at", "updated_at", "deleted_at") VALUES (${sqlStr(a.id)}, ${sqlStr(a.user_id)}, ${sqlStr(a.duty_in_time.toISOString())}, ${outTime}, ${dur}, ${sqlStr(a.duty_in_screenshot)}, ${outSs}, ${sqlStr(a.status)}, ${uNote}, ${aNote}, ${revBy}, ${revAt}, ${sqlStr(a.created_at.toISOString())}, ${sqlStr(a.updated_at.toISOString())}, ${delAt});\n`;
    });

    // LeaveRequests SQL
    leaveRequests.forEach((l) => {
      const att = sqlStr(l.attachment);
      const aNote = sqlStr(l.admin_note);
      const appBy = sqlStr(l.approved_by);
      const appAt = l.approved_at ? sqlStr(l.approved_at.toISOString()) : 'NULL';

      sqlDump += `INSERT OR REPLACE INTO "LeaveRequest" ("id", "user_id", "leave_type", "start_date", "end_date", "reason", "attachment", "status", "admin_note", "approved_by", "approved_at", "created_at", "updated_at") VALUES (${sqlStr(l.id)}, ${sqlStr(l.user_id)}, ${sqlStr(l.leave_type)}, ${sqlStr(l.start_date.toISOString())}, ${sqlStr(l.end_date.toISOString())}, ${sqlStr(l.reason)}, ${att}, ${sqlStr(l.status)}, ${aNote}, ${appBy}, ${appAt}, ${sqlStr(l.created_at.toISOString())}, ${sqlStr(l.updated_at.toISOString())});\n`;
    });

    // AuditLogs SQL
    auditLogs.forEach((log) => {
      const oldD = sqlStr(log.old_data);
      const newD = sqlStr(log.new_data);
      const ip = sqlStr(log.ip_address);
      const ua = sqlStr(log.user_agent);

      sqlDump += `INSERT OR REPLACE INTO "AuditLog" ("id", "admin_id", "action", "table_name", "record_id", "old_data", "new_data", "ip_address", "user_agent", "created_at") VALUES (${sqlStr(log.id)}, ${sqlStr(log.admin_id)}, ${sqlStr(log.action)}, ${sqlStr(log.table_name)}, ${sqlStr(log.record_id)}, ${oldD}, ${newD}, ${ip}, ${ua}, ${sqlStr(log.created_at.toISOString())});\n`;
    });

    // UserReports SQL
    userReports.forEach((r) => {
      const scr = sqlStr(r.screenshots || '[]');
      const aNote = sqlStr(r.admin_note);
      const revBy = sqlStr(r.reviewed_by);
      const revAt = r.reviewed_at ? sqlStr(r.reviewed_at.toISOString()) : 'NULL';
      sqlDump += `INSERT OR REPLACE INTO "UserReport" ("id", "user_id", "title", "category", "content", "screenshots", "status", "admin_note", "reviewed_by", "reviewed_at", "created_at", "updated_at") VALUES (${sqlStr(r.id)}, ${sqlStr(r.user_id)}, ${sqlStr(r.title)}, ${sqlStr(r.category)}, ${sqlStr(r.content)}, ${scr}, ${sqlStr(r.status)}, ${aNote}, ${revBy}, ${revAt}, ${sqlStr(r.created_at.toISOString())}, ${sqlStr(r.updated_at.toISOString())});\n`;
    });

    // UserSessions SQL
    userSessions.forEach((s) => {
      const ip = sqlStr(s.ip_address);
      const dt = sqlStr(s.device_type);
      const bn = sqlStr(s.browser_name);
      const os = sqlStr(s.os_name);
      const ua = sqlStr(s.user_agent);
      sqlDump += `INSERT OR REPLACE INTO "UserSession" ("id", "user_id", "token_id", "ip_address", "device_type", "browser_name", "os_name", "user_agent", "last_active", "is_active", "created_at") VALUES (${sqlStr(s.id)}, ${sqlStr(s.user_id)}, ${sqlStr(s.token_id)}, ${ip}, ${dt}, ${bn}, ${os}, ${ua}, ${sqlStr(s.last_active.toISOString())}, ${s.is_active ? 1 : 0}, ${sqlStr(s.created_at.toISOString())});\n`;
    });

    const sqlPath = path.join(backupDir, `db_backup_${timestampStr}.sql`);
    const latestSqlPath = path.join(backupDir, `latest_db_backup.sql`);

    fs.writeFileSync(sqlPath, sqlDump, 'utf-8');
    fs.writeFileSync(latestSqlPath, sqlDump, 'utf-8');

    // Also backup public/uploads if exists
    const uploadsSource = path.join(process.cwd(), 'public', 'uploads');
    const uploadsBackupDir = path.join(backupDir, 'uploads');
    if (fs.existsSync(uploadsSource)) {
      if (!fs.existsSync(uploadsBackupDir)) {
        fs.mkdirSync(uploadsBackupDir, { recursive: true });
      }
      const files = fs.readdirSync(uploadsSource);
      for (const file of files) {
        fs.copyFileSync(path.join(uploadsSource, file), path.join(uploadsBackupDir, file));
      }
      console.log(`🖼️ Sebanyak ${files.length} file di public/uploads berhasil disalin ke backups/uploads.`);
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log('✅ BACKUP DATABASE HARIAN BERHASIL EXECUTED!');
    console.log('====================================================');
    console.log(`⏱️ Waktu Eksekusi: ${durationSec} detik`);
    console.log(`📂 Folder Lokasi Backup: ${backupDir}`);
    console.log(`📄 File JSON Backup : ${jsonPath}`);
    console.log(`📄 File SQL Backup  : ${sqlPath}`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Gagal melakukan backup database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
