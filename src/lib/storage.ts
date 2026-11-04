import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SAFE_IMAGE_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i;
const SAFE_RAW_BASE64_REGEX = /^[A-Za-z0-9+/=\s]+$/;
const MAX_IMAGE_DIMENSION = 8192;

interface ImageInspectionResult {
  valid: boolean;
  detectedMime?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  ext?: 'png' | 'jpg' | 'webp' | 'gif';
  width?: number;
  height?: number;
}

/**
 * Inspects binary magic bytes and extracts image dimensions to prevent MIME spoofing,
 * polyglot payloads, and image decompression bombs.
 */
export function inspectImageBuffer(buf: Buffer): ImageInspectionResult {
  if (!buf || buf.length < 16) return { valid: false };

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR chunk
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a &&
    buf.length >= 24
  ) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width >= 1 && width <= MAX_IMAGE_DIMENSION && height >= 1 && height <= MAX_IMAGE_DIMENSION) {
      return { valid: true, detectedMime: 'image/png', ext: 'png', width, height };
    }
    return { valid: false };
  }

  // 2. GIF: "GIF87a" or "GIF89a"
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    const width = buf.readUInt16LE(6);
    const height = buf.readUInt16LE(8);
    if (width >= 1 && width <= MAX_IMAGE_DIMENSION && height >= 1 && height <= MAX_IMAGE_DIMENSION) {
      return { valid: true, detectedMime: 'image/gif', ext: 'gif', width, height };
    }
    return { valid: false };
  }

  // 3. WEBP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50 &&
    buf.length >= 30
  ) {
    const chunkHeader = buf.toString('ascii', 12, 16);
    let width = 0;
    let height = 0;
    if (chunkHeader === 'VP8 ' && buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
      width = buf.readUInt16LE(26) & 0x3fff;
      height = buf.readUInt16LE(28) & 0x3fff;
    } else if (chunkHeader === 'VP8L' && buf[20] === 0x2f) {
      const b0 = buf[21];
      const b1 = buf[22];
      const b2 = buf[23];
      const b3 = buf[24];
      width = 1 + (((b1 & 0x3f) << 8) | b0);
      height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    } else if (chunkHeader === 'VP8X') {
      width = 1 + buf.readUIntLE(24, 3);
      height = 1 + buf.readUIntLE(27, 3);
    }
    if (width >= 1 && width <= MAX_IMAGE_DIMENSION && height >= 1 && height <= MAX_IMAGE_DIMENSION) {
      return { valid: true, detectedMime: 'image/webp', ext: 'webp', width, height };
    }
    return { valid: false };
  }

  // 4. JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];
      if (marker === 0xff) {
        offset++;
        continue;
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        offset += 2;
        continue;
      }
      const segLen = buf.readUInt16BE(offset + 2);
      if (segLen < 2 || offset + 2 + segLen > buf.length) break;
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        if (width >= 1 && width <= MAX_IMAGE_DIMENSION && height >= 1 && height <= MAX_IMAGE_DIMENSION) {
          return { valid: true, detectedMime: 'image/jpeg', ext: 'jpg', width, height };
        }
        return { valid: false };
      }
      offset += 2 + segLen;
    }
    return { valid: false };
  }

  return { valid: false };
}

export function isValidImageUpload(input: string, maxSizeMB: number = 12): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();

  // Allow safe internal static asset paths (without path traversal)
  if (/^\/(uploads|Logo)\/[A-Za-z0-9._-]+$/i.test(trimmed) && !trimmed.includes('..')) {
    return true;
  }

  let declaredSubtype = '';
  let base64Pure = trimmed;
  if (trimmed.startsWith('data:')) {
    const match = SAFE_IMAGE_DATA_URL_REGEX.exec(trimmed);
    if (!match) {
      return false;
    }
    declaredSubtype = match[1].toLowerCase();
    base64Pure = match[2];
  } else if (!SAFE_RAW_BASE64_REGEX.test(trimmed)) {
    return false;
  }

  const approximateBytes = Math.ceil((base64Pure.length * 3) / 4);
  if (approximateBytes < 16 || approximateBytes > maxSizeMB * 1024 * 1024) {
    return false;
  }

  try {
    const buf = Buffer.from(base64Pure, 'base64');
    if (buf.length < 16 || buf.length > maxSizeMB * 1024 * 1024) {
      return false;
    }
    const inspection = inspectImageBuffer(buf);
    if (!inspection.valid || !inspection.detectedMime) {
      return false;
    }
    if (declaredSubtype) {
      const normalizedDeclared = declaredSubtype === 'jpg' ? 'image/jpeg' : `image/${declaredSubtype}`;
      if (normalizedDeclared !== inspection.detectedMime) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Utility to save screenshot and logo files.
 * Uses magic-byte verification and non-PII random UUID filenames.
 */
export async function saveScreenshotFile(
  base64Data: string,
  _userId: string,
  type: 'duty-in' | 'duty-out'
): Promise<string> {
  if (!base64Data || typeof base64Data !== 'string') return '';

  const trimmed = base64Data.trim();

  if (!isValidImageUpload(trimmed)) {
    throw new Error('Format gambar tidak valid, dimensi rusak, atau ukuran melebihi batas maksimal.');
  }

  if (/^\/(uploads|Logo)\/[A-Za-z0-9._-]+$/i.test(trimmed) && !trimmed.includes('..')) {
    return trimmed;
  }

  let base64Pure = trimmed;
  if (trimmed.includes(';base64,')) {
    base64Pure = trimmed.split(';base64,')[1];
  }

  const buffer = Buffer.from(base64Pure, 'base64');
  const inspection = inspectImageBuffer(buffer);
  const detectedMime = inspection.detectedMime || 'image/webp';
  const ext = inspection.ext || 'webp';

  // Cloud / Vercel Serverless environment handling:
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return `data:${detectedMime};base64,${base64Pure}`;
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeType = type === 'duty-out' ? 'duty-out' : 'duty-in';
    const randomId = crypto.randomUUID();
    const filename = `att-${safeType}-${randomId}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file locally, falling back to data URL:', error);
    return `data:${detectedMime};base64,${base64Pure}`;
  }
}
