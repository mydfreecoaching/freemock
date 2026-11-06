import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { sessionsToRate } from '@/lib/coaching';

/** Student rates a class they attended: { session, clarity 1–5, teaching 1–5, comment }. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.session), c = Number(b.clarity), t = Number(b.teaching);
  if (!(c >= 1 && c <= 5) || !(t >= 1 && t <= 5)) return Response.json({ error: 'இரண்டு கேள்விகளுக்கும் பதில் அளிக்கவும்.' }, { status: 400 });
  if (!(await sessionsToRate(sid)).some((s) => s.id === id)) return Response.json({ error: 'இந்த வகுப்புக்குக் கருத்து தெரிவிக்க இயலாது (அன்று உங்கள் வருகை பதிவாகவில்லை அல்லது ஏற்கனவே தெரிவித்துவிட்டீர்கள்).' }, { status: 400 });
  await sql`INSERT INTO session_ratings (session_id, student_id, clarity, teaching, comment) VALUES (${id}, ${sid}, ${c}, ${t}, ${String(b.comment || '').trim().slice(0, 600) || null}) ON CONFLICT DO NOTHING`;
  return Response.json({ message: 'நன்றி! உங்கள் கருத்து பதிவாகியது.', reload: true });
}
