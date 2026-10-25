import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { studyFields } from '@/lib/study';

/** Student saves where / how they study (asked after login). */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const f = studyFields(await req.json().catch(() => ({})));
  if (f.error) return Response.json({ error: f.error }, { status: 400 });
  await sql`UPDATE students SET study_place=${f.values.study_place}, study_note=${f.values.study_note}, study_exams=${f.values.study_exams}, study_exam_other=${f.values.study_exam_other} WHERE id=${sid}`;
  return Response.json({ ok: true });
}
