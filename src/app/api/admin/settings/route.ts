import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveScreenshotFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
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
  } catch (error) {
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
    if (company_name) updateData.company_name = company_name.trim();
    if (system_name) updateData.system_name = system_name.trim();
    if (primary_color) updateData.primary_color = primary_color;
    if (secondary_color) updateData.secondary_color = secondary_color;
    if (accent_color) updateData.accent_color = accent_color;
    if (theme_mode) updateData.theme_mode = theme_mode;
    if (require_duty_in_screenshot !== undefined) updateData.require_duty_in_screenshot = require_duty_in_screenshot;
    if (require_duty_out_screenshot !== undefined) updateData.require_duty_out_screenshot = require_duty_out_screenshot;
    if (system_active !== undefined) updateData.system_active = system_active;

    if (logo_base64) {
      const savedLogoPath = await saveScreenshotFile(logo_base64, 'brand', 'duty-in');
      updateData.logo = savedLogoPath;
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
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        table_name: 'system_settings',
        record_id: 'default',
        new_data: JSON.stringify(updateData),
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
