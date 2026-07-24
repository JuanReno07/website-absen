import { NextResponse } from 'next/server';
import { getCurrentUser, COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let settings = null;
  let user = null;

  try {
    user = await getCurrentUser();
  } catch (e) {
    console.error('Error fetching current user:', e);
  }

  try {
    settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' },
    });
  } catch (e) {
    console.error('Error fetching system settings:', e);
  }

  if (!settings) {
    settings = {
      company_name: 'ASE GROUP',
      system_name: 'ASE Duty Attendance System',
      logo: '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
      primary_color: '#DC2626',
      secondary_color: '#1E293B',
      accent_color: '#EF4444',
      theme_mode: 'BRANDED',
    } as any;
  }

  if (!user) {
    const response = NextResponse.json({ authenticated: false, settings }, { status: 200 });
    // Clear stale or invalid session cookie automatically
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
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
      position_name: user.position?.name || 'Anggota',
    },
    settings,
  });
}
