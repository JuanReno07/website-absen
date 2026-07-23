import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const positions = await prisma.position.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ positions });
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nama jabatan wajib diisi.' }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'CREATE_POSITION',
        table_name: 'positions',
        record_id: position.id,
        new_data: JSON.stringify({ name, description }),
      },
    });

    return NextResponse.json({ success: true, position });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, name, description, is_active } = body;

    const updated = await prisma.position.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim(),
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'UPDATE_POSITION',
        table_name: 'positions',
        record_id: id,
        new_data: JSON.stringify({ name, description, is_active }),
      },
    });

    return NextResponse.json({ success: true, position: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID jabatan wajib disertakan.' }, { status: 400 });
    }

    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!position) {
      return NextResponse.json({ error: 'Jabatan tidak ditemukan.' }, { status: 404 });
    }

    if (position._count.users > 0) {
      return NextResponse.json(
        {
          error: `Jabatan "${position.name}" tidak dapat dihapus karena masih digunakan oleh ${position._count.users} anggota. Pindahkan atau ubah jabatan anggota terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await prisma.position.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'DELETE_POSITION',
        table_name: 'positions',
        record_id: id,
        old_data: JSON.stringify({ name: position.name, description: position.description }),
      },
    });

    return NextResponse.json({ success: true, message: 'Jabatan berhasil dihapus.' });
  } catch (error: any) {
    console.error('Admin delete position error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
