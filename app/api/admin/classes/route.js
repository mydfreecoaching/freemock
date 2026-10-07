import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { CAT } from '@/lib/util';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);

/** action: save {id?, title, venue, scheme, category, days[], start_time, end_time, note, active, sort} | delete {id} | toggle {id} */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id) || null;
  if (b.action === 'delete') { await sql`DELETE FROM classes WHERE id=${id}`; return Response.json({ reload: true }); }
  if (b.action === 'toggle') { await sql`UPDATE classes SET active = NOT active WHERE id=${id}`; return Response.json({ reload: true }); }
  const v = {
    title: String(b.title || '').trim().slice(0, 200),
    venue: String(b.venue || '').trim().slice(0, 300),
    scheme: String(b.scheme || '').trim().slice(0, 200) || null,
    category: CAT[b.category] ? b.category : null,
    days: [...new Set(arr(b.days).map(Number).filter((d) => d >= 0 && d <= 6))].sort(),
    start_time: TIME.test(b.start_time || '') ? b.start_time : null,
    end_time: TIME.test(b.end_time || '') ? b.end_time : null,
    note: String(b.note || '').trim().slice(0, 1000) || null,
    active: b.active === 'on' || b.active === true || b.active === 'true',
    sort: Number(b.sort) || 0,
  };
  if (!v.title || !v.venue) return Response.json({ error: 'வகுப்பின் பெயர், இடம் தேவை.' }, { status: 400 });
  if (!v.days.length) return Response.json({ error: 'வகுப்பு நடக்கும் நாட்களைத் தேர்வு செய்யவும்.' }, { status: 400 });
  if (id) await sql`UPDATE classes SET ${sql(v)} WHERE id=${id}`;
  else await sql`INSERT INTO classes ${sql(v)}`;
  return Response.json({ message: 'சேமிக்கப்பட்டது.', reload: true });
}
