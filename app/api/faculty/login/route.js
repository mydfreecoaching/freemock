import { sql, ensureSchema } from '@/lib/db';
import { setFaculty, checkPassword } from '@/lib/auth';
export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const [f] = await sql`SELECT * FROM faculty WHERE mobile=${String(b.mobile || '').trim()}`;
  if (!f || !checkPassword(b.password || '', f.pass_hash)) return Response.json({ error: 'கைபேசி எண் அல்லது கடவுச்சொல் தவறு.' }, { status: 401 });
  if (!f.active) return Response.json({ error: 'உங்கள் கணக்கு முடக்கப்பட்டுள்ளது. Admin-ஐத் தொடர்பு கொள்ளவும்.' }, { status: 403 });
  await setFaculty(f.id);
  return Response.json({ redirect: '/faculty' });
}
