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

export async function generateAttendanceExcel(records: AttendanceExportRecord[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ASE Roleplay Duty System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Laporan Duty Absensi');

  // Pre-calculate cumulative total minutes per member per date (YYYY-MM-DD)
  const dailyTotals: Record<string, number> = {};
  records.forEach((rec) => {
    if (rec.status === 'DUTY_SELESAI' && rec.duration_minutes) {
      const dateStr = new Date(rec.duty_in_time).toISOString().slice(0, 10);
      const key = `${rec.discord_name}_${dateStr}`;
      dailyTotals[key] = (dailyTotals[key] || 0) + rec.duration_minutes;
    }
  });

  // Title Row
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'LAPORAN REKAPITULASI DUTY ABSENSI - ASE ROLEPLAY';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  // Subtitle / Date stamp & Target Rule Info
  worksheet.mergeCells('A2:K2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `Tanggal Ekspor: ${formatIndonesianDate(new Date())} | Total Record: ${records.length} | Target Minimal Duty: 3 Jam (180 Menit) / Hari`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Table Headers
  const headers = [
    'No',
    'Nama Discord',
    'Jabatan',
    'Nama OOC',
    'Steam Hex',
    'Tanggal Duty',
    'Waktu Duty IN',
    'Waktu Duty OUT',
    'Durasi Sesi',
    'Total Harian',
    'Target 3 Jam',
    'Status Duty',
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
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

  // Populate Data Rows
  records.forEach((rec, index) => {
    const dateStr = new Date(rec.duty_in_time).toISOString().slice(0, 10);
    const key = `${rec.discord_name}_${dateStr}`;
    const dayTotalMin = dailyTotals[key] || (rec.duration_minutes || 0);
    const isTargetFulfilled = dayTotalMin >= 180; // Minimal 3 Jam (180 Menit) per Hari
    const targetStatusText = isTargetFulfilled ? 'Terpenuhi' : 'Belum Terpenuhi';

    const row = worksheet.addRow([
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
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
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

      // Target 3 Jam Status Cell Styling (Column 11)
      if (colNumber === 11) {
        if (isTargetFulfilled) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } }; // Dark Green Text
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green Background
        } else {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' } }; // Dark Red Text
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red Background
        }
      }
    });
  });

  // Column Widths
  worksheet.columns = [
    { width: 6 },  // No
    { width: 22 }, // Discord
    { width: 20 }, // Jabatan
    { width: 20 }, // OOC
    { width: 22 }, // Steam Hex
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
