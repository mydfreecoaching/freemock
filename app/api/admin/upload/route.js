import { sql } from '@/lib/db';
import { getExam, countError, examMinutes } from '@/lib/exams';
import { guard } from '@/lib/adminGuard';
import { parseUpload, saveQuestions, sectionSummary } from '@/lib/questions';

export async function POST(req) {
  const g = await guard(); if (g) return g;
  const fd = await req.formData();
  const id = Number(fd.get('test_id'));
  const file = fd.get('file');
  if (!id || !file || typeof file === 'string' || !file.size) return Response.json({ error: 'கோப்பைத் தேர்வு செய்யவும்.' }, { status: 400 });
  const [t] = await sql`SELECT syllabus, kind FROM tests WHERE id=${id}`;
  if (!t) return Response.json({ error: 'தேர்வு இல்லை.' }, { status: 404 });
  if (!t.syllabus) return Response.json({ error: 'முதலில் இடப்புறம் உள்ள "அமைப்புகள்"-இல் பாடத்திட்டத்தை (Syllabus) உள்ளிட்டுச் சேமிக்கவும்; பிறகு வினாக்களைப் பதிவேற்றவும்.' }, { status: 400 });
  let r;
  try { r = await parseUpload(file); } catch (e) { return Response.json({ error: 'கோப்பைப் படிக்க இயலவில்லை: ' + e.message }, { status: 400 }); }
  if (r.errors.length) return Response.json({ error: 'பிழைகள்:\n' + r.errors.join('\n') }, { status: 400 });
  if (!r.questions.length) return Response.json({ error: 'வினாக்கள் இல்லை.' }, { status: 400 });
  const ce = countError(await getExam(t.kind), r.questions.length);
  if (ce) return Response.json({ error: ce }, { status: 400 });
  const mins = examMinutes(r.questions.length);
  await sql.begin(async (tx) => {
    await saveQuestions(tx, id, r.questions);
    if (mins) await tx`UPDATE tests SET duration_min=${mins} WHERE id=${id}`;
  });
  return Response.json({ message: `${r.questions.length} வினாக்கள் பதிவேற்றப்பட்டன (${sectionSummary(r.questions)}).${mins ? ` தேர்வு நேரம்: ${mins} நிமிடம்.` : ''}`, reload: true });
}
