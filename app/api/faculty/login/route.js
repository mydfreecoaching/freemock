import { sql, ensureSchema } from '@/lib/db';
import { setFaculty, checkPassword } from '@/lib/auth';
export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const [f] = await sql`SELECT * FROM faculty WHERE mobile=${String(b.mobile || '').trim()}`;
  if (!f || !checkPassword(b.password || '', f.pass_hash)) return Response.json({ error: 'கைபேசி எண் அல்லது கடவுச்சொல் தவறு.' }, { status: 401 });
  if (f.status === 'pending') return Response.json({ error: '⏳ உங்கள் பதிவு Admin ஒப்புதலுக்காகக் காத்திருக்கிறது. ஒப்புதல் கிடைத்த பின் உள்நுழையலாம்.' }, { status: 403 });
  if (f.status === 'rejected') return Response.json({ error: `உங்கள் பதிவு ஏற்கப்படவில்லை.${f.reject_note ? ` காரணம்: ${f.reject_note}` : ''} விவரங்களுக்கு Admin-ஐத் தொடர்பு கொள்ளவும்.` }, { status: 403 });
  if (!f.active) return Response.json({ error: 'உங்கள் கணக்கு முடக்கப்பட்டுள்ளது. Admin-ஐத் தொடர்பு கொள்ளவும்.' }, { status: 403 });
  await setFaculty(f.id);
  return Response.json({ redirect: '/faculty' });
}
