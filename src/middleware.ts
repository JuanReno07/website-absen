import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'ase_duty_session';

function parseJwtPayloadRole(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function isSameOriginMutation(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true;
  }
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!origin || !host) {
    return true;
  }
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    if (!isSameOriginMutation(request)) {
      return NextResponse.json({ error: 'Invalid request origin (CSRF blocked).' }, { status: 403 });
    }
  }

  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = parseJwtPayloadRole(token);
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Protected routes requiring authentication
  const protectedRoutes = [
    '/dashboard',
    '/duty-in',
    '/duty-out',
    '/history',
    '/leave',
    '/reports',
    '/daily-report',
    '/profile',
    '/admin',
  ];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    const role = token ? parseJwtPayloadRole(token) : null;
    if (!token || !role) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    if ((pathname === '/admin' || pathname.startsWith('/admin/')) && role !== 'ADMIN') {
      const forbiddenUrl = new URL('/403', request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/duty-in',
    '/duty-in/:path*',
    '/duty-out',
    '/duty-out/:path*',
    '/history',
    '/history/:path*',
    '/leave',
    '/leave/:path*',
    '/reports',
    '/reports/:path*',
    '/daily-report',
    '/daily-report/:path*',
    '/profile',
    '/profile/:path*',
    '/admin',
    '/admin/:path*',
    '/api/:path*',
    '/login',
    '/register',
  ],
};
