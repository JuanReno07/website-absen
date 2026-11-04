export interface ParsedDeviceInfo {
  deviceType: string;
  browserName: string;
  osName: string;
}

export function parseUserAgent(ua: string | null | undefined): ParsedDeviceInfo {
  if (!ua) {
    return {
      deviceType: 'Desktop',
      browserName: 'Unknown Browser',
      osName: 'Unknown OS',
    };
  }

  // 1. Detect Device Type
  let deviceType = 'Desktop';
  if (/Tablet|iPad/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // 2. Detect OS Name
  let osName = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) osName = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) osName = 'Windows 8.1';
  else if (/Windows NT 6.2/i.test(ua)) osName = 'Windows 8';
  else if (/Windows NT 6.1/i.test(ua)) osName = 'Windows 7';
  else if (/Windows/i.test(ua)) osName = 'Windows';
  else if (/Android/i.test(ua)) osName = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) osName = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) osName = 'macOS';
  else if (/Linux/i.test(ua)) osName = 'Linux';

  // 3. Detect Browser Name
  let browserName = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browserName = 'Opera';
  else if (/Brave/i.test(ua)) browserName = 'Brave';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browserName = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browserName = 'Apple Safari';
  else if (/MSIE|Trident/i.test(ua)) browserName = 'Internet Explorer';

  return {
    deviceType,
    browserName,
    osName,
  };
}

/**
 * Extracts client IP safely by only trusting proxy headers when verified proxy indicators exist.
 */
export function getClientIp(request: Request): string {
  // 1. Trust Vercel's edge-injected header when running on Vercel infrastructure
  if (process.env.VERCEL === '1' || process.env.VERCEL) {
    const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
    if (vercelForwardedFor) {
      return vercelForwardedFor.split(',')[0].trim();
    }
  }

  // 2. Trust Cloudflare's header only when accompanied by cf-ray indicator
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const cfRay = request.headers.get('cf-ray');
  if (cfConnectingIp && cfRay) {
    return cfConnectingIp.trim();
  }

  // 3. Fallback when explicit TRUST_PROXY=true is set in reverse-proxy environments
  if (process.env.TRUST_PROXY === 'true') {
    const xRealIp = request.headers.get('x-real-ip');
    if (xRealIp) {
      return xRealIp.trim();
    }
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map((s) => s.trim()).filter(Boolean);
      if (ips.length > 0) {
        return ips[ips.length - 1];
      }
    }
  }

  return '127.0.0.1';
}
