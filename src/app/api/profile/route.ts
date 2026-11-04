import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isValidImageUpload } from '@/lib/storage';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { discord_name, ooc_name, current_password, new_password, avatar } = body;

    const updateData: any = {};

    if (discord_name) updateData.discord_name = String(discord_name).trim().slice(0, 80);
    if (ooc_name) updateData.ooc_name = String(ooc_name).trim().slice(0, 80);
    if (avatar !== undefined) {
      if (avatar === null || avatar === '') {
        updateData.avatar = null;
      } else if (typeof avatar === 'string' && isValidImageUpload(avatar, 5)) {
        updateData.avatar = avatar;
      } else {
        return NextResponse.json(
          { error: 'Format foto profil tidak valid atau ukuran terlalu besar.' },
          { status: 400 }
        );
      }
    }

    // Handle password change
    if (new_password) {
      if (
        typeof new_password !== 'string' ||
        new_password.length < 8 ||
        Buffer.byteLength(new_password, 'utf8') > 72
      ) {
        return NextResponse.json(
          { error: 'Password baru harus terdiri dari 8 hingga 72 byte (UTF-8).' },
          { status: 400 }
        );
      }
      if (
        !current_password ||
        typeof current_password !== 'string' ||
        Buffer.byteLength(current_password, 'utf8') > 72
      ) {
        return NextResponse.json(
          { error: 'Masukkan password lama Anda untuk mengubah password.' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Password lama Anda tidak sesuai.' },
          { status: 400 }
        );
      }

      updateData.password_hash = await bcrypt.hash(new_password, 10);
      updateData.session_version = { increment: 1 };
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: { position: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        discord_name: updatedUser.discord_name,
        ooc_name: updatedUser.ooc_name,
        steam_hex: updatedUser.steam_hex,
        position_name: updatedUser.position.name,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui profil.' }, { status: 500 });
  }
}
