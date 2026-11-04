import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAttendanceExcel } from '@/lib/excel';

export const dynamic = 'force-dynamic';

function sanitizeSpreadsheetCell(value: string | null | undefined): string {
  if (!value) return '';
  const str = String(value);
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

function escapeCsvCell(value: string | null | undefined): string {
  return `"${sanitizeSpreadsheetCell(value).replace(/"/g, '""')}"`;
}

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
    const leaveWhere: any = {};
    const reportWhere: any = {};

    if (status && status !== 'ALL') where.status = status;
    if (position_id && position_id !== 'ALL') {
      where.user = { position_id };
      leaveWhere.user = { position_id };
      reportWhere.user = { position_id };
    }

    const now = new Date();
    let periodLabel = 'Semua Waktu';

    if (period === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.duty_in_time = { gte: startOfToday, lte: endOfToday };
      leaveWhere.OR = [
        { start_date: { lte: endOfToday }, end_date: { gte: startOfToday } },
        { created_at: { gte: startOfToday, lte: endOfToday } },
      ];
      reportWhere.created_at = { gte: startOfToday, lte: endOfToday };
      periodLabel = 'Hari Ini';
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
      startOfWeek.setHours(0, 0, 0, 0);
      where.duty_in_time = { gte: startOfWeek };
      leaveWhere.OR = [
        { end_date: { gte: startOfWeek } },
        { created_at: { gte: startOfWeek } },
      ];
      reportWhere.created_at = { gte: startOfWeek };
      periodLabel = 'Minggu Ini';
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      where.duty_in_time = { gte: startOfMonth };
      leaveWhere.OR = [
        { end_date: { gte: startOfMonth } },
        { created_at: { gte: startOfMonth } },
      ];
      reportWhere.created_at = { gte: startOfMonth };
      periodLabel = 'Bulan Ini';
    } else if (period === 'custom' && startDateParam && endDateParam) {
      const startCustom = new Date(startDateParam + 'T00:00:00');
      const endCustom = new Date(endDateParam + 'T23:59:59.999');
      where.duty_in_time = {
        gte: startCustom,
        lte: endCustom,
      };
      leaveWhere.OR = [
        { start_date: { lte: endCustom }, end_date: { gte: startCustom } },
        { created_at: { gte: startCustom, lte: endCustom } },
      ];
      reportWhere.created_at = {
        gte: startCustom,
        lte: endCustom,
      };
      periodLabel = `${startDateParam} s/d ${endDateParam}`;
    }

    const pendingWhere: any = {
      status: 'PERLU_PEMERIKSAAN',
      deleted_at: null,
    };
    if (position_id && position_id !== 'ALL') {
      pendingWhere.user = { position_id };
    }
    if (where.duty_in_time) {
      pendingWhere.duty_in_time = where.duty_in_time;
    }

    const [attendances, leaveRequests, userReports, pendingManualAttendances] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          user: { include: { position: true } },
        },
        orderBy: { duty_in_time: 'desc' },
      }),
      prisma.leaveRequest.findMany({
        where: leaveWhere,
        include: {
          user: { include: { position: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.userReport.findMany({
        where: reportWhere,
        include: {
          user: { include: { position: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.attendance.findMany({
        where: pendingWhere,
        include: {
          user: { include: { position: true } },
        },
        orderBy: { duty_in_time: 'desc' },
      }),
    ]);

    const exportRecords = attendances.map((a) => ({
      id: a.id,
      discord_name: sanitizeSpreadsheetCell(a.user.discord_name),
      position_name: sanitizeSpreadsheetCell(a.user.position.name),
      ooc_name: sanitizeSpreadsheetCell(a.user.ooc_name),
      steam_hex: sanitizeSpreadsheetCell(a.user.steam_hex),
      duty_in_time: a.duty_in_time,
      duty_out_time: a.duty_out_time,
      duration_minutes: a.duration_minutes,
      status: a.status,
      user_note: a.user_note ? sanitizeSpreadsheetCell(a.user_note) : null,
      admin_note: a.admin_note ? sanitizeSpreadsheetCell(a.admin_note) : null,
    }));

    const pendingExportRecords = pendingManualAttendances.map((a) => ({
      id: a.id,
      discord_name: sanitizeSpreadsheetCell(a.user.discord_name),
      position_name: sanitizeSpreadsheetCell(a.user.position.name),
      ooc_name: sanitizeSpreadsheetCell(a.user.ooc_name),
      steam_hex: sanitizeSpreadsheetCell(a.user.steam_hex),
      duty_in_time: a.duty_in_time,
      duty_out_time: a.duty_out_time,
      duration_minutes: a.duration_minutes,
      status: a.status,
      user_note: a.user_note ? sanitizeSpreadsheetCell(a.user_note) : null,
      admin_note: a.admin_note ? sanitizeSpreadsheetCell(a.admin_note) : null,
    }));

    const leaveRecords = leaveRequests.map((l) => ({
      id: l.id,
      discord_name: sanitizeSpreadsheetCell(l.user.discord_name),
      position_name: sanitizeSpreadsheetCell(l.user.position.name),
      ooc_name: sanitizeSpreadsheetCell(l.user.ooc_name),
      steam_hex: sanitizeSpreadsheetCell(l.user.steam_hex),
      leave_type: sanitizeSpreadsheetCell(l.leave_type),
      start_date: l.start_date,
      end_date: l.end_date,
      reason: sanitizeSpreadsheetCell(l.reason),
      attachment: l.attachment,
      status: l.status,
      admin_note: l.admin_note ? sanitizeSpreadsheetCell(l.admin_note) : null,
      approved_by: l.approved_by,
      approved_at: l.approved_at,
      created_at: l.created_at,
    }));

    const reportRecords = userReports.map((r) => ({
      id: r.id,
      discord_name: sanitizeSpreadsheetCell(r.user.discord_name),
      position_name: sanitizeSpreadsheetCell(r.user.position.name),
      ooc_name: sanitizeSpreadsheetCell(r.user.ooc_name),
      steam_hex: sanitizeSpreadsheetCell(r.user.steam_hex),
      title: sanitizeSpreadsheetCell(r.title),
      category: sanitizeSpreadsheetCell(r.category),
      content: sanitizeSpreadsheetCell(r.content),
      status: r.status,
      admin_note: r.admin_note ? sanitizeSpreadsheetCell(r.admin_note) : null,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      created_at: r.created_at,
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
          return `${idx + 1},${escapeCsvCell(r.discord_name)},${escapeCsvCell(r.position_name)},${escapeCsvCell(r.ooc_name)},${escapeCsvCell(r.steam_hex)},"${r.duty_in_time.toISOString()}","${r.duty_out_time ? r.duty_out_time.toISOString() : ''}",${r.duration_minutes || 0},${dayTotalMin},"${targetStatusText}",${escapeCsvCell(r.status)}`;
        })
        .join('\n');

      return new Response(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Laporan_Duty_ASE_${period}_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const excelBuffer = await generateAttendanceExcel(
      exportRecords,
      periodLabel,
      leaveRecords,
      reportRecords,
      pendingExportRecords
    );
    const uint8Array = new Uint8Array(excelBuffer);

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Laporan_Lengkap_ASE_${period}_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor laporan.' }, { status: 500 });
  }
}
