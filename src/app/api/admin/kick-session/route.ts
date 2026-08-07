import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();
    const { userId, kickAll } = body;

    if (kickAll) {
      // Purge / kick all active sessions by incrementing session_version for all users
      await prisma.user.updateMany({
        data: {
          session_version: {
            increment: 1,
          },
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          admin_id: adminUser.id,
          action: 'PURGE_ALL_SESSIONS',
          table_name: 'User',
          record_id: 'ALL',
          new_data: JSON.stringify({ message: 'Seluruh sesi user di-kick secara massal dari sistem oleh Admin.' }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Seluruh sesi pengguna yang sedang login di sistem telah berhasil di-kick.',
      });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID User wajib disertakan.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan.' },
        { status: 444 }
      );
    }

    // Increment session_version for target user
    await prisma.user.update({
      where: { id: userId },
      data: {
        session_version: {
          increment: 1,
        },
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: adminUser.id,
        action: 'KICK_USER_SESSION',
        table_name: 'User',
        record_id: userId,
        new_data: JSON.stringify({
          target_username: targetUser.username,
          message: `Sesi login user ${targetUser.username} di-kick oleh Admin.`,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sesi login untuk user "${targetUser.username}" (${targetUser.ooc_name}) berhasil di-kick.`,
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
