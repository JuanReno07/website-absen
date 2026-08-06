import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch reports for the currently logged in user
export async function GET() {
  try {
    const user = await requireAuth();

    const reports = await prisma.userReport.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir. Silakan login kembali.' }, { status: 401 });
    }
    console.error('GET User Reports error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data laporan.' }, { status: 500 });
  }
}

// POST: Create a new report with title, category, content, and multiple screenshots
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { title, category, content, screenshots } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul laporan wajib diisi.' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Isi rincian laporan wajib diisi.' }, { status: 400 });
    }

    if (!screenshots || !Array.isArray(screenshots) || screenshots.length === 0) {
      return NextResponse.json({ error: 'Minimal 1 foto screenshot bukti wajib diunggah.' }, { status: 400 });
    }

    // Filter valid non-empty base64 screenshots
    const validScreenshots = screenshots.filter((s: string) => typeof s === 'string' && s.trim().length > 0);

    if (validScreenshots.length === 0) {
      return NextResponse.json({ error: 'Foto screenshot bukti tidak valid.' }, { status: 400 });
    }

    const newReport = await prisma.userReport.create({
      data: {
        user_id: user.id,
        title: title.trim(),
        category: category || 'Laporan Kegiatan',
        content: content.trim(),
        screenshots: JSON.stringify(validScreenshots),
        status: 'MENUNGGU_DITANGGAPI',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil terkirim dan akan ditinjau oleh Admin!',
      report: newReport,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir. Silakan login kembali.' }, { status: 401 });
    }
    console.error('POST User Report error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengirimkan laporan.' }, { status: 500 });
  }
}
