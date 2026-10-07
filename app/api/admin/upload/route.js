import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { parseUpload, saveQuestions, sectionSummary } from '@/lib/questions';

export async function POST(req) {
  const g = await guard(); if (g) return g;
  const fd = await req.formData();
  const id = Number(fd.get('test_id'));
  const file = fd.get('file');
  if (!id || !file || typeof file === 'string' || !file.size) return Response.json({ error: 'கோப்பைத் தேர்வு செய்யவும்.' }, { status: 400 });
  let r;
  try { r = await parseUpload(file); } catch (e) { return Response.json({ error: 'கோப்பைப் படிக்க இயலவில்லை: ' + e.message }, { status: 400 }); }
  if (r.errors.length) return Response.json({ error: 'பிழைகள்:\n' + r.errors.join('\n') }, { status: 400 });
  if (!r.questions.length) return Response.json({ error: 'வினாக்கள் இல்லை.' }, { status: 400 });
  await sql.begin((tx) => saveQuestions(tx, id, r.questions));
  return Response.json({ message: `${r.questions.length} வினாக்கள் பதிவேற்றப்பட்டன (${sectionSummary(r.questions)}).`, reload: true });
}
