/**
 * Script to push the Prisma schema to Turso cloud database.
 * Creates all tables defined in schema.prisma and seeds initial data.
 * 
 * Usage: npx ts-node prisma/turso-setup.ts
 */

import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'libsql://website-absen-juanreno07.aws-ap-northeast-1.turso.io';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ4NTU2ODYsImlkIjoiMDE5ZjkxYWYtNGYwMS03Zjg1LTkzZTktOWRlMDNiZTdjMmVhIiwia2lkIjoicHU2aDFCbHFQOF81Z1pZZHNwV3NVdHZNN2RKdDJ2QUZXWXJvVWZ4X0cySSIsInJpZCI6ImE5NWEyZDhmLTk4ZmEtNDAxMi1hNmNmLTkyNDNhMmU1NmZmNCJ9.XLBKfR7SgMunfY3i3vtfCDRg5uf44KMsCkNotanrx_jc-j0oL0Aq9lXKgmGVgtOpyHA04uxQFJRwhVlf9mckCA';

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('🚀 Connecting to Turso...');
  console.log(`   URL: ${TURSO_DATABASE_URL}`);

  // ==========================================
  // 1. CREATE TABLES (matching schema.prisma)
  // ==========================================
  console.log('\n📦 Creating tables...');

  // Position table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Position" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "is_active" INTEGER NOT NULL DEFAULT 1,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "Position_name_key" ON "Position"("name")`);
  console.log('   ✅ Position table created');

  // User table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "password_hash" TEXT NOT NULL,
      "discord_name" TEXT NOT NULL,
      "position_id" TEXT NOT NULL,
      "ooc_name" TEXT NOT NULL,
      "steam_hex" TEXT NOT NULL,
      "avatar" TEXT,
      "role" TEXT NOT NULL DEFAULT 'MEMBER',
      "is_active" INTEGER NOT NULL DEFAULT 1,
      "last_login_at" DATETIME,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "User_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`);
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "User_steam_hex_key" ON "User"("steam_hex")`);
  await client.execute(`CREATE INDEX IF NOT EXISTS "User_position_id_idx" ON "User"("position_id")`);
  await client.execute(`CREATE INDEX IF NOT EXISTS "User_steam_hex_idx" ON "User"("steam_hex")`);
  console.log('   ✅ User table created');

  // Attendance table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Attendance" (
      "id" TEXT NOT NULL PRIMARY KEY,
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
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deleted_at" DATETIME,
      CONSTRAINT "Attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS "Attendance_user_id_idx" ON "Attendance"("user_id")`);
  await client.execute(`CREATE INDEX IF NOT EXISTS "Attendance_status_idx" ON "Attendance"("status")`);
  await client.execute(`CREATE INDEX IF NOT EXISTS "Attendance_duty_in_time_idx" ON "Attendance"("duty_in_time")`);
  console.log('   ✅ Attendance table created');

  // LeaveRequest table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "LeaveRequest" (
      "id" TEXT NOT NULL PRIMARY KEY,
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
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "LeaveRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS "LeaveRequest_user_id_idx" ON "LeaveRequest"("user_id")`);
  await client.execute(`CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status")`);
  console.log('   ✅ LeaveRequest table created');

  // SystemSettings table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "SystemSettings" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
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
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('   ✅ SystemSettings table created');

  // AuditLog table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "admin_id" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "table_name" TEXT NOT NULL,
      "record_id" TEXT NOT NULL,
      "old_data" TEXT,
      "new_data" TEXT,
      "ip_address" TEXT,
      "user_agent" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AuditLog_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS "AuditLog_admin_id_idx" ON "AuditLog"("admin_id")`);
  console.log('   ✅ AuditLog table created');

  // ==========================================
  // 2. SEED DATA
  // ==========================================
  console.log('\n🌱 Seeding initial data...');

  // Generate unique IDs
  const genId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'c';
    for (let i = 0; i < 24; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  // Positions
  const positions = [
    { name: 'Chief of Police', description: 'Kepala Kepolisian ASE Roleplay' },
    { name: 'Deputy Chief', description: 'Wakil Kepala Kepolisian' },
    { name: 'Captain', description: 'Perwira Menengah / Kepala Divisi' },
    { name: 'Lieutenant', description: 'Komandan Pengawas Lapangan' },
    { name: 'Sergeant', description: 'Pengawas Petugas Lapangan' },
    { name: 'Officer', description: 'Petugas Kepolisian Aktif' },
    { name: 'Cadet', description: 'Anggota Magang Kepolisian' },
    { name: 'EMS Director', description: 'Direktur Medis & Penyelamatan' },
    { name: 'Paramedic', description: 'Petugas Medis Lapangan' },
    { name: 'Staff Administrative', description: 'Staf Administrasi & Logistik' },
  ];

  const positionIds: Record<string, string> = {};

  for (const pos of positions) {
    const id = genId();
    // Use INSERT OR IGNORE to skip if already exists
    await client.execute({
      sql: `INSERT OR IGNORE INTO "Position" ("id", "name", "description", "is_active", "created_at", "updated_at") VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [id, pos.name, pos.description],
    });

    // Get the actual ID (might be existing)
    const result = await client.execute({
      sql: `SELECT "id" FROM "Position" WHERE "name" = ?`,
      args: [pos.name],
    });
    positionIds[pos.name] = result.rows[0]?.id as string || id;
  }
  console.log('   ✅ Positions seeded');

  // Admin User
  const adminPasswordHash = await bcrypt.hash('Prokemas100', 10);
  const adminId = genId();

  // Check if admin already exists
  const existingAdmin = await client.execute({
    sql: `SELECT "id" FROM "User" WHERE "username" = ?`,
    args: ['admin'],
  });

  if (existingAdmin.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO "User" ("id", "username", "password_hash", "discord_name", "position_id", "ooc_name", "steam_hex", "role", "is_active", "created_at", "updated_at") VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [adminId, 'admin', adminPasswordHash, 'SuperAdmin#0001', positionIds['Chief of Police'], 'Budi Admin', '110000199887766', 'ADMIN'],
    });
    console.log('   ✅ Admin account created (admin / Prokemas100)');
  } else {
    console.log('   ℹ️  Admin account already exists, skipping');
  }

  // System Settings
  const existingSettings = await client.execute({
    sql: `SELECT "id" FROM "SystemSettings" WHERE "id" = ?`,
    args: ['default'],
  });

  if (existingSettings.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO "SystemSettings" ("id", "company_name", "system_name", "logo", "primary_color", "secondary_color", "accent_color", "theme_mode", "updated_at") VALUES ('default', 'ASE GROUP', 'ASE Duty Attendance System', '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png', '#DC2626', '#1E293B', '#EF4444', 'BRANDED', datetime('now'))`,
      args: [],
    });
    console.log('   ✅ System Settings initialized');
  } else {
    console.log('   ℹ️  System Settings already exist, skipping');
  }

  console.log('\n🎉 Turso database setup complete!');
  console.log('   All tables created and initial data seeded.');
  console.log('   You can now deploy to Vercel with TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
}

main()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  });
