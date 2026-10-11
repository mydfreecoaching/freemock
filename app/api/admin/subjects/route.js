import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';

/** Admin: add / edit (rename also updates the tests using it) / show-hide a subject. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id) || null;
  if (b.action === 'toggle') { await sql`UPDATE subjects SET active = NOT active WHERE id=${id}`; return Response.json({ reload: true }); }
  const name = String(b.name || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  if (name.length < 2) return Response.json({ error: 'பாடத்தின் பெயர் தேவை.' }, { status: 400 });
  const description = String(b.description || '').trim().slice(0, 1000) || null;
  const sort = Number(b.sort) || 100;
  const [dup] = await sql`SELECT id FROM subjects WHERE lower(name)=lower(${name}) AND id IS DISTINCT FROM ${id}`;
  if (dup) return Response.json({ error: 'இந்தப் பெயரில் ஏற்கனவே பாடம் உள்ளது.' }, { status: 400 });
  if (id) {
    const [old] = await sql`SELECT name FROM subjects WHERE id=${id}`;
    await sql`UPDATE subjects SET name=${name}, description=${description}, sort=${sort} WHERE id=${id}`;
    if (old && old.name !== name) await sql`UPDATE tests SET subject=${name} WHERE subject=${old.name}`;
  } else await sql`INSERT INTO subjects (name, description, sort) VALUES (${name}, ${description}, ${sort})`;
  return Response.json({ message: 'சேமிக்கப்பட்டது.', reload: true });
}
