import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveScreenshotFile } from '@/lib/storage';
import { calculateDurationInMinutes } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login terlebih dahulu.' }, { status: 401 });
    }

    const activeDuty = await prisma.attendance.findFirst({
      where: {
        user_id: user.id,
        status: 'SEDANG_DUTY',
      },
    });

    if (!activeDuty) {
      return NextResponse.json(
        { error: 'Anda belum melakukan Duty IN atau tidak memiliki duty yang sedang aktif.' },
        { status: 400 }
      );
    }

    const settings = await prisma.systemSettings.findFirst({ where: { id: 'default' } });
    const body = await request.json();
    const { screenshot_base64, user_note } = body;

    if (settings?.require_duty_out_screenshot && !screenshot_base64) {
      return NextResponse.json(
        { error: 'Screenshot bukti Duty OUT wajib diunggah.' },
        { status: 400 }
      );
    }

    let screenshotPath = activeDuty.duty_out_screenshot || '';
    if (screenshot_base64) {
      screenshotPath = await saveScreenshotFile(screenshot_base64, user.id, 'duty-out');
    }

    const now = new Date();
    const durationMinutes = calculateDurationInMinutes(activeDuty.duty_in_time, now);

    const updatedAttendance = await prisma.attendance.update({
      where: { id: activeDuty.id },
      data: {
        duty_out_time: now,
        duration_minutes: durationMinutes,
        duty_out_screenshot: screenshotPath,
        status: 'DUTY_SELESAI',
        user_note: user_note ? user_note.trim() : activeDuty.user_note,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Duty berhasil diselesaikan.',
      attendance: updatedAttendance,
    });
  } catch (error: any) {
    console.error('Duty OUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat menyelesaikan duty.' },
      { status: 500 }
    );
  }
}
