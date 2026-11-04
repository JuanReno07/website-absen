import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getClientIp } from '@/lib/device-parser';

const REGISTER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REGISTER_ATTEMPTS_PER_IP = 5;
const registerAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const now = Date.now();
    const rateEntry = registerAttempts.get(ip);
    if (rateEntry && now <= rateEntry.resetAt && rateEntry.count >= MAX_REGISTER_ATTEMPTS_PER_IP) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan registrasi. Silakan coba lagi beberapa saat kemudian.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password, discord_name, position_id, ooc_name, steam_hex } = body;

    if (!username || !password || !discord_name || !position_id || !ooc_name || !steam_hex) {
      return NextResponse.json(
        { error: 'Seluruh kolom pendaftaran wajib diisi.' },
        { status: 400 }
      );
    }

    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return NextResponse.json(
        { error: 'Password harus terdiri dari 8 hingga 72 byte (UTF-8).' },
        { status: 400 }
      );
    }

    // Verify position exists
    const position = await prisma.position.findUnique({
      where: { id: String(position_id).trim() },
    });
    if (!position || !position.is_active) {
      return NextResponse.json(
        { error: 'Jabatan yang dipilih tidak valid atau tidak aktif.' },
        { status: 400 }
      );
    }

    // Check unique Steam Hex
    const existingSteam = await prisma.user.findUnique({
      where: { steam_hex: String(steam_hex).trim() },
    });
    if (existingSteam) {
      return NextResponse.json(
        { error: 'Steam Hex sudah terdaftar di sistem. Gunakan Steam Hex milik Anda.' },
        { status: 400 }
      );
    }

    // Check unique Username
    const existingUsername = await prisma.user.findUnique({
      where: { username: String(username).trim() },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username sudah digunakan. Silakan pilih username lain.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: String(username).trim().slice(0, 50),
        password_hash: passwordHash,
        discord_name: String(discord_name).trim().slice(0, 80),
        position_id: String(position_id).trim(),
        ooc_name: String(ooc_name).trim().slice(0, 80),
        steam_hex: String(steam_hex).trim().slice(0, 50),
        role: 'MEMBER',
        is_active: false, // Requires Admin Activation
      },
    });

    if (!rateEntry || now > rateEntry.resetAt) {
      registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_WINDOW_MS });
    } else {
      rateEntry.count += 1;
    }

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Akun Anda membutuhkan persetujuan Admin sebelum dapat login.',
      user_id: newUser.id,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan registrasi akun. Silakan coba kembali.' },
      { status: 500 }
    );
  }
}
