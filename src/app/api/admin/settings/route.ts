import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getClientIp } from '@/lib/device-parser';
import { isValidImageUpload } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' },
    });
    return NextResponse.json(
      { settings },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED' || error?.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const {
      company_name,
      system_name,
      logo_base64,
      primary_color,
      secondary_color,
      accent_color,
      theme_mode,
      require_duty_in_screenshot,
      require_duty_out_screenshot,
      system_active,
    } = body;

    const updateData: any = {};
    if (company_name) updateData.company_name = String(company_name).trim().slice(0, 100);
    if (system_name) updateData.system_name = String(system_name).trim().slice(0, 120);
    if (primary_color) updateData.primary_color = String(primary_color).trim().slice(0, 20);
    if (secondary_color) updateData.secondary_color = String(secondary_color).trim().slice(0, 20);
    if (accent_color) updateData.accent_color = String(accent_color).trim().slice(0, 20);
    if (theme_mode) updateData.theme_mode = theme_mode;
    if (require_duty_in_screenshot !== undefined) updateData.require_duty_in_screenshot = require_duty_in_screenshot;
    if (require_duty_out_screenshot !== undefined) updateData.require_duty_out_screenshot = require_duty_out_screenshot;
    if (system_active !== undefined) updateData.system_active = system_active;

    // Directly store Data URL for 100% Vercel & Cloud serverless image persistence
    if (logo_base64) {
      if (!isValidImageUpload(logo_base64, 5)) {
        return NextResponse.json(
          { error: 'Format logo tidak valid atau melebihi batas ukuran 5MB.' },
          { status: 400 }
        );
      }
      updateData.logo = logo_base64;
    }

    const updated = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData,
      },
    });

    // Record Audit Log
    const { logo: _logoOmit, ...auditUpdateSummary } = updateData;
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        table_name: 'system_settings',
        record_id: 'default',
        new_data: JSON.stringify({
          ...auditUpdateSummary,
          ...(logo_base64 ? { logo_updated: true } : {}),
        }),
        ip_address: getClientIp(request),
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json(
      { success: true, settings: updated },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message || 'Error updating settings' }, { status: 500 });
  }
}
