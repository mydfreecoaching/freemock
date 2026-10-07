import { sql } from '@/lib/db';
import { currentFaculty } from '@/lib/facultyGuard';
import { parseUpload, sectionSummary } from '@/lib/questions';
import { CAT, cleanSyllabus, SYLLABUS_MISSING, normKind, countError } from '@/lib/util';
export async function POST(req) {
  const f = await currentFaculty();
  if (!f) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const fd = await req.formData();
  const category = String(fd.get('category') || '');
  const kind = normKind(fd.get('kind'), 'g2_daily');
  const title = String(fd.get('title') || '').trim().slice(0, 150);
  const note = String(fd.get('note') || '').trim().slice(0, 1000);
  const syllabus = cleanSyllabus(fd.get('syllabus'));
  const file = fd.get('file');
  if (!CAT[category]) return Response.json({ error: 'தேர்வுப் பிரிவைத் தேர்வு செய்யவும்.' }, { status: 400 });
  if (!title) return Response.json({ error: 'தலைப்பு தேவை.' }, { status: 400 });
  if (!syllabus) return Response.json({ error: SYLLABUS_MISSING }, { status: 400 });
  if (!file || typeof file === 'string' || !file.size) return Response.json({ error: 'Excel கோப்பைத் தேர்வு செய்யவும்.' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: 'கோப்பு 5 MB-க்குள் இருக்க வேண்டும்.' }, { status: 400 });
  let r;
  try { r = await parseUpload(file); } catch (e) { return Response.json({ error: 'கோப்பைப் படிக்க இயலவில்லை: ' + e.message }, { status: 400 }); }
  if (r.errors.length) return Response.json({ error: 'பிழைகளைச் சரிசெய்து மீண்டும் பதிவேற்றவும்:\n' + r.errors.join('\n') }, { status: 400 });
  if (!r.questions.length) return Response.json({ error: 'வினாக்கள் இல்லை.' }, { status: 400 });
  const ce = countError(category, kind, r.questions.length);
  if (ce) return Response.json({ error: ce }, { status: 400 });
  await sql`INSERT INTO submissions (faculty_id, category, kind, title, note, syllabus, questions, n)
    VALUES (${f.id}, ${category}, ${kind}, ${title}, ${note}, ${syllabus}, ${sql.json(r.questions)}, ${r.questions.length})`;
  return Response.json({ message: `${r.questions.length} வினாக்கள் (${sectionSummary(r.questions)}) Admin ஒப்புதலுக்கு அனுப்பப்பட்டன.`, reload: true });
}
