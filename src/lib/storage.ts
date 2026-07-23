import fs from 'fs';
import path from 'path';

/**
 * Utility to save screenshot files.
 * Works seamlessly in both Local environment (disk storage) and Vercel/Cloud Serverless environments.
 */
export async function saveScreenshotFile(
  base64Data: string,
  userId: string,
  type: 'duty-in' | 'duty-out'
): Promise<string> {
  if (!base64Data) return '';

  // If already an HTTP/HTTPS URL
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  // Cloud / Vercel Serverless environment handling:
  // Disk filesystem is read-only on Vercel, so we preserve Base64 Data URL or use Cloud storage
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (base64Data.startsWith('data:image')) {
      return base64Data;
    }
    return `data:image/webp;base64,${base64Data}`;
  }

  try {
    // Local filesystem storage
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `attendance-${userId}-${Date.now()}-${type}.webp`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving screenshot file locally, falling back to data URL:', error);
    if (base64Data.startsWith('data:image')) {
      return base64Data;
    }
    return `data:image/webp;base64,${base64Data}`;
  }
}
