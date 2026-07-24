import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAttendanceExcel } from '@/lib/excel';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel'; // 'excel' or 'csv'
    const period = searchParams.get('period') || 'all';
    const position_id = searchParams.get('position_id') || '';
    const status = searchParams.get('status') || '';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (position_id && position_id !== 'ALL') where.user = { position_id };

    const now = new Date();
    let periodLabel = 'Semua Waktu';

    if (period === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.duty_in_time = { gte: startOfToday };
      periodLabel = 'Hari Ini';
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
      startOfWeek.setHours(0, 0, 0, 0);
      where.duty_in_time = { gte: startOfWeek };
      periodLabel = 'Minggu Ini';
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      where.duty_in_time = { gte: startOfMonth };
      periodLabel = 'Bulan Ini';
    } else if (period === 'custom' && startDateParam && endDateParam) {
      where.duty_in_time = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam + 'T23:59:59'),
      };
      periodLabel = `${startDateParam} s/d ${endDateParam}`;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: { include: { position: true } },
      },
      orderBy: { duty_in_time: 'desc' },
    });

    const exportRecords = attendances.map((a) => ({
      id: a.id,
      discord_name: a.user.discord_name,
      position_name: a.user.position.name,
      ooc_name: a.user.ooc_name,
      steam_hex: a.user.steam_hex,
      duty_in_time: a.duty_in_time,
      duty_out_time: a.duty_out_time,
      duration_minutes: a.duration_minutes,
      status: a.status,
      user_note: a.user_note,
      admin_note: a.admin_note,
    }));

    if (format === 'csv') {
      const dailyTotals: Record<string, number> = {};
      exportRecords.forEach((rec) => {
        if (rec.status === 'DUTY_SELESAI' && rec.duration_minutes) {
          const dateStr = new Date(rec.duty_in_time).toISOString().slice(0, 10);
          const key = `${rec.discord_name}_${dateStr}`;
          dailyTotals[key] = (dailyTotals[key] || 0) + rec.duration_minutes;
        }
      });

      const csvHeader = `Periode: ${periodLabel}\nNo,Nama Discord,Jabatan,Nama OOC,Steam Hex,Waktu IN,Waktu OUT,Durasi Sesi (Menit),Total Harian (Menit),Target 3 Jam,Status\n`;
      const csvRows = exportRecords
        .map((r, idx) => {
          const dateStr = new Date(r.duty_in_time).toISOString().slice(0, 10);
          const key = `${r.discord_name}_${dateStr}`;
          const dayTotalMin = dailyTotals[key] || (r.duration_minutes || 0);
          const targetStatusText = dayTotalMin >= 180 ? 'Terpenuhi' : 'Belum Terpenuhi';
          return `${idx + 1},"${r.discord_name}","${r.position_name}","${r.ooc_name}","${r.steam_hex}","${r.duty_in_time.toISOString()}","${r.duty_out_time ? r.duty_out_time.toISOString() : ''}",${r.duration_minutes || 0},${dayTotalMin},"${targetStatusText}","${r.status}"`;
        })
        .join('\n');

      return new Response(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Laporan_Duty_ASE_${period}_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const excelBuffer = await generateAttendanceExcel(exportRecords, periodLabel);
    const uint8Array = new Uint8Array(excelBuffer);

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Laporan_Duty_ASE_${period}_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor laporan.' }, { status: 500 });
  }
}
