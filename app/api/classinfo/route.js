import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { PREFIX } from '@/lib/util';
import { attVenues } from '@/lib/attendance';
import { classSourceFields } from '@/lib/classSource';

/** Answer to the "free classes in your district" popup: { venue } to join a class venue, or { skip: true }. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const [s] = await sql`SELECT district FROM students WHERE id=${sid}`;
  const code = PREFIX[s?.district];
  if (b.venue) {
    if (!attVenues(code).some((v) => v.code === b.venue)) return Response.json({ error: 'பயிற்சி இடத்தைத் தேர்வு செய்யவும்.' }, { status: 400 });
    const cs = classSourceFields(b, b.venue);
    if (cs.error) return Response.json({ error: cs.error }, { status: 400 });
    await sql`UPDATE students SET coaching_venue=${b.venue}, class_info_at=now(), class_source=${cs.values.class_source}, class_source_other=${cs.values.class_source_other} WHERE id=${sid}`;
  } else await sql`UPDATE students SET class_info_at=now() WHERE id=${sid}`;
  return Response.json({ ok: true });
}
