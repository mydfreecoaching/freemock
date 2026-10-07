import { checkAdminPassword, setAdmin } from '@/lib/auth';
export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  if (!process.env.ADMIN_PASSWORD) return Response.json({ error: 'ADMIN_PASSWORD அமைக்கப்படவில்லை (Vercel Environment Variables).' }, { status: 500 });
  if (!checkAdminPassword(String(password || ''))) return Response.json({ error: 'கடவுச்சொல் தவறு.' }, { status: 401 });
  await setAdmin();
  return Response.json({ redirect: '/admin' });
}
