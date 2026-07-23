import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, settings }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        discord_name: user.discord_name,
        ooc_name: user.ooc_name,
        steam_hex: user.steam_hex,
        avatar: user.avatar,
        position_id: user.position_id,
        position_name: user.position.name,
      },
      settings,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ authenticated: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
