import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { authenticated: false, activeDuty: null, todayTotalMinutes: 0, monthTotalMinutes: 0, recentHistory: [] },
        { status: 200 }
      );
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all database queries in parallel for ultra-fast single round-trip response
    const [activeDuty, todayDuties, monthDuties, recentHistory] = await Promise.all([
      prisma.attendance.findFirst({
        where: {
          user_id: user.id,
          status: 'SEDANG_DUTY',
        },
      }),
      prisma.attendance.aggregate({
        where: {
          user_id: user.id,
          status: 'DUTY_SELESAI',
          duty_in_time: { gte: startOfToday },
        },
        _sum: { duration_minutes: true },
      }),
      prisma.attendance.aggregate({
        where: {
          user_id: user.id,
          status: 'DUTY_SELESAI',
          duty_in_time: { gte: startOfMonth },
        },
        _sum: { duration_minutes: true },
      }),
      prisma.attendance.findMany({
        where: { user_id: user.id },
        orderBy: { duty_in_time: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      authenticated: true,
      activeDuty,
      serverTime: now.toISOString(),
      todayTotalMinutes: todayDuties._sum.duration_minutes || 0,
      monthTotalMinutes: monthDuties._sum.duration_minutes || 0,
      recentHistory,
    });
  } catch (error) {
    console.error('Active duty GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
