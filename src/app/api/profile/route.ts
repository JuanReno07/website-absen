import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { discord_name, ooc_name, current_password, new_password, avatar } = body;

    const updateData: any = {};

    if (discord_name) updateData.discord_name = discord_name.trim();
    if (ooc_name) updateData.ooc_name = ooc_name.trim();
    if (avatar !== undefined) updateData.avatar = avatar;

    // Handle password change
    if (new_password) {
      if (!current_password) {
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
