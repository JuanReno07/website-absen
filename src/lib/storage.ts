import fs from 'fs';
import path from 'path';

const SAFE_IMAGE_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const SAFE_RAW_BASE64_REGEX = /^[A-Za-z0-9+/=\s]+$/;

export function isValidImageUpload(input: string, maxSizeMB: number = 12): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();

  // Allow safe internal static asset paths
  if (/^\/(uploads|Logo)\/[A-Za-z0-9._-]+$/i.test(trimmed)) {
    return true;
  }

  let base64Pure = trimmed;
  if (trimmed.startsWith('data:')) {
    if (!SAFE_IMAGE_DATA_URL_REGEX.test(trimmed)) {
      return false;
    }
    const parts = trimmed.split(';base64,');
    if (parts.length !== 2) return false;
    base64Pure = parts[1];
  } else if (!SAFE_RAW_BASE64_REGEX.test(trimmed)) {
    return false;
  }

  const approximateBytes = Math.ceil((base64Pure.length * 3) / 4);
  if (approximateBytes <= 0 || approximateBytes > maxSizeMB * 1024 * 1024) {
    return false;
  }

  return true;
}

/**
 * Utility to save screenshot and logo files.
 * Works seamlessly in both Local environment (disk storage) and Vercel/Cloud Serverless environments.
 */
export async function saveScreenshotFile(
  base64Data: string,
  userId: string,
  type: 'duty-in' | 'duty-out'
): Promise<string> {
  if (!base64Data || typeof base64Data !== 'string') return '';

  const trimmed = base64Data.trim();

  if (!isValidImageUpload(trimmed)) {
    throw new Error('Format gambar tidak valid atau ukuran melebihi batas maksimal.');
  }

  if (/^\/(uploads|Logo)\/[A-Za-z0-9._-]+$/i.test(trimmed)) {
    return trimmed;
  }

  // Cloud / Vercel Serverless environment handling:
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (trimmed.startsWith('data:image')) {
      return trimmed;
    }
    return `data:image/webp;base64,${trimmed}`;
  }

  try {
    // Local filesystem storage
    let base64Pure = trimmed;
    if (trimmed.includes(';base64,')) {
      base64Pure = trimmed.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Pure, 'base64');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeUserId = String(userId).replace(/[^A-Za-z0-9_-]/g, '');
    const safeType = type === 'duty-out' ? 'duty-out' : 'duty-in';
    const filename = `brand-logo-${safeType}-${safeUserId}-${Date.now()}.png`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file locally, falling back to data URL:', error);
    if (trimmed.startsWith('data:image')) {
      return trimmed;
    }
    return `data:image/png;base64,${trimmed}`;
  }
}
