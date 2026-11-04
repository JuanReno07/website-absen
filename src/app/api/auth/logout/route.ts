import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyJwt } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const payload = verifyJwt(token);
      if (payload?.token_id) {
        await prisma.userSession.updateMany({
          where: { token_id: payload.token_id },
          data: { is_active: false },
        });
      }
    }
  } catch (error) {
    console.error('Logout session cleanup error:', error);
  }

  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
