import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { offlineEligible, scoreLimits, checkCounts, applyVerified } from '@/lib/offline';
import { clearLbCache } from '@/lib/lb';

/**
 * Student: "I wrote this class test on paper at the office" – save / change correct, wrong and time taken; the mark is
 * calculated here (waits for office verification),
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
  if (o?.status === 'verified') return Response.json({ error: 'உங்கள் விவரம் ஏற்கனவே பதிவாகித் தரவரிசையில் சேர்க்கப்பட்டுவிட்டது. மாற்றம் தேவையெனில் அலுவலகத்தைத் தொடர்புகொள்ளவும்.' }, { status: 400 });
  if (b.action === 'cancel') {
    await sql`DELETE FROM offline_scores WHERE test_id=${id} AND student_id=${sid} AND status <> 'verified'`;
    return Response.json({ ok: true, reload: true });
  }
  const c = checkCounts(b, await scoreLimits(t));
  if (c.error) return Response.json({ error: c.error }, { status: 400 });
  // goes straight into the rankings – no office approval needed
  const [row] = await sql`INSERT INTO offline_scores (test_id, student_id, score, correct, wrong, minutes, status, verified_at) VALUES (${id}, ${sid}, ${c.score}, ${c.correct}, ${c.wrong}, ${c.minutes}, 'verified', now())
    ON CONFLICT (test_id, student_id) DO UPDATE SET score=EXCLUDED.score, correct=EXCLUDED.correct, wrong=EXCLUDED.wrong, minutes=EXCLUDED.minutes,
      status='verified', verified_at=now(), note=NULL, by_admin=false, updated_at=now()
    WHERE offline_scores.status <> 'verified' RETURNING *`;
  if (row) { await applyVerified(row, t); clearLbCache(); }
  return Response.json({ ok: true, reload: true, message: `பதிவு செய்யப்பட்டது – மதிப்பெண் ${c.score}. தரவரிசையில் சேர்க்கப்பட்டது.` });
}
