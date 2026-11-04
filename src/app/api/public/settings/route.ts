import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [settings, positions] = await Promise.all([
      prisma.systemSettings.findFirst({
        where: { id: 'default' },
      }),
      prisma.position.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    if (!settings) {
      return NextResponse.json({
        company_name: 'ASE GROUP',
        system_name: 'ASE Duty Attendance System',
        logo: '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
        favicon: '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
        primary_color: '#DC2626',
        secondary_color: '#1E293B',
        accent_color: '#EF4444',
        theme_mode: 'BRANDED',
        positions,
      });
    }

    return NextResponse.json(
      {
        ...settings,
        positions,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Public settings fetch error:', error);
    return NextResponse.json({
      company_name: 'ASE GROUP',
      system_name: 'ASE Duty Attendance System',
      logo: '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
      favicon: '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png',
      positions: [],
    });
  }
}
