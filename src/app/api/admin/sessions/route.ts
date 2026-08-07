import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const whereClause: any = {};
    if (userId) {
      whereClause.user_id = userId;
    }

    const sessions = await prisma.userSession.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            discord_name: true,
            ooc_name: true,
            position: { select: { name: true } },
          },
        },
      },
      orderBy: { last_active: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        userId: s.user_id,
        username: s.user.username,
        discordName: s.user.discord_name,
        oocName: s.user.ooc_name,
        positionName: s.user.position?.name || 'Anggota',
        ipAddress: s.ip_address || '127.0.0.1',
        deviceType: s.device_type || 'Desktop',
        browserName: s.browser_name || 'Browser',
        osName: s.os_name || 'Windows',
        userAgent: s.user_agent,
        lastActive: s.last_active.toISOString(),
        isActive: s.is_active,
        createdAt: s.created_at.toISOString(),
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    console.error('Fetch sessions error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sesi perangkat.' },
      { status: 500 }
    );
  }
}
