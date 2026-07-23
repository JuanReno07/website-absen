import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveScreenshotFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login terlebih dahulu.' }, { status: 401 });
    }

    // Check system maintenance status
    const settings = await prisma.systemSettings.findFirst({ where: { id: 'default' } });
    if (settings && !settings.system_active && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sistem absensi sedang dalam pemeliharaan (maintenance).' },
        { status: 503 }
      );
    }

    // Check single active duty constraint
    const activeDuty = await prisma.attendance.findFirst({
      where: {
        user_id: user.id,
        status: 'SEDANG_DUTY',
      },
    });

    if (activeDuty) {
      return NextResponse.json(
        { error: 'Anda masih memiliki duty aktif. Selesaikan duty terlebih dahulu.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { screenshot_base64, user_note } = body;

    // Check mandatory screenshot requirement
    if (settings?.require_duty_in_screenshot && !screenshot_base64) {
      return NextResponse.json(
        { error: 'Screenshot bukti Duty IN wajib diunggah.' },
        { status: 400 }
      );
    }

    let screenshotPath = '';
    if (screenshot_base64) {
      screenshotPath = await saveScreenshotFile(screenshot_base64, user.id, 'duty-in');
    }

    const now = new Date();

    const newAttendance = await prisma.attendance.create({
      data: {
        user_id: user.id,
        duty_in_time: now,
        duty_in_screenshot: screenshotPath,
        status: 'SEDANG_DUTY',
        user_note: user_note ? user_note.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Duty IN berhasil dimulai.',
      attendance: newAttendance,
    });
  } catch (error: any) {
    console.error('Duty IN error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memulai duty.' },
      { status: 500 }
    );
  }
}
