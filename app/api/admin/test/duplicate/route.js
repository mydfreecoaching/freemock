import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { NO_END } from '@/lib/util';

/** Admin: copy a test's settings (exam, type, districts, subject, syllabus, marks, duration) into a new unpublished test – without questions. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const [t] = await sql`SELECT * FROM tests WHERE id=${Number(b.id)}`;
  if (!t) return Response.json({ error: 'தேர்வு கிடைக்கவில்லை.' }, { status: 404 });
  const { id, created_at, updated_at, ...v } = t; // eslint-disable-line no-unused-vars
  Object.assign(v, { title: `${t.title} (நகல்)`, published: false, start_at: new Date(), end_at: NO_END });
  const [n] = await sql`INSERT INTO tests ${sql(v)} RETURNING id`;
  return Response.json({ message: 'நகல் உருவாக்கப்பட்டது – தலைப்பு, தேதியைத் திருத்தி வினாக்களைப் பதிவேற்றவும்.', redirect: `/admin/test/${n.id}` });
}
