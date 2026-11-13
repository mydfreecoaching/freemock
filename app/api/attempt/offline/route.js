import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { offlineEligible, scoreLimits, checkScore } from '@/lib/offline';

/**
 * Student: "I wrote this class test on paper at the office" – save / change the total mark (waits for office verification),
 * or cancel it (only while not verified) to write online instead.
 */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.testId);
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  const [me] = await sql`SELECT district FROM students WHERE id=${sid}`;
  if (!t || !offlineEligible(t, me?.district)) return Response.json({ error: 'இத்தேர்வுக்கு நேரடித் தேர்வு மதிப்பெண் உள்ளிட இயலாது.' }, { status: 400 });
  const [a] = await sql`SELECT offline, submitted_at FROM attempts WHERE test_id=${id} AND student_id=${sid}`;
  if (a && !a.offline) return Response.json({ error: 'இத்தேர்வை ஏற்கனவே இணையவழியில் தொடங்கிவிட்டீர்கள் / எழுதிவிட்டீர்கள்.' }, { status: 400 });
  const [o] = await sql`SELECT * FROM offline_scores WHERE test_id=${id} AND student_id=${sid}`;
  if (o?.status === 'verified') return Response.json({ error: 'உங்கள் மதிப்பெண் ஏற்கனவே சரிபார்க்கப்பட்டுவிட்டது. மாற்றம் தேவையெனில் அலுவலகத்தைத் தொடர்புகொள்ளவும்.' }, { status: 400 });
  if (b.action === 'cancel') {
    await sql`DELETE FROM offline_scores WHERE test_id=${id} AND student_id=${sid} AND status <> 'verified'`;
    return Response.json({ ok: true, reload: true });
  }
  const c = checkScore(b.score, await scoreLimits(t));
  if (c.error) return Response.json({ error: c.error }, { status: 400 });
  await sql`INSERT INTO offline_scores (test_id, student_id, score) VALUES (${id}, ${sid}, ${c.score})
    ON CONFLICT (test_id, student_id) DO UPDATE SET score=EXCLUDED.score, status='pending', note=NULL, by_admin=false, updated_at=now()
    WHERE offline_scores.status <> 'verified'`;
  return Response.json({ ok: true, reload: true, message: 'மதிப்பெண் பதிவு செய்யப்பட்டது. அலுவலகம் விடைத்தாளுடன் சரிபார்த்ததும் தரவரிசையில் சேர்க்கப்படும்.' });
}
