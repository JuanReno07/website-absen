import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveScreenshotFile } from '@/lib/storage';
import { isJuanUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login terlebih dahulu.' }, { status: 401 });
    }

    // Check if user has direct bypass privilege (Juan or Admin)
    const isDirectAdmin = isJuanUser(user) || user.role === 'ADMIN';

    const body = await request.json();
    const { duty_in_time, duty_out_time, screenshot_in_base64, screenshot_out_base64, user_note } = body;

    // Regular members must provide a reason/explanation
    if (!isDirectAdmin && (!user_note || !user_note.trim())) {
      return NextResponse.json(
        { error: 'Harap cantumkan alasan atau penjelasan pengajuan absen manual.' },
        { status: 400 }
      );
    }

    if (!duty_in_time || !duty_out_time) {
      return NextResponse.json(
        { error: 'Waktu Duty IN dan Duty OUT wajib diisi secara lengkap.' },
        { status: 400 }
      );
    }

    const inDate = new Date(duty_in_time);
    const outDate = new Date(duty_out_time);

    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal atau jam yang dimasukkan tidak valid.' },
        { status: 400 }
      );
    }

    if (outDate.getTime() <= inDate.getTime()) {
      return NextResponse.json(
        { error: 'Waktu Duty OUT (keluar) harus berada setelah waktu Duty IN (masuk).' },
        { status: 400 }
      );
    }

    const durationMinutes = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60)));

    let inScreenshotPath = '/uploads/manual_duty.png';
    if (screenshot_in_base64) {
      inScreenshotPath = await saveScreenshotFile(screenshot_in_base64, user.id, 'duty-in');
    }

    let outScreenshotPath: string | null = null;
    if (screenshot_out_base64) {
      outScreenshotPath = await saveScreenshotFile(screenshot_out_base64, user.id, 'duty-out');
    }

    const status = isDirectAdmin ? 'DUTY_SELESAI' : 'PERLU_PEMERIKSAAN';
    const notePrefix = isDirectAdmin ? '' : '[Pengajuan Manual Member] ';
    const finalNote = user_note ? `${notePrefix}${user_note.trim()}` : (isDirectAdmin ? 'Input Manual Backdate (Admin)' : 'Pengajuan Absen Manual');

    const attendance = await prisma.attendance.create({
      data: {
        user_id: user.id,
        duty_in_time: inDate,
        duty_out_time: outDate,
        duration_minutes: durationMinutes,
        duty_in_screenshot: inScreenshotPath,
        duty_out_screenshot: outScreenshotPath,
        status: status,
        user_note: finalNote,
        reviewed_by: isDirectAdmin ? user.id : null,
        reviewed_at: isDirectAdmin ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: isDirectAdmin
        ? 'Absensi manual berhasil disimpan ke database (Status: Selesai).'
        : 'Pengajuan absen manual Anda berhasil dikirim dan berstatus "Perlu Pemeriksaan". Menunggu persetujuan Admin.',
      status,
      attendance,
    });
  } catch (error: any) {
    console.error('Manual duty error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat menyimpan absen manual.' },
      { status: 500 }
    );
  }
}
