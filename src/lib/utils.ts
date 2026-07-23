import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format duration in minutes into Indonesian readable string:
 * - 35 -> "35 menit"
 * - 80 -> "1 jam 20 menit"
 * - 245 -> "4 jam 05 menit"
 */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes < 0) return '0 menit';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} menit`;
  }

  const paddedMin = remainingMinutes < 10 ? `0${remainingMinutes}` : `${remainingMinutes}`;
  return `${hours} jam ${paddedMin} menit`;
}

/**
 * Calculates total duration between start and end dates in minutes
 * Handles overnight duties correctly.
 */
export function calculateDurationInMinutes(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

/**
 * Formats a Date object to Indonesian local time format (Asia/Jakarta)
 */
export function formatIndonesianDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatIndonesianTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  const timeStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${timeStr.replace(':', '.')} WIB`;
}

export function formatIndonesianDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  return `${formatIndonesianDate(dateInput)}, ${formatIndonesianTime(dateInput)}`;
}

export const DUTY_STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  BELUM_DUTY: {
    label: 'Belum Duty',
    bgClass: 'bg-slate-800/80',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-700',
  },
  SEDANG_DUTY: {
    label: 'Sedang Duty',
    bgClass: 'bg-emerald-950/80',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
  },
  DUTY_SELESAI: {
    label: 'Duty Selesai',
    bgClass: 'bg-blue-950/80',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/40',
  },
  PERLU_PEMERIKSAAN: {
    label: 'Perlu Pemeriksaan',
    bgClass: 'bg-amber-950/80',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
  },
  DIBATALKAN_ADMIN: {
    label: 'Dibatalkan Admin',
    bgClass: 'bg-red-950/80',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/40',
  },
};
