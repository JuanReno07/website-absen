import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveScreenshotFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET personal leave requests
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ leaveRequests });
  } catch (error) {
    console.error('GET leave error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST new leave request
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login terlebih dahulu.' }, { status: 401 });
    }

    const body = await request.json();
    const { leave_type, start_date, end_date, reason, screenshot_base64 } = body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return NextResponse.json(
        { error: 'Jenis izin, tanggal mulai, tanggal selesai, dan alasan wajib diisi.' },
        { status: 400 }
      );
    }

    let attachmentPath = '';
    if (screenshot_base64) {
      attachmentPath = await saveScreenshotFile(screenshot_base64, user.id, 'duty-in');
    }

    const newLeave = await prisma.leaveRequest.create({
      data: {
        user_id: user.id,
        leave_type: leave_type.trim(),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        reason: reason.trim(),
        attachment: attachmentPath || null,
        status: 'MENUNGGU_PERSETUJUAN',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengajuan izin berhasil dikirim. Menunggu persetujuan Admin.',
      leaveRequest: newLeave,
    });
  } catch (error: any) {
    console.error('POST leave error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengajukan izin.' },
      { status: 500 }
    );
  }
}
