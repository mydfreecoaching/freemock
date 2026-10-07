import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { saveQuestions } from '@/lib/questions';
import { fromIST, CAT } from '@/lib/util';
/** approve: creates a new test from the submission (fields as in the test form). reject: {id, admin_note} */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const sid = Number(b.submission_id);
  const [s] = await sql`SELECT * FROM submissions WHERE id=${sid}`;
  if (!s) return Response.json({ error: 'கிடைக்கவில்லை' }, { status: 404 });
  if (s.status !== 'pending') return Response.json({ error: 'ஏற்கனவே முடிவு செய்யப்பட்டது.' }, { status: 409 });
  if (b.decision === 'reject') {
    await sql`UPDATE submissions SET status='rejected', admin_note=${String(b.admin_note || '').slice(0, 1000)}, reviewed_at=now() WHERE id=${sid}`;
    return Response.json({ redirect: '/admin/submissions' });
  }
  if (!b.start_at || !b.end_at) return Response.json({ error: 'தொடக்க / முடிவு நேரம் தேவை.' }, { status: 400 });
  const start = fromIST(b.start_at), end = fromIST(b.end_at);
  if (!(end > start)) return Response.json({ error: 'முடிவு நேரம் தொடக்க நேரத்துக்குப் பின் இருக்க வேண்டும்.' }, { status: 400 });
  const v = {
    title: String(b.title || s.title).trim(), start_at: start, end_at: end,
    duration_min: Math.max(1, Number(b.duration_min) || 20),
    marks_per_q: Number(b.marks_per_q) || 1,
    unanswered_penalty: Math.max(0, Number(b.unanswered_penalty ?? 0)),
    penalty_mode: Number(b.penalty_mode) === 2 ? 2 : 1,
    published: b.published === 'on' || b.published === true,
    category: CAT[b.category] ? b.category : s.category,
    kind: b.kind === 'full' ? 'full' : 'daily',
    negative_mark: Math.max(0, Number(b.negative_mark) || 0),
    allow_e: b.allow_e === 'on' || b.allow_e === true,
  };
  const testId = await sql.begin(async (tx) => {
    const [t] = await tx`INSERT INTO tests ${tx(v)} RETURNING id`;
    await saveQuestions(tx, t.id, s.questions);
    await tx`UPDATE submissions SET status='approved', test_id=${t.id}, admin_note=${String(b.admin_note || '').slice(0, 1000)}, reviewed_at=now() WHERE id=${sid}`;
    return t.id;
  });
  return Response.json({ redirect: `/admin/test/${testId}` });
}
