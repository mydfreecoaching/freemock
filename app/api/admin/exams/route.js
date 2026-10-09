import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';

const on = (x) => x === 'on' || x === true || x === 'true';
/** action: save {id?, name, description, qcount, marks_per_q, negative_mark, unanswered_penalty, allow_e, weekly_analysis, progress, sort, active} | toggle {id} */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id) || null;
  if (b.action === 'toggle') { await sql`UPDATE exams SET active = NOT active WHERE id=${id}`; return Response.json({ reload: true }); }
  const v = {
    name: String(b.name || '').trim().slice(0, 150),
    description: String(b.description || '').trim().slice(0, 2000) || null,
    qcount: Number(b.qcount) > 0 ? Math.round(Number(b.qcount)) : null,
    marks_per_q: Number(b.marks_per_q) || 1.5,
    negative_mark: Math.max(0, Number(b.negative_mark) || 0),
    unanswered_penalty: Math.max(0, Number(b.unanswered_penalty ?? 2)),
    allow_e: on(b.allow_e),
    weekly_analysis: on(b.weekly_analysis),
    progress: on(b.progress),
    sort: Number(b.sort) || 0,
    active: on(b.active),
  };
  if (!v.name) return Response.json({ error: 'தேர்வின் பெயர் தேவை.' }, { status: 400 });
  if (id) await sql`UPDATE exams SET ${sql(v)} WHERE id=${id}`;
  else await sql`INSERT INTO exams ${sql({ ...v, code: 'x' + Date.now().toString(36) })}`;
  return Response.json({ message: 'சேமிக்கப்பட்டது.', reload: true });
}
