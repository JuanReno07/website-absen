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

    const sqlPath = path.join(backupDir, `turso_db_backup_${timestampStr}.sql`);
    const latestSqlPath = path.join(backupDir, `latest_turso_db_backup.sql`);

    fs.writeFileSync(sqlPath, sqlDump, 'utf-8');
    fs.writeFileSync(latestSqlPath, sqlDump, 'utf-8');

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('✅ BACKUP DATABASE BERHASIL!');
    console.log(`⏱️ Durasi: ${durationSec} detik`);
    console.log(`📂 Folder Backup: ${backupDir}`);
    console.log(`📄 JSON Backup File: ${jsonPath}`);
    console.log(`📄 SQL Backup File: ${sqlPath}`);
    console.log(`📊 Total Data Ter-backup:`);
    console.log(`   - Users/Anggota : ${users.length} akun`);
    console.log(`   - Positions/Jabatan: ${positions.length} data`);
    console.log(`   - Attendances/Absen: ${attendances.length} sesi`);
    console.log(`   - Leave Requests : ${leaveRequests.length} pengajuan`);
    console.log(`   - Audit Logs     : ${auditLogs.length} rekam jejak`);

  } catch (error) {
    console.error('❌ Gagal melakukan backup database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
