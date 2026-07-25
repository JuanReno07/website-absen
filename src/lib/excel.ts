import ExcelJS from 'exceljs';
import { formatIndonesianDate, formatIndonesianTime, formatDurationMinutes } from './utils';

export interface AttendanceExportRecord {
  id: string;
  discord_name: string;
  position_name: string;
  ooc_name: string;
  steam_hex: string;
  duty_in_time: Date;
  duty_out_time: Date | null;
  duration_minutes: number | null;
  status: string;
  user_note: string | null;
  admin_note: string | null;
}

export async function generateAttendanceExcel(
  records: AttendanceExportRecord[],
  periodLabel: string = 'Semua Waktu'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ASE Roleplay Duty System';
  workbook.created = new Date();

  // ==========================================
  // SHEET 1: REKAP HARIAN PER ANGGOTA (PER TANGGAL)
  // ==========================================
  const sheetDaily = workbook.addWorksheet('Rekap Harian (Per Tanggal)');

  // Group records by User ID + Date (YYYY-MM-DD)
  interface DailyGroup {
    dateStr: string;
    duty_in_time: Date;
    discord_name: string;
    position_name: string;
    ooc_name: string;
    steam_hex: string;
    session_count: number;
    total_minutes: number;
  }

  const dailyMap: Record<string, DailyGroup> = {};

  records.forEach((rec) => {
    const dateStr = new Date(rec.duty_in_time).toISOString().slice(0, 10);
    const key = `${rec.discord_name}_${dateStr}`;

    if (!dailyMap[key]) {
      dailyMap[key] = {
        dateStr,
        duty_in_time: rec.duty_in_time,
        discord_name: rec.discord_name,
        position_name: rec.position_name,
        ooc_name: rec.ooc_name,
        steam_hex: rec.steam_hex,
        session_count: 0,
        total_minutes: 0,
      };
    }

    dailyMap[key].session_count += 1;
    if (rec.status === 'DUTY_SELESAI' && rec.duration_minutes) {
      dailyMap[key].total_minutes += rec.duration_minutes;
    }
  });

  const dailyList = Object.values(dailyMap).sort((a, b) => b.duty_in_time.getTime() - a.duty_in_time.getTime());

  // Calculate summary metrics
  const totalDutyMinutesAll = records
    .filter((r) => r.status === 'DUTY_SELESAI')
    .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

  // Title Row Sheet 1
  sheetDaily.mergeCells('A1:I1');
  const title1 = sheetDaily.getCell('A1');
  title1.value = 'REKAPITULASI HARIAN DUTY ANGGOTA - ASE ROLEPLAY';
  title1.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetDaily.getRow(1).height = 40;

  // Subtitle Sheet 1
  sheetDaily.mergeCells('A2:I2');
  const sub1 = sheetDaily.getCell('A2');
  sub1.value = `Periode Laporan: ${periodLabel} | Ekspor: ${formatIndonesianDate(new Date())} | Target Minimal Duty: 3 Jam (180 Menit) / Hari`;
  sub1.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  sub1.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetDaily.getRow(2).height = 22;

  // Header Summary Banner (Row 4)
  sheetDaily.mergeCells('A4:C4');
  const s1 = sheetDaily.getCell('A4');
  s1.value = `TOTAL AKUMULASI DUTY: ${formatDurationMinutes(totalDutyMinutesAll)}`;
  s1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  s1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  s1.alignment = { horizontal: 'center', vertical: 'middle' };

  sheetDaily.mergeCells('D4:F4');
  const s2 = sheetDaily.getCell('D4');
  s2.value = `TOTAL HARIAN TERCATAT: ${dailyList.length} Hari-Anggota`;
  s2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  s2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  s2.alignment = { horizontal: 'center', vertical: 'middle' };

  sheetDaily.mergeCells('G4:I4');
  const s3 = sheetDaily.getCell('G4');
  s3.value = `TOTAL SESI: ${records.length} Sesi`;
  s3.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  s3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  s3.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetDaily.getRow(4).height = 24;

  sheetDaily.getRow(5).height = 10;

  // Table Headers Sheet 1
  const headersDaily = [
    'No',
    'Tanggal Duty',
    'Nama Discord',
    'Jabatan',
    'Nama OOC',
    'Steam Hex',
    'Jumlah Sesi',
    'Total Durasi Harian',
    'Status Target (3 Jam)',
  ];

  const headerRow1 = sheetDaily.addRow(headersDaily);
  headerRow1.height = 26;
  headerRow1.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FFDC2626' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Data Rows Sheet 1
  dailyList.forEach((item, idx) => {
    const isTargetFulfilled = item.total_minutes >= 180;
    const targetStatusText = isTargetFulfilled ? 'Terpenuhi (≥ 3 Jam)' : 'Belum Terpenuhi (< 3 Jam)';

    const row = sheetDaily.addRow([
      idx + 1,
      formatIndonesianDate(item.duty_in_time),
      item.discord_name,
      item.position_name,
      item.ooc_name,
      item.steam_hex,
      `${item.session_count} Sesi`,
      formatDurationMinutes(item.total_minutes),
      targetStatusText,
    ]);

    row.height = 22;
    const isEven = idx % 2 === 0;
    const bg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 || colNum === 2 || colNum === 7 || colNum === 9 ? 'center' : 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (colNum === 8) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      }

      if (colNum === 9) {
        if (isTargetFulfilled) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      }
    });
  });

  sheetDaily.columns = [
    { width: 6 },  // No
    { width: 25 }, // Tanggal
    { width: 24 }, // Discord
    { width: 22 }, // Jabatan
    { width: 22 }, // OOC
    { width: 24 }, // Steam Hex
    { width: 16 }, // Sesi
    { width: 22 }, // Total Durasi Harian
    { width: 25 }, // Status Target
  ];

  // ==========================================
  // SHEET 2: DETAIL SELURUH SESI DUTY
  // ==========================================
  const sheetDetail = workbook.addWorksheet('Detail Sesi Duty');

  sheetDetail.mergeCells('A1:L1');
  const title2 = sheetDetail.getCell('A1');
  title2.value = 'DETAIL CATATAN SESI DUTY ABSENSI - ASE ROLEPLAY';
  title2.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetDetail.getRow(1).height = 40;

  sheetDetail.mergeCells('A2:L2');
  const sub2 = sheetDetail.getCell('A2');
  sub2.value = `Periode: ${periodLabel} | Total Sesi: ${records.length} Record Sesi`;
  sub2.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  sub2.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetDetail.getRow(2).height = 22;

  const headersDetail = [
    'No',
    'Nama Discord',
    'Jabatan',
    'Nama OOC',
    'Steam Hex',
    'Tanggal Duty',
    'Waktu IN',
    'Waktu OUT',
    'Durasi Sesi',
    'Total Harian',
    'Target 3 Jam',
    'Status Duty',
  ];

  const headerRow2 = sheetDetail.addRow(headersDetail);
  headerRow2.height = 26;
  headerRow2.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FFDC2626' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  records.forEach((rec, index) => {
    const dateStr = new Date(rec.duty_in_time).toISOString().slice(0, 10);
    const key = `${rec.discord_name}_${dateStr}`;
    const dayTotalMin = dailyMap[key] ? dailyMap[key].total_minutes : (rec.duration_minutes || 0);
    const isTargetFulfilled = dayTotalMin >= 180;
    const targetStatusText = isTargetFulfilled ? 'Terpenuhi' : 'Belum Terpenuhi';

    const row = sheetDetail.addRow([
      index + 1,
      rec.discord_name,
      rec.position_name,
      rec.ooc_name,
      rec.steam_hex,
      formatIndonesianDate(rec.duty_in_time),
      formatIndonesianTime(rec.duty_in_time),
      rec.duty_out_time ? formatIndonesianTime(rec.duty_out_time) : 'Sedang Aktif',
      formatDurationMinutes(rec.duration_minutes),
      formatDurationMinutes(dayTotalMin),
      targetStatusText,
      rec.status,
    ]);

    row.height = 22;
    const isEven = index % 2 === 0;
    const bg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 6 || colNumber === 7 || colNumber === 8 || colNumber === 11 || colNumber === 12 ? 'center' : 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (colNumber === 11) {
        if (isTargetFulfilled) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      }
    });
  });

  sheetDetail.columns = [
    { width: 6 },  // No
    { width: 24 }, // Discord
    { width: 22 }, // Jabatan
    { width: 22 }, // OOC
    { width: 24 }, // Steam Hex
    { width: 25 }, // Tanggal
    { width: 16 }, // IN
    { width: 16 }, // OUT
    { width: 18 }, // Durasi Sesi
    { width: 18 }, // Total Harian
    { width: 18 }, // Target 3 Jam
    { width: 20 }, // Status Duty
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
