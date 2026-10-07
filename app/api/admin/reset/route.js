import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
/** Delete one student's attempt so they can write again (e.g. technical problem). */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const r = await sql`DELETE FROM attempts a USING students s WHERE a.student_id=s.id AND a.test_id=${Number(b.test_id)} AND ${String(b.reg_no || '').trim().toUpperCase()} IN (s.reg_no, s.old_reg_no) RETURNING a.id`;
  if (!r.length) return Response.json({ error: 'அந்தப் பதிவு எண்ணுக்கு இத்தேர்வில் விடைத்தாள் இல்லை.' }, { status: 404 });
  return Response.json({ message: 'நீக்கப்பட்டது – அவர் மீண்டும் எழுதலாம் (தேர்வு நேரம் திறந்திருந்தால்).', reload: true });
}
