import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (e) {
    console.error('HomePage auth check error:', e);
  }

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
