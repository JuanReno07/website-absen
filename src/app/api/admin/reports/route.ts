import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch all user reports for Admin
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
        { user: { username: { contains: q } } },
        { user: { discord_name: { contains: q } } },
        { user: { ooc_name: { contains: q } } },
      ];
    }

    const reports = await prisma.userReport.findMany({
      where,
      include: {
        user: {
          include: { position: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    console.error('Admin GET reports error:', error);
    return NextResponse.json({ error: 'Gagal mengambil daftar laporan.' }, { status: 500 });
  }
}

// PUT: Admin update report status & admin_note
export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, status, admin_note } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID laporan wajib disertakan.' }, { status: 400 });
    }

    const existingReport = await prisma.userReport.findUnique({ where: { id } });
    if (!existingReport) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    const updatedReport = await prisma.userReport.update({
      where: { id },
      data: {
        status: status || existingReport.status,
        admin_note: admin_note !== undefined ? admin_note : existingReport.admin_note,
        reviewed_by: admin.discord_name || admin.username,
        reviewed_at: new Date(),
      },
      include: {
        user: { include: { position: true } },
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'UPDATE_REPORT_STATUS',
        table_name: 'user_reports',
        record_id: id,
        old_data: JSON.stringify({ status: existingReport.status, admin_note: existingReport.admin_note }),
        new_data: JSON.stringify({ status: updatedReport.status, admin_note: updatedReport.admin_note }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Status laporan berhasil diperbarui!',
      report: updatedReport,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    console.error('Admin PUT report error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
