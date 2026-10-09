import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { fromIST, cleanSyllabus, SYLLABUS_MISSING } from '@/lib/util';
import { getExam, countError, examMinutes } from '@/lib/exams';

export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || '').trim();
  if (!title) return Response.json({ error: 'தலைப்பு தேவை.' }, { status: 400 });
  if (!b.start_at || !b.end_at) return Response.json({ error: 'தொடக்க / முடிவு நேரம் தேவை.' }, { status: 400 });
  const start = fromIST(b.start_at), end = fromIST(b.end_at);
  if (!(end > start)) return Response.json({ error: 'முடிவு நேரம் தொடக்க நேரத்துக்குப் பின் இருக்க வேண்டும்.' }, { status: 400 });
  const ex = await getExam(b.kind);
  if (!ex) return Response.json({ error: 'தேர்வைத் (Available exam) தேர்வு செய்யவும்.' }, { status: 400 });
  const v = {
    title, start_at: start, end_at: end,
    duration_min: Math.max(1, Number(b.duration_min) || examMinutes(ex.qcount) || 180),
    marks_per_q: Number(b.marks_per_q) || 1.5,
    unanswered_penalty: Math.max(0, Number(b.unanswered_penalty ?? 2)),
    penalty_mode: Number(b.penalty_mode) === 2 ? 2 : 1,
    published: b.published === 'on' || b.published === true || b.published === 'true',
    kind: ex.code,
    negative_mark: Math.max(0, Number(b.negative_mark) || 0),
    allow_e: b.allow_e === 'on' || b.allow_e === true || b.allow_e === 'true',
    syllabus: cleanSyllabus(b.syllabus),
    subject: String(b.subject || '').trim().slice(0, 120) || null,
  };
  if (ex.code === 'subject' && !v.subject) return Response.json({ error: 'பாடத்தைத் (Subject) தேர்வு செய்யவும்.' }, { status: 400 });
  if (!v.syllabus) return Response.json({ error: SYLLABUS_MISSING }, { status: 400 });
  if (v.published) {
    const [{ n }] = b.id ? await sql`SELECT count(*)::int n FROM questions WHERE test_id=${Number(b.id)}` : [{ n: 0 }];
    if (!n) return Response.json({ error: 'வினாக்கள் பதிவேற்றிய பிறகே Published செய்யவும். இப்போது Published-ஐ நீக்கிச் சேமிக்கவும்.' }, { status: 400 });
    const e = countError(ex, n);
    if (e) return Response.json({ error: e + ' சரியான கோப்பைப் பதிவேற்றிய பிறகே Publish செய்யவும்.' }, { status: 400 });
  }
  if (b.id) {
    const [{ qn }] = await sql`SELECT count(*)::int qn FROM questions WHERE test_id=${Number(b.id)}`;
    v.duration_min = examMinutes(qn) || v.duration_min;
    await sql`UPDATE tests SET ${sql(v)} WHERE id=${Number(b.id)}`;
    // if the window was shortened, nobody may write past the new end time
    await sql`UPDATE attempts SET deadline=LEAST(deadline, ${end}) WHERE test_id=${Number(b.id)} AND submitted_at IS NULL`;
    return Response.json({ message: 'சேமிக்கப்பட்டது.', reload: true });
  }
  const [t] = await sql`INSERT INTO tests ${sql(v)} RETURNING id`;
  return Response.json({ redirect: `/admin/test/${t.id}?new=1` });
}
