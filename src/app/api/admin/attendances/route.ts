import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateDurationInMinutes } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// GET all attendance records with rich filters & active duty counts
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const position_id = searchParams.get('position_id') || '';
    const period = searchParams.get('period') || 'all';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const where: any = { deleted_at: null };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (position_id && position_id !== 'ALL') {
      where.user = { position_id: position_id };
    }

    if (search) {
      where.user = {
        ...where.user,
        OR: [
          { username: { contains: search } },
          { discord_name: { contains: search } },
          { ooc_name: { contains: search } },
          { steam_hex: { contains: search } },
        ],
      };
    }

    const now = new Date();
    if (period === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.duty_in_time = { gte: startOfToday };
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
      startOfWeek.setHours(0, 0, 0, 0);
      where.duty_in_time = { gte: startOfWeek };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      where.duty_in_time = { gte: startOfMonth };
    } else if (period === 'custom' && startDateParam && endDateParam) {
      where.duty_in_time = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam + 'T23:59:59'),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          include: { position: true },
        },
      },
      orderBy: { duty_in_time: 'desc' },
    });

    // Real-time duty stats summary for Dashboard Admin
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeDutyCount = await prisma.attendance.count({
      where: { status: 'SEDANG_DUTY', deleted_at: null },
    });

    const activeDutiesList = await prisma.attendance.findMany({
      where: { status: 'SEDANG_DUTY', deleted_at: null },
      include: {
        user: { include: { position: true } },
      },
      orderBy: { duty_in_time: 'desc' },
    });

    const pendingReviewCount = await prisma.attendance.count({
      where: { status: 'PERLU_PEMERIKSAAN', deleted_at: null },
    });

    const totalMembers = await prisma.user.count({ where: { is_active: true } });
    const inactiveMembers = await prisma.user.count({ where: { is_active: false } });

    const todayDurationAggregate = await prisma.attendance.aggregate({
      where: {
        status: 'DUTY_SELESAI',
        duty_in_time: { gte: startOfToday },
        deleted_at: null,
      },
      _sum: { duration_minutes: true },
    });

    const monthDurationAggregate = await prisma.attendance.aggregate({
      where: {
        status: 'DUTY_SELESAI',
        duty_in_time: { gte: startOfMonth },
        deleted_at: null,
      },
      _sum: { duration_minutes: true },
    });

    return NextResponse.json({
      attendances,
      activeDutiesList,
      stats: {
        totalMembers,
        inactiveMembers,
        activeDutyCount,
        pendingReviewCount,
        todayTotalMinutes: todayDurationAggregate._sum.duration_minutes || 0,
        monthTotalMinutes: monthDurationAggregate._sum.duration_minutes || 0,
      },
    });
  } catch (error: any) {
    console.error('Admin attendances GET error:', error);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

// PUT edit or cancel attendance
export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, duty_in_time, duty_out_time, status, admin_note } = body;

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data absensi tidak ditemukan.' }, { status: 404 });
    }

    const updateData: any = {};

    if (duty_in_time) updateData.duty_in_time = new Date(duty_in_time);
    if (duty_out_time) updateData.duty_out_time = new Date(duty_out_time);

    // Recalculate duration if times updated
    const finalIn = updateData.duty_in_time || existing.duty_in_time;
    const finalOut = updateData.duty_out_time || existing.duty_out_time;

    if (finalIn && finalOut) {
      updateData.duration_minutes = calculateDurationInMinutes(finalIn, finalOut);
    }

    if (status) updateData.status = status;
    if (admin_note !== undefined) updateData.admin_note = admin_note.trim();

    updateData.reviewed_by = admin.id;
    updateData.reviewed_at = new Date();

    const updated = await prisma.attendance.update({
      where: { id },
      data: updateData,
    });

    // Record Audit Log for mandatory auditing
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: status === 'DIBATALKAN_ADMIN' ? 'CANCEL_ATTENDANCE' : 'EDIT_ATTENDANCE',
        table_name: 'attendances',
        record_id: id,
        old_data: JSON.stringify({
          status: existing.status,
          duty_in_time: existing.duty_in_time,
          duty_out_time: existing.duty_out_time,
          duration_minutes: existing.duration_minutes,
        }),
        new_data: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, attendance: updated });
  } catch (error: any) {
    console.error('Admin attendance update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE attendance history record (Admin / Superadmin feature)
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Absensi wajib disertakan.' }, { status: 400 });
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data absensi tidak ditemukan.' }, { status: 404 });
    }

    // Hard delete or soft delete
    await prisma.attendance.delete({
      where: { id },
    });

    // Audit Log for deletion
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'DELETE_ATTENDANCE_HISTORY',
        table_name: 'attendances',
        record_id: id,
        old_data: JSON.stringify({
          user: existing.user.discord_name,
          duty_in_time: existing.duty_in_time,
          duty_out_time: existing.duty_out_time,
          duration_minutes: existing.duration_minutes,
          status: existing.status,
        }),
      },
    });

    return NextResponse.json({ success: true, message: 'Data absensi berhasil dihapus.' });
  } catch (error: any) {
    console.error('Admin attendance delete error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
