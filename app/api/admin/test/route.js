import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { fromIST, CAT } from '@/lib/util';

export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || '').trim();
  if (!title) return Response.json({ error: 'தலைப்பு தேவை.' }, { status: 400 });
  if (!b.start_at || !b.end_at) return Response.json({ error: 'தொடக்க / முடிவு நேரம் தேவை.' }, { status: 400 });
  const start = fromIST(b.start_at), end = fromIST(b.end_at);
  if (!(end > start)) return Response.json({ error: 'முடிவு நேரம் தொடக்க நேரத்துக்குப் பின் இருக்க வேண்டும்.' }, { status: 400 });
  const v = {
    title, start_at: start, end_at: end,
    duration_min: Math.max(1, Number(b.duration_min) || 180),
    marks_per_q: Number(b.marks_per_q) || 1.5,
    unanswered_penalty: Math.max(0, Number(b.unanswered_penalty ?? 2)),
    penalty_mode: Number(b.penalty_mode) === 2 ? 2 : 1,
    published: b.published === 'on' || b.published === true || b.published === 'true',
    category: CAT[b.category] ? b.category : 'TNPSC_G2',
    kind: b.kind === 'daily' ? 'daily' : 'full',
    negative_mark: Math.max(0, Number(b.negative_mark) || 0),
    allow_e: b.allow_e === 'on' || b.allow_e === true || b.allow_e === 'true',
  };
  if (b.id) {
    await sql`UPDATE tests SET ${sql(v)} WHERE id=${Number(b.id)}`;
    // if the window was shortened, nobody may write past the new end time
    await sql`UPDATE attempts SET deadline=LEAST(deadline, ${end}) WHERE test_id=${Number(b.id)} AND submitted_at IS NULL`;
    return Response.json({ message: 'சேமிக்கப்பட்டது.', reload: true });
  }
  const [t] = await sql`INSERT INTO tests ${sql(v)} RETURNING id`;
  return Response.json({ redirect: `/admin/test/${t.id}` });
}
