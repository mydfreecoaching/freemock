import { sql } from './db';
import { PREFIX, testStatus } from './util';

/**
 * Class tests written on paper at the DECGC office (Mayiladuthurai / Thiruvarur students).
 * Before starting, the student says whether they wrote it at the office; if so they enter only the total mark.
 * The mark waits in offline_scores (status 'pending') until the office checks it against the answer sheet and verifies it.
 * Verifying creates a normal submitted attempt (offline = true) so it joins every rank list, leaderboard and report;
 * pending / rejected marks never count. Admin can also enter a mark directly (verified at once).
 */

export const OFFLINE_DISTRICTS = ['MYD', 'TVR'];
export const OFFLINE_DAYS_AFTER = 7; // students can still report a paper test this many days after the online window closes
export const STATUS_LABEL = { pending: 'சரிபார்ப்பில்', verified: 'சரிபார்க்கப்பட்டது', rejected: 'நிராகரிக்கப்பட்டது' };

/** Is the offline option offered to this student for this test? */
export function offlineEligible(t, district) {
  if (!t || t.ttype !== 'class' || !OFFLINE_DISTRICTS.includes(PREFIX[district])) return false;
  const st = testStatus(t);
  if (st === 'open') return true;
  return st === 'closed' && Date.now() < new Date(t.end_at).getTime() + OFFLINE_DAYS_AFTER * 864e5;
}

/** Score limits for a test: [min, max]. Negative marking lets the total go below zero. */
export async function scoreLimits(t) {
  const [{ n }] = await sql`SELECT count(*)::int n FROM questions WHERE test_id=${t.id}`;
  const per = Number(t.marks_per_q) || 1;
  const neg = Number(t.negative_mark) || 0, pen = Number(t.unanswered_penalty) || 0;
  return { n, max: n * per, min: -n * Math.max(neg, pen), step: per };
}

export function checkScore(v, lim) {
  const x = Number(String(v ?? '').trim());
  if (String(v ?? '').trim() === '' || !Number.isFinite(x)) return { error: 'மொத்த மதிப்பெண்ணை எண்ணாக உள்ளிடவும்.' };
  if (x > lim.max || x < lim.min) return { error: `மதிப்பெண் ${lim.min} முதல் ${lim.max} வரை மட்டுமே இருக்க முடியும்.` };
  return { score: Math.round(x * 100) / 100 };
}

/** Turn a verified mark into a submitted attempt (or update it). */
export async function applyVerified(o, t) {
  const dur = Math.max(1, Number(t.duration_min) || 60);
  const at = new Date(o.created_at);
  const start = new Date(at.getTime() - dur * 60000); // counted as the full time – no time advantage in ties
  await sql`INSERT INTO attempts (test_id, student_id, started_at, deadline, submitted_at, answers, score, correct, wrong, e_count, unanswered, section_scores, end_reason, offline)
    VALUES (${o.test_id}, ${o.student_id}, ${start}, ${at}, ${at}, '{}', ${o.score}, NULL, NULL, NULL, NULL, NULL, 'offline', true)
    ON CONFLICT (test_id, student_id) DO UPDATE SET score=EXCLUDED.score WHERE attempts.offline`;
}

/** Remove the attempt made from an offline mark (rejected / deleted / un-verified). Online attempts are never touched. */
export const dropOfflineAttempt = (testId, studentId) => sql`DELETE FROM attempts WHERE test_id=${testId} AND student_id=${studentId} AND offline`;

/** Admin list with filters: { test, status, district, venue, q, from, to }. */
export async function offlineList(f = {}) {
  return sql`SELECT o.*, s.reg_no, s.name, s.mobile, s.district, s.coaching_venue, t.title, t.unit, t.kind,
      (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int * t.marks_per_q AS max
    FROM offline_scores o JOIN students s ON s.id=o.student_id JOIN tests t ON t.id=o.test_id
    WHERE (${Number(f.test) || 0}::int = 0 OR o.test_id = ${Number(f.test) || 0})
      AND (${f.status || ''} = '' OR o.status = ${f.status || ''})
      AND (${f.district || ''} = '' OR s.district = ${f.district || ''})
      AND (${f.venue || ''} = '' OR s.coaching_venue = ${f.venue || ''})
      AND (${f.q || ''} = '' OR s.reg_no ILIKE ${'%' + (f.q || '') + '%'} OR s.name ILIKE ${'%' + (f.q || '') + '%'} OR s.mobile LIKE ${'%' + (f.q || '') + '%'})
      AND (${f.from || ''} = '' OR o.created_at >= (${f.from || '1970-01-01'}::date)::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND (${f.to || ''} = '' OR o.created_at < (${f.to || '2999-01-01'}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
    ORDER BY (o.status='pending') DESC, o.created_at DESC
    LIMIT 2000`;
}

/** Counts for one test: online writers, offline verified / pending / rejected. */
export async function offlineCounts(testId) {
  const [c] = await sql`SELECT
      (SELECT count(*) FROM attempts WHERE test_id=${testId} AND submitted_at IS NOT NULL AND NOT offline)::int online,
      count(*) FILTER (WHERE status='verified')::int verified,
      count(*) FILTER (WHERE status='pending')::int pending,
      count(*) FILTER (WHERE status='rejected')::int rejected
    FROM offline_scores WHERE test_id=${testId}`;
  return c;
}
