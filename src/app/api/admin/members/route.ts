import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET all members
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const position_id = searchParams.get('position_id') || '';
    const role = searchParams.get('role') || '';
    const is_active = searchParams.get('is_active');

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { discord_name: { contains: search } },
        { ooc_name: { contains: search } },
        { steam_hex: { contains: search } },
      ];
    }

    if (position_id && position_id !== 'ALL') {
      where.position_id = position_id;
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (is_active !== null && is_active !== undefined && is_active !== 'ALL') {
      where.is_active = is_active === 'true';
    }

    const members = await prisma.user.findMany({
      where,
      include: { position: true },
      orderBy: { created_at: 'desc' },
    });

    const positions = await prisma.position.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({ members, positions });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    console.error('Admin GET members error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create member
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { username, password, discord_name, position_id, ooc_name, steam_hex, role } = body;

    if (!username || !password || !discord_name || !position_id || !ooc_name || !steam_hex) {
      return NextResponse.json({ error: 'Seluruh data wajib diisi.' }, { status: 400 });
    }

    // Unique Steam Hex check
    const existingSteam = await prisma.user.findUnique({ where: { steam_hex: steam_hex.trim() } });
    if (existingSteam) {
      return NextResponse.json({ error: 'Steam Hex sudah digunakan oleh pengguna lain.' }, { status: 400 });
    }

    // Unique Username check
    const existingUsername = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 400 });
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
        role: role || 'MEMBER',
        is_active: true,
      },
      include: { position: true },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'CREATE_MEMBER',
        table_name: 'users',
        record_id: newUser.id,
        new_data: JSON.stringify({ username, discord_name, role, steam_hex }),
      },
    });

    return NextResponse.json({ success: true, member: newUser });
  } catch (error: any) {
    console.error('Admin POST member error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT edit member
export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, username, discord_name, position_id, ooc_name, steam_hex, role, is_active, new_password } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const updateData: any = {};
    if (username) updateData.username = username.trim();
    if (discord_name) updateData.discord_name = discord_name.trim();
    if (position_id) updateData.position_id = position_id;
    if (ooc_name) updateData.ooc_name = ooc_name.trim();
    if (steam_hex) updateData.steam_hex = steam_hex.trim();
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (new_password) {
      updateData.password_hash = await bcrypt.hash(new_password, 10);
    }

    const updatedMember = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { position: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'UPDATE_MEMBER',
        table_name: 'users',
        record_id: id,
        old_data: JSON.stringify({
          discord_name: existingUser.discord_name,
          role: existingUser.role,
          is_active: existingUser.is_active,
        }),
        new_data: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error: any) {
    console.error('Admin PUT member error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE member
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib disertakan.' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (id === admin.id) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan.' }, { status: 404 });
    }

    // Delete related audit logs first (no cascade on this relation)
    await prisma.auditLog.deleteMany({ where: { admin_id: id } });

    // Delete the user (attendances and leave_requests cascade automatically)
    await prisma.user.delete({ where: { id } });

    // Record Audit Log for this deletion
    await prisma.auditLog.create({
      data: {
        admin_id: admin.id,
        action: 'DELETE_MEMBER',
        table_name: 'users',
        record_id: id,
        old_data: JSON.stringify({
          username: existingUser.username,
          discord_name: existingUser.discord_name,
          ooc_name: existingUser.ooc_name,
          steam_hex: existingUser.steam_hex,
          role: existingUser.role,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin DELETE member error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
