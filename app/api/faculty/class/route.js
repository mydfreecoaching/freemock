import { sql } from '@/lib/db';
import { currentFaculty } from '@/lib/facultyGuard';
import { recordSession } from '@/lib/coaching';

/** Faculty records a class taken ({ course, day, slot, subject, topic }) or removes their own entry ({ delete: id }, within 2 days). */
export async function POST(req) {
  const f = await currentFaculty();
  if (!f) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.delete) {
    const [r] = await sql`DELETE FROM faculty_sessions WHERE id=${Number(b.delete)} AND faculty_id=${f.id} AND created_at > now() - interval '2 days' RETURNING id`;
    if (!r) return Response.json({ error: 'நீக்க இயலாது (2 நாட்களுக்கு மேல் ஆனவற்றை Admin மட்டுமே நீக்க முடியும்).' }, { status: 400 });
    return Response.json({ message: 'நீக்கப்பட்டது.', reload: true });
  }
  const r = await recordSession(f.id, b);
  if (r.error) return Response.json({ error: r.error }, { status: r.clash ? 409 : 400 });
  return Response.json({ message: '✅ வருகை பதிவு செய்யப்பட்டது.', reload: true });
}
