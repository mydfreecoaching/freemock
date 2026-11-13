import { guard } from '@/lib/adminGuard';
import { sql } from '@/lib/db';
import { scoreLimits, checkScore, applyVerified, dropOfflineAttempt } from '@/lib/offline';
import { clearLbCache } from '@/lib/lb';

/** Admin: verify / correct / reject / delete paper-test marks, add one directly, or verify all pending of a test. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const done = (message) => { clearLbCache(); return Response.json({ message, reload: true }); };
  const bad = (error) => Response.json({ error }, { status: 400 });

  if (b.action === 'add') {
    const [t] = await sql`SELECT * FROM tests WHERE id=${Number(b.test_id)}`;
    if (!t) return bad('தேர்வு இல்லை.');
    const reg = String(b.reg_no || '').trim().toUpperCase();
    const [s] = await sql`SELECT id, name FROM students WHERE ${reg} IN (reg_no, old_reg_no) OR mobile=${reg} LIMIT 1`;
    if (!s) return bad('இந்தப் பதிவு எண் / கைபேசி எண்ணில் மாணவர் இல்லை.');
    const c = checkScore(b.score, await scoreLimits(t));
    if (c.error) return bad(c.error);
    const [a] = await sql`SELECT offline FROM attempts WHERE test_id=${t.id} AND student_id=${s.id}`;
    if (a && !a.offline) return bad(`${s.name} இத்தேர்வை ஏற்கனவே இணையவழியில் எழுதியுள்ளார் – நேரடி மதிப்பெண் சேர்க்க முதலில் அந்த விடைத்தாளை நீக்கவும்.`);
    const [o] = await sql`INSERT INTO offline_scores (test_id, student_id, score, status, by_admin, verified_at) VALUES (${t.id}, ${s.id}, ${c.score}, 'verified', true, now())
      ON CONFLICT (test_id, student_id) DO UPDATE SET score=EXCLUDED.score, status='verified', by_admin=true, note=NULL, verified_at=now(), updated_at=now() RETURNING *`;
    await applyVerified(o, t);
    return done(`${s.name} – ${c.score} மதிப்பெண் சேர்க்கப்பட்டு தரவரிசையில் இணைக்கப்பட்டது.`);
  }

  if (b.action === 'verifyAll') {
    const list = await sql`SELECT o.*, t.duration_min FROM offline_scores o JOIN tests t ON t.id=o.test_id WHERE o.status='pending' AND o.test_id=${Number(b.test_id)}`;
    let n = 0, skip = 0;
    for (const o of list) {
      const [a] = await sql`SELECT offline FROM attempts WHERE test_id=${o.test_id} AND student_id=${o.student_id}`;
      if (a && !a.offline) { skip++; continue; }
      await sql`UPDATE offline_scores SET status='verified', verified_at=now(), updated_at=now() WHERE id=${o.id}`;
      await applyVerified(o, o); n++;
    }
    return done(`${n} மதிப்பெண்கள் சரிபார்க்கப்பட்டன${skip ? ` (${skip} பேர் ஏற்கனவே இணையவழியில் எழுதியதால் தவிர்க்கப்பட்டது)` : ''}.`);
  }

  const [o] = await sql`SELECT o.*, t.duration_min FROM offline_scores o JOIN tests t ON t.id=o.test_id WHERE o.id=${Number(b.id)}`;
  if (!o) return bad('பதிவு இல்லை.');
  if (b.action === 'verify') {
    const [t] = await sql`SELECT * FROM tests WHERE id=${o.test_id}`;
    let score = Number(o.score);
    if (b.score !== undefined && String(b.score).trim() !== '') { const c = checkScore(b.score, await scoreLimits(t)); if (c.error) return bad(c.error); score = c.score; }
    const [a] = await sql`SELECT offline FROM attempts WHERE test_id=${o.test_id} AND student_id=${o.student_id}`;
    if (a && !a.offline) return bad('இந்த மாணவர் இத்தேர்வை இணையவழியிலும் எழுதியுள்ளார் – இணையவழி மதிப்பெண்ணே கணக்கில் கொள்ளப்படும்.');
    const [u] = await sql`UPDATE offline_scores SET score=${score}, status='verified', note=NULL, verified_at=now(), updated_at=now() WHERE id=${o.id} RETURNING *`;
    await applyVerified(u, t);
    return done(`சரிபார்க்கப்பட்டது – ${score} மதிப்பெண் தரவரிசையில் சேர்க்கப்பட்டது.`);
  }
  if (b.action === 'reject') {
    await sql`UPDATE offline_scores SET status='rejected', note=${String(b.note || '').trim().slice(0, 200) || null}, verified_at=NULL, updated_at=now() WHERE id=${o.id}`;
    await dropOfflineAttempt(o.test_id, o.student_id);
    return done('நிராகரிக்கப்பட்டது – தரவரிசையிலிருந்து நீக்கப்பட்டது. மாணவர் மீண்டும் சரியான மதிப்பெண்ணை உள்ளிடலாம் அல்லது இணையவழியில் எழுதலாம்.');
  }
  if (b.action === 'delete') {
    await sql`DELETE FROM offline_scores WHERE id=${o.id}`;
    await dropOfflineAttempt(o.test_id, o.student_id);
    return done('நீக்கப்பட்டது. மாணவர் இத்தேர்வை இணையவழியில் எழுதலாம்.');
  }
  return bad('தெரியாத செயல்.');
}
