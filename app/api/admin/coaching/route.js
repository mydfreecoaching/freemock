import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { courseFields } from '@/lib/coaching';

/** Admin: course create / update / toggle / delete; delete a faculty class entry; mark clashes seen. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id) || 0;
  if (b.action === 'save') {
    const f = courseFields(b);
    if (f.error) return Response.json({ error: f.error }, { status: 400 });
    const v = f.values;
    if (id) await sql`UPDATE coaching_courses SET name=${v.name}, place=${v.place}, district=${v.district}, days=${v.days}, slots=${sql.json(v.slots)}, start_date=${v.start_date}, end_date=${v.end_date}, note=${v.note} WHERE id=${id}`;
    else await sql`INSERT INTO coaching_courses (name, place, district, days, slots, start_date, end_date, note) VALUES (${v.name}, ${v.place}, ${v.district}, ${v.days}, ${sql.json(v.slots)}, ${v.start_date}, ${v.end_date}, ${v.note})`;
    return Response.json({ message: id ? 'மாற்றங்கள் சேமிக்கப்பட்டன.' : 'பயிற்சி வகுப்பு சேர்க்கப்பட்டது.', reload: true });
  }
  if (b.action === 'toggle') { await sql`UPDATE coaching_courses SET active = NOT active WHERE id=${id}`; return Response.json({ reload: true }); }
  if (b.action === 'delete') {
    const [{ n }] = await sql`SELECT count(*)::int n FROM faculty_sessions WHERE course_id=${id}`;
    if (n) return Response.json({ error: `இந்த வகுப்பில் ${n} வருகைப் பதிவுகள் உள்ளன – நீக்குவதற்குப் பதில் "நிறுத்து" அழுத்தவும்.` }, { status: 400 });
    await sql`DELETE FROM coaching_courses WHERE id=${id}`;
    return Response.json({ reload: true });
  }
  if (b.action === 'del_session') { await sql`DELETE FROM faculty_sessions WHERE id=${id}`; return Response.json({ message: 'நீக்கப்பட்டது.', reload: true }); }
  if (b.action === 'clash_seen') { await sql`UPDATE faculty_session_clashes SET seen=true WHERE NOT seen`; return Response.json({ reload: true }); }
  return Response.json({ error: 'தவறான கோரிக்கை.' }, { status: 400 });
}
