import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // 'today', 'week', 'month', 'all'
    const status = searchParams.get('status');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const where: any = { user_id: user.id };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const now = new Date();
    if (period === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.duty_in_time = { gte: todayStart };
    } else if (period === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.duty_in_time = { gte: weekStart };
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      where.duty_in_time = { gte: monthStart };
    } else if (startDateParam && endDateParam) {
      where.duty_in_time = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam + 'T23:59:59'),
      };
    }

    const history = await prisma.attendance.findMany({
      where,
      orderBy: { duty_in_time: 'desc' },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Duty history GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
