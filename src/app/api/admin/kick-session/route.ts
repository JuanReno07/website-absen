import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function performAutoDutyOut(userId: string, adminId: string) {
  try {
    const activeDuty = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        status: 'SEDANG_DUTY',
      },
    });

    if (activeDuty) {
      const now = new Date();
      const durationMinutes = Math.max(
        1,
        Math.round((now.getTime() - new Date(activeDuty.duty_in_time).getTime()) / 60000)
      );

      const formattedNow = now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const note = activeDuty.admin_note
        ? `${activeDuty.admin_note} | [Auto Duty-Out oleh Admin Kick pada ${formattedNow}]`
        : `Duty dihentikan & diselesaikan otomatis oleh Admin saat Kick Session pada ${formattedNow}`;

      await prisma.attendance.update({
        where: { id: activeDuty.id },
        data: {
          duty_out_time: now,
          duration_minutes: durationMinutes,
          status: 'DUTY_SELESAI',
          admin_note: note,
          reviewed_by: adminId,
          reviewed_at: now,
        },
      });
      return true;
    }
  } catch (e) {
    console.error(`Auto duty-out error for user ${userId}:`, e);
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();
    const { userId, sessionId, kickAll } = body;

    // 1. Kick All Active Sessions (Purge All)
    if (kickAll) {
      // Find all active duties and Auto Duty-Out
      const activeDuties = await prisma.attendance.findMany({
        where: { status: 'SEDANG_DUTY' },
        select: { user_id: true },
      });

      for (const d of activeDuties) {
        await performAutoDutyOut(d.user_id, adminUser.id);
      }

      // Deactivate all UserSessions
      await prisma.userSession.updateMany({
        data: { is_active: false },
      });

      // Increment session_version for all users
      await prisma.user.updateMany({
        data: { session_version: { increment: 1 } },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          admin_id: adminUser.id,
          action: 'PURGE_ALL_SESSIONS',
          table_name: 'User',
          record_id: 'ALL',
          new_data: JSON.stringify({
            message: 'Seluruh sesi user di-kick dari sistem dan duty aktif dihentikan otomatis.',
            affected_active_duties: activeDuties.length,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Seluruh sesi pengguna berhasil di-kick, dan jam kerja aktif dihentikan otomatis.',
      });
    }

    // 2. Kick Specific Device Session (by sessionId)
    if (sessionId) {
      const dbSession = await prisma.userSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!dbSession) {
        return NextResponse.json({ error: 'Sesi perangkat tidak ditemukan.' }, { status: 404 });
      }

      // Deactivate target session
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { is_active: false },
      });

      // Auto Duty-Out check for that user
      const hadDuty = await performAutoDutyOut(dbSession.user_id, adminUser.id);

      // Audit Log
      await prisma.auditLog.create({
        data: {
          admin_id: adminUser.id,
          action: 'KICK_DEVICE_SESSION',
          table_name: 'UserSession',
          record_id: sessionId,
          new_data: JSON.stringify({
            target_username: dbSession.user.username,
            ip_address: dbSession.ip_address,
            browser: dbSession.browser_name,
            os: dbSession.os_name,
            had_active_duty: hadDuty,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Sesi perangkat (${dbSession.browser_name} - ${dbSession.ip_address || 'Unknown IP'}) milik ${dbSession.user.username} berhasil di-kick.${hadDuty ? ' Waktu duty aktif telah diselesaikan otomatis.' : ''}`,
      });
    }

    // 3. Kick All Sessions for a Single User (by userId)
    if (!userId) {
      return NextResponse.json({ error: 'ID User atau Session ID wajib disertakan.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Auto Duty-Out if active
    const hadDuty = await performAutoDutyOut(userId, adminUser.id);

    // Deactivate all sessions for this user
    await prisma.userSession.updateMany({
      where: { user_id: userId },
      data: { is_active: false },
    });

    // Increment session_version for target user
    await prisma.user.update({
      where: { id: userId },
      data: { session_version: { increment: 1 } },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: adminUser.id,
        action: 'KICK_USER_SESSIONS',
        table_name: 'User',
        record_id: userId,
        new_data: JSON.stringify({
          target_username: targetUser.username,
          had_active_duty: hadDuty,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Seluruh sesi login untuk user "${targetUser.username}" (${targetUser.ooc_name}) berhasil di-kick.${hadDuty ? ' Waktu duty aktif telah diselesaikan otomatis.' : ''}`,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    console.error('Kick session error:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server saat menendang sesi.' },
      { status: 500 }
    );
  }
}
