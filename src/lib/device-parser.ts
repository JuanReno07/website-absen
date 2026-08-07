/**
 * Device & IP Parser Utility
 * Extracts client IP Address and parses User-Agent headers into readable Device, Browser, and OS info.
 */

export interface ParsedDeviceInfo {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browserName: string;
  osName: string;
  userAgent: string;
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for may contain multiple IPs comma-separated, pick the first client IP
    const ips = xForwardedFor.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

export function parseUserAgent(userAgent: string = ''): ParsedDeviceInfo {
  const ua = userAgent || '';

  // 1. Detect Device Type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobi|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // 2. Detect Operating System
  let osName = 'Windows';
  if (/Windows NT 10/i.test(ua)) osName = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) osName = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) osName = 'Windows 7';
  else if (/Windows/i.test(ua)) osName = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) osName = 'iOS';
  else if (/Android/i.test(ua)) osName = 'Android';
  else if (/Mac OS X/i.test(ua)) osName = 'macOS';
  else if (/Linux/i.test(ua)) osName = 'Linux';
  else if (/CrOS/i.test(ua)) osName = 'ChromeOS';

  // 3. Detect Browser Name
  let browserName = 'Browser';
  if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browserName = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browserName = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browserName = 'Safari';
  else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';
  else if (/Trident\//i.test(ua) || /MSIE/i.test(ua)) browserName = 'Internet Explorer';

  return {
    deviceType,
    browserName,
    osName,
    userAgent: ua,
  };
}
