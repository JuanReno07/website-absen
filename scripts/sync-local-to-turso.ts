import { createClient } from '@libsql/client';
import { PrismaClient } from '@prisma/client';
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

async function syncLocalToTurso() {
  console.log('🚀 Memulai Sinkronisasi Database Lokal (dev.db) ke Cloud (Turso DB)...');
  const startTime = Date.now();

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoAuthToken) {
    console.error('❌ Error: TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ada di file .env');
    process.exit(1);
  }

  const url = tursoUrl.startsWith('libsql://')
    ? tursoUrl.replace('libsql://', 'https://')
    : tursoUrl;

  const localDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  console.log(`📂 Connecting to local SQLite DB at: ${localDbPath}`);

  // 1. Local Prisma Client (baca file:./prisma/dev.db)
  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${localDbPath}`,
      },
    },
  });

  // 2. Client Turso Remote
  const tursoClient = createClient({
    url,
    authToken: tursoAuthToken,
  });

  try {
    console.log('📦 1. Membuat DDL / Skema Tabel Terbaru di Turso jika belum ada...');

    // DDL Statements untuk semua model termasuk UserReport
    const ddlStatements = [
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password_hash" TEXT NOT NULL,
        "discord_name" TEXT NOT NULL,
        "position_id" TEXT NOT NULL,
        "ooc_name" TEXT NOT NULL,
        "steam_hex" TEXT NOT NULL UNIQUE,
        "avatar" TEXT,
        "role" TEXT NOT NULL DEFAULT 'MEMBER',
        "is_active" INTEGER NOT NULL DEFAULT 1,
        "last_login_at" DATETIME,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL,
        FOREIGN KEY ("position_id") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "Position" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "is_active" INTEGER NOT NULL DEFAULT 1,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS "Attendance" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "duty_in_time" DATETIME NOT NULL,
        "duty_out_time" DATETIME,
        "duration_minutes" INTEGER,
        "duty_in_screenshot" TEXT NOT NULL,
        "duty_out_screenshot" TEXT,
        "status" TEXT NOT NULL DEFAULT 'SEDANG_DUTY',
        "user_note" TEXT,
        "admin_note" TEXT,
        "reviewed_by" TEXT,
        "reviewed_at" DATETIME,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL,
        "deleted_at" DATETIME,
        FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "LeaveRequest" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "leave_type" TEXT NOT NULL,
        "start_date" DATETIME NOT NULL,
        "end_date" DATETIME NOT NULL,
        "reason" TEXT NOT NULL,
        "attachment" TEXT,
        "status" TEXT NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN',
        "admin_note" TEXT,
        "approved_by" TEXT,
        "approved_at" DATETIME,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "SystemSettings" (
        "id" TEXT PRIMARY KEY DEFAULT 'default',
        "company_name" TEXT NOT NULL DEFAULT 'ASE GROUP',
        "system_name" TEXT NOT NULL DEFAULT 'ASE Duty Attendance System',
        "logo" TEXT NOT NULL DEFAULT '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
        "favicon" TEXT NOT NULL DEFAULT '/favicon.ico',
        "login_background" TEXT NOT NULL DEFAULT '',
        "dashboard_background" TEXT NOT NULL DEFAULT '',
        "primary_color" TEXT NOT NULL DEFAULT '#DC2626',
        "secondary_color" TEXT NOT NULL DEFAULT '#1E293B',
        "accent_color" TEXT NOT NULL DEFAULT '#EF4444',
        "theme_mode" TEXT NOT NULL DEFAULT 'BRANDED',
        "require_duty_in_screenshot" INTEGER NOT NULL DEFAULT 1,
        "require_duty_out_screenshot" INTEGER NOT NULL DEFAULT 1,
        "max_upload_size_mb" INTEGER NOT NULL DEFAULT 10,
        "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
        "system_active" INTEGER NOT NULL DEFAULT 1,
        "updated_at" DATETIME NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY,
        "admin_id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "table_name" TEXT NOT NULL,
        "record_id" TEXT NOT NULL,
        "old_data" TEXT,
        "new_data" TEXT,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("admin_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "UserReport" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'Laporan Kegiatan',
        "content" TEXT NOT NULL,
        "screenshots" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'MENUNGGU_DITANGGAPI',
        "admin_note" TEXT,
        "reviewed_by" TEXT,
        "reviewed_at" DATETIME,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "User_position_id_idx" ON "User"("position_id");`,
      `CREATE INDEX IF NOT EXISTS "User_steam_hex_idx" ON "User"("steam_hex");`,
      `CREATE INDEX IF NOT EXISTS "Attendance_user_id_idx" ON "Attendance"("user_id");`,
      `CREATE INDEX IF NOT EXISTS "Attendance_status_idx" ON "Attendance"("status");`,
      `CREATE INDEX IF NOT EXISTS "Attendance_duty_in_time_idx" ON "Attendance"("duty_in_time");`,
      `CREATE INDEX IF NOT EXISTS "LeaveRequest_user_id_idx" ON "LeaveRequest"("user_id");`,
      `CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_admin_id_idx" ON "AuditLog"("admin_id");`,
      `CREATE INDEX IF NOT EXISTS "UserReport_user_id_idx" ON "UserReport"("user_id");`,
      `CREATE INDEX IF NOT EXISTS "UserReport_status_idx" ON "UserReport"("status");`,
    ];

    for (const ddl of ddlStatements) {
      await tursoClient.execute(ddl);
    }
    console.log('✅ Skema tabel Turso telah berhasil disinkronkan.');

    console.log('📥 2. Membaca data dari SQLite Lokal (prisma/dev.db)...');
    const [
      positions,
      users,
      attendances,
      leaveRequests,
      systemSettings,
      auditLogs,
      reports,
    ] = await Promise.all([
      localPrisma.position.findMany(),
      localPrisma.user.findMany(),
      localPrisma.attendance.findMany(),
      localPrisma.leaveRequest.findMany(),
      localPrisma.systemSettings.findMany(),
      localPrisma.auditLog.findMany(),
      localPrisma.userReport.findMany(),
    ]);

    console.log(`📊 Total Data Lokal:
  - Positions      : ${positions.length}
  - Users          : ${users.length}
  - Attendances    : ${attendances.length}
  - Leave Requests : ${leaveRequests.length}
  - System Settings: ${systemSettings.length}
  - Audit Logs     : ${auditLogs.length}
  - User Reports   : ${reports.length}`);

    console.log('📤 3. Mengupload & Sinkronisasi data ke Turso Cloud DB...');
    await tursoClient.execute('PRAGMA foreign_keys = OFF;');

    // Clear existing data in Turso Cloud to ensure exact 1:1 match with local dev.db
    await tursoClient.execute('DELETE FROM "UserReport";');
    await tursoClient.execute('DELETE FROM "AuditLog";');
    await tursoClient.execute('DELETE FROM "LeaveRequest";');
    await tursoClient.execute('DELETE FROM "Attendance";');
    await tursoClient.execute('DELETE FROM "User";');
    await tursoClient.execute('DELETE FROM "Position";');
    await tursoClient.execute('DELETE FROM "SystemSettings";');
    for (const s of systemSettings) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO "SystemSettings" ("id", "company_name", "system_name", "logo", "favicon", "login_background", "dashboard_background", "primary_color", "secondary_color", "accent_color", "theme_mode", "require_duty_in_screenshot", "require_duty_out_screenshot", "max_upload_size_mb", "timezone", "system_active", "updated_at")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          s.id,
          s.company_name,
          s.system_name,
          s.logo,
          s.favicon,
          s.login_background,
          s.dashboard_background,
          s.primary_color,
          s.secondary_color,
          s.accent_color,
          s.theme_mode,
          s.require_duty_in_screenshot ? 1 : 0,
          s.require_duty_out_screenshot ? 1 : 0,
          s.max_upload_size_mb,
          s.timezone,
          s.system_active ? 1 : 0,
          s.updated_at.toISOString(),
        ],
      });
    }

    // Sync Position
    for (const p of positions) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO "Position" ("id", "name", "description", "is_active", "created_at", "updated_at")
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          p.id,
          p.name,
          p.description,
          p.is_active ? 1 : 0,
          p.created_at.toISOString(),
          p.updated_at.toISOString(),
        ],
      });
    }

    // Sync User
    for (const u of users) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO "User" ("id", "username", "password_hash", "discord_name", "position_id", "ooc_name", "steam_hex", "avatar", "role", "is_active", "last_login_at", "created_at", "updated_at")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          u.id,
          u.username,
          u.password_hash,
          u.discord_name,
          u.position_id,
          u.ooc_name,
          u.steam_hex,
          u.avatar,
          u.role,
          u.is_active ? 1 : 0,
          u.last_login_at ? u.last_login_at.toISOString() : null,
          u.created_at.toISOString(),
          u.updated_at.toISOString(),
        ],
      });
    }

    // Sync Attendance
    for (const a of attendances) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO "Attendance" ("id", "user_id", "duty_in_time", "duty_out_time", "duration_minutes", "duty_in_screenshot", "duty_out_screenshot", "status", "user_note", "admin_note", "reviewed_by", "reviewed_at", "created_at", "updated_at", "deleted_at")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          a.id,
          a.user_id,
          a.duty_in_time.toISOString(),
          a.duty_out_time ? a.duty_out_time.toISOString() : null,
          a.duration_minutes,
          a.duty_in_screenshot,
          a.duty_out_screenshot,
          a.status,
          a.user_note,
          a.admin_note,
          a.reviewed_by,
          a.reviewed_at ? a.reviewed_at.toISOString() : null,
          a.created_at.toISOString(),
          a.updated_at.toISOString(),
          a.deleted_at ? a.deleted_at.toISOString() : null,
        ],
      });
    }

    // Sync LeaveRequest
    for (const l of leaveRequests) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO "LeaveRequest" ("id", "user_id", "leave_type", "start_date", "end_date", "reason", "attachment", "status", "admin_note", "approved_by", "approved_at", "created_at", "updated_at")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          l.id,
          l.user_id,
          l.leave_type,
          l.start_date.toISOString(),
          l.end_date.toISOString(),
          l.reason,
          l.attachment,
          l.status,
          l.admin_note,
          l.approved_by,
          l.approved_at ? l.approved_at.toISOString() : null,
          l.created_at.toISOString(),
          l.updated_at.toISOString(),
        ],
      });
    }

    // Sync AuditLog
    for (const log of auditLogs) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO "AuditLog" ("id", "admin_id", "action", "table_name", "record_id", "old_data", "new_data", "ip_address", "user_agent", "created_at")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          log.id,
          log.admin_id,
          log.action,
          log.table_name,
          log.record_id,
          log.old_data,
          log.new_data,
          log.ip_address,
          log.user_agent,
          log.created_at.toISOString(),
        ],
      });
    }

    // Sync UserReport
    for (const r of reports) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO "UserReport" ("id", "user_id", "title", "category", "content", "screenshots", "status", "admin_note", "reviewed_by", "reviewed_at", "created_at", "updated_at")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          r.id,
          r.user_id,
          r.title,
          r.category,
          r.content,
          r.screenshots,
          r.status,
          r.admin_note,
          r.reviewed_by,
          r.reviewed_at ? r.reviewed_at.toISOString() : null,
          r.created_at.toISOString(),
          r.updated_at.toISOString(),
        ],
      });
    }

    await tursoClient.execute('PRAGMA foreign_keys = ON;');

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log('🎉 SINKRONISASI DATABASE KE TURSO CLOUD BERHASIL!');
    console.log('====================================================');
    console.log(`⏱️ Selesai dalam: ${durationSec} detik`);
    console.log(`🌐 Turso Cloud DB URL: ${url}`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Gagal melakukan sinkronisasi database ke Turso Cloud:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
  }
}

syncLocalToTurso();
