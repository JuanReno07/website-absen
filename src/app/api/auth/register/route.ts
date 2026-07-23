import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, discord_name, position_id, ooc_name, steam_hex } = body;

    if (!username || !password || !discord_name || !position_id || !ooc_name || !steam_hex) {
      return NextResponse.json(
        { error: 'Seluruh kolom pendaftaran wajib diisi.' },
        { status: 400 }
      );
    }

    // Check unique Steam Hex
    const existingSteam = await prisma.user.findUnique({
      where: { steam_hex: steam_hex.trim() },
    });
    if (existingSteam) {
      return NextResponse.json(
        { error: 'Steam Hex sudah terdaftar di sistem. Gunakan Steam Hex milik Anda.' },
        { status: 400 }
      );
    }

    // Check unique Username
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.trim() },
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
        username: username.trim(),
        password_hash: passwordHash,
        discord_name: discord_name.trim(),
        position_id: position_id,
        ooc_name: ooc_name.trim(),
        steam_hex: steam_hex.trim(),
        role: 'MEMBER',
        is_active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Silakan login.',
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
