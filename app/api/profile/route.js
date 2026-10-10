import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { profileFields, venueFields, g4Fields } from '@/lib/profile';
import { parsePhoto, savePhoto } from '@/lib/photo';

export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const pf = profileFields(b);
  if (pf.error) return Response.json({ error: pf.error }, { status: 400 });
  const v = pf.values;
  const [st] = await sql`SELECT district FROM students WHERE id=${sid}`;
  const vf = venueFields(b, st?.district);
  if (vf.error) return Response.json({ error: vf.error }, { status: 400 });
  const gf = b.g4 ? g4Fields(b, true) : { values: null };
  if (gf.error) return Response.json({ error: gf.error }, { status: 400 });
  let ph = null;
  if (b.photo || b.photo_thumb) { ph = parsePhoto(b); if (ph.error) return Response.json({ error: ph.error }, { status: 400 }); }
  else { const [p] = await sql`SELECT 1 FROM student_photos WHERE student_id=${sid}`; if (!p) return Response.json({ error: parsePhoto({}).error }, { status: 400 }); }
  await sql`UPDATE students SET gender=${v.gender}, community=${v.community}, email=${v.email}, priority=${sql.json(v.priority)},
    priority_other=${v.priority_other}, qualification=${v.qualification} WHERE id=${sid}`;
  if (ph) await savePhoto(sid, ph);
  await sql`UPDATE students SET coaching_venue=${vf.values.coaching_venue}, guidance=${sql.json(vf.values.guidance)} WHERE id=${sid}`;
  if (gf.values) await sql`UPDATE students SET g4_applied=${gf.values.g4_applied}, g4_app_no=${gf.values.g4_app_no}, g4_at=now() WHERE id=${sid}`;
  const next = typeof b.next === 'string' && b.next.startsWith('/') && !b.next.startsWith('//') ? b.next : '/dashboard';
  return Response.json({ redirect: next });
}
