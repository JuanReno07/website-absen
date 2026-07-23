import fs from 'fs';
import path from 'path';

/**
 * Utility to save screenshot and logo files.
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
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (base64Data.startsWith('data:image')) {
      return base64Data;
    }
    return `data:image/webp;base64,${base64Data}`;
  }

  try {
    // Local filesystem storage
    let base64Pure = base64Data;
    if (base64Data.includes(';base64,')) {
      base64Pure = base64Data.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Pure, 'base64');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `brand-logo-${userId}-${Date.now()}.png`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file locally, falling back to data URL:', error);
    if (base64Data.startsWith('data:image')) {
      return base64Data;
    }
    return `data:image/png;base64,${base64Data}`;
  }
}
