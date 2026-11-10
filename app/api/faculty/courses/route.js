import { sql } from '@/lib/db';
import { currentFaculty } from '@/lib/facultyGuard';
import { activeCourses } from '@/lib/coaching';

/** Faculty chooses the coaching classes they teach in (one or more). */
export async function POST(req) {
  const f = await currentFaculty();
  if (!f) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const open = (await activeCourses()).map((c) => c.id);
  const ids = [...new Set([].concat(b.courses || []).map(Number))].filter((id) => open.includes(id));
  if (!ids.length) return Response.json({ error: 'குறைந்தது ஒரு பயிற்சி வகுப்பைத் தேர்வு செய்யவும்.' }, { status: 400 });
  await sql`UPDATE faculty SET course_ids=${ids} WHERE id=${f.id}`;
  return Response.json({ message: 'சேமிக்கப்பட்டது.', reload: true });
}
