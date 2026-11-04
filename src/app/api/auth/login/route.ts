import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signJwt, COOKIE_NAME } from '@/lib/auth';
import { getClientIp, parseUserAgent } from '@/lib/device-parser';

const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAILED_ATTEMPTS = 8;
const DUMMY_BCRYPT_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Username dan Password wajib diisi.' },
        { status: 400 }
      );
    }

    if (username.length > 100 || password.length > 72) {
      return NextResponse.json(
        { error: 'Username atau password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    const ipAddress = getClientIp(request);
    const normalizedUsername = username.trim();
    const rateKey = `${ipAddress}:${normalizedUsername.toLowerCase()}`;

    const rateStatus = checkRateLimit(rateKey);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${rateStatus.retryAfterSec} detik.`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: { position: true },
    });

    const isPasswordValid = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_BCRYPT_HASH
    );

    if (!user || !isPasswordValid) {
      recordFailedAttempt(rateKey);
      return NextResponse.json(
        { error: 'Username atau password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Akun Anda belum aktif atau dinonaktifkan oleh Admin. Silakan hubungi pengurus.' },
        { status: 403 }
      );
    }

    loginAttempts.delete(rateKey);

    // Extract User Agent Device Info
    const userAgentStr = request.headers.get('user-agent') || '';
    const parsedDevice = parseUserAgent(userAgentStr);
    const tokenId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create UserSession record
    await prisma.userSession.create({
      data: {
        user_id: user.id,
        token_id: tokenId,
        ip_address: ipAddress,
        device_type: parsedDevice.deviceType,
        browser_name: parsedDevice.browserName,
        os_name: parsedDevice.osName,
        user_agent: userAgentStr,
        is_active: true,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const token = signJwt({
      id: user.id,
      username: user.username,
      role: user.role,
      discord_name: user.discord_name,
      ooc_name: user.ooc_name,
      steam_hex: user.steam_hex,
      position_id: user.position_id,
      session_version: user.session_version ?? 1,
      token_id: tokenId,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        discord_name: user.discord_name,
        ooc_name: user.ooc_name,
        steam_hex: user.steam_hex,
        position_name: user.position?.name || 'Anggota',
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat login.' },
      { status: 500 }
    );
  }
}
