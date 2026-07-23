import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all leave requests for admin review
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { username: { contains: search } },
          { discord_name: { contains: search } },
          { ooc_name: { contains: search } },
          { steam_hex: { contains: search } },
        ],
      };
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: { include: { position: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const pendingCount = await prisma.leaveRequest.count({
      where: { status: 'MENUNGGU_PERSETUJUAN' },
    });

    return NextResponse.json({ leaveRequests, pendingCount });
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

// PUT approve or reject leave request
export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, status, admin_note } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID dan status persetujuan wajib diisi.' }, { status: 400 });
    }

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pengajuan izin tidak ditemukan.' }, { status: 404 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        admin_note: admin_note ? admin_note.trim() : null,
        approved_by: admin.id,
        approved_at: new Date(),
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: status === 'DISETUJUI' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
        table_name: 'leave_requests',
        record_id: id,
        old_data: JSON.stringify({ status: existing.status }),
        new_data: JSON.stringify({ status, admin_note }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Status izin berhasil diperbarui menjadi ${status}.`,
      leaveRequest: updated,
    });
  } catch (error: any) {
    console.error('Admin PUT leave error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}
