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

  // Title Row
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'LAPORAN REKAPITULASI DUTY ABSENSI - ASE ROLEPLAY';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  // Subtitle / Date stamp
  worksheet.mergeCells('A2:J2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `Tanggal Ekspor: ${formatIndonesianDate(new Date())} | Total Record: ${records.length}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

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
    'Total Durasi',
    'Status',
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
      rec.status,
    ]);

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 6 || colNumber === 7 || colNumber === 8 || colNumber === 10 ? 'center' : 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
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
    { width: 18 }, // Durasi
    { width: 20 }, // Status
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
