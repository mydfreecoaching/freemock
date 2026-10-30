import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';

/** Admin printed / saved the forms: { ids } → mark printed and delete the stored signatures (not needed any more). */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const ids = [].concat(b.ids || []).map(Number).filter(Boolean).slice(0, 2000);
  if (!ids.length) return Response.json({ error: 'மாணவர்கள் இல்லை.' }, { status: 400 });
  await sql`UPDATE students SET sc_printed_at=now() WHERE id = ANY(${ids})`;
  const del = await sql`DELETE FROM student_signs WHERE student_id = ANY(${ids}) RETURNING student_id`;
  return Response.json({ ok: true, deleted: del.length });
}
