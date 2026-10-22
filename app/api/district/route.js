import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { PREFIX } from '@/lib/util';

/** "இதர" (Others) student saves the district they typed (asked after login). */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const v = String(b.district_other || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (v.length < 2) return Response.json({ error: 'மாவட்டத்தின் பெயரை உள்ளிடவும் / Type your district.' }, { status: 400 });
  const [s] = await sql`SELECT district FROM students WHERE id=${sid}`;
  if (PREFIX[s?.district] !== 'OTH') return Response.json({ ok: true });
  await sql`UPDATE students SET district_other=${v} WHERE id=${sid}`;
  return Response.json({ ok: true });
}
