import { sql } from './db';
import { PREFIX, testStatus } from './util';

/**
 * Class tests written on paper at the DECGC office (Mayiladuthurai / Thiruvarur students).
 * Before starting, the student says whether they wrote it at the office; if so they enter the number of correct and
 * wrong answers and the time taken – the mark is calculated from the test's marking scheme.
 * The entry goes straight into the rankings (status 'verified'); the office can still correct, reject or delete it.
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

/** Marking scheme of a test: questions, marks per correct answer, negative mark per wrong answer, duration. */
export async function scoreLimits(t) {
  const [{ n }] = await sql`SELECT count(*)::int n FROM questions WHERE test_id=${t.id}`;
  const mk = Number(t.marks_per_q) || 1, neg = Number(t.negative_mark) || 0;
  return { n, mk, neg, max: n * mk, dur: Math.max(1, Number(t.duration_min) || 60) };
}

/** Mark from counts (paper: the rest are treated as not answered, without the online-only unanswered penalty). */
export const marksFor = (lim, correct, wrong) => Math.round((correct * lim.mk - wrong * lim.neg) * 100) / 100;

/** Validate correct / wrong / minutes against the test → { correct, wrong, minutes, unanswered, score } or { error }. */
export function checkCounts(b, lim) {
  const int = (v) => (String(v ?? '').trim() === '' ? NaN : Number(v));
  // paper tests at the office always run for the full allotted time – no time is asked
  const correct = int(b.correct), wrong = int(b.wrong), minutes = lim.dur;
  if (![correct, wrong].every(Number.isInteger)) return { error: 'சரியான விடைகள், தவறான விடைகள் – இரண்டையும் முழு எண்ணாக உள்ளிடவும்.' };
  if (correct < 0 || wrong < 0) return { error: 'எண்ணிக்கை 0 அல்லது அதற்கு மேல் இருக்க வேண்டும்.' };
  if (correct + wrong > lim.n) return { error: `சரியான விடைகள் (${correct}) + தவறான விடைகள் (${wrong}) = ${correct + wrong}; இத்தேர்வில் மொத்த வினாக்கள் ${lim.n} மட்டுமே. எண்ணிக்கையைச் சரிபார்த்து சரியாகப் பூர்த்தி செய்யவும்.` };
  return { correct, wrong, minutes, unanswered: lim.n - correct - wrong, score: marksFor(lim, correct, wrong) };
}

/** Turn a verified mark into a submitted attempt (or update it). */
export async function applyVerified(o, t) {
  const lim = await scoreLimits(t);
  const at = new Date(o.created_at);
  const start = new Date(at.getTime() - lim.dur * 60000); // paper tests use the full allotted time
  const c = Number(o.correct) || 0, w = Number(o.wrong) || 0;
  await sql`INSERT INTO attempts (test_id, student_id, started_at, deadline, submitted_at, answers, score, correct, wrong, e_count, unanswered, section_scores, end_reason, offline)
    VALUES (${o.test_id}, ${o.student_id}, ${start}, ${at}, ${at}, '{}', ${o.score}, ${c}, ${w}, 0, ${lim.n - c - w}, NULL, 'offline', true)
    ON CONFLICT (test_id, student_id) DO UPDATE SET score=EXCLUDED.score, correct=EXCLUDED.correct, wrong=EXCLUDED.wrong, e_count=0,
      unanswered=EXCLUDED.unanswered, started_at=EXCLUDED.started_at WHERE attempts.offline`;
}

/** Remove the attempt made from an offline mark (rejected / deleted / un-verified). Online attempts are never touched. */
/** Older entries that were waiting for office verification: add them to the rankings (entries go straight in now). */
export async function verifyAllPending() {
  const list = await sql`UPDATE offline_scores SET status='verified', verified_at=now(), updated_at=now() WHERE status='pending' RETURNING *`;
  for (const o of list) {
    const [a] = await sql`SELECT offline FROM attempts WHERE test_id=${o.test_id} AND student_id=${o.student_id}`;
    if (a && !a.offline) continue; // wrote online too – the online result counts
    const [t] = await sql`SELECT * FROM tests WHERE id=${o.test_id}`;
    if (t) await applyVerified(o, t);
  }
  return list.length;
}

/** Run verifyAllPending once per server instance (cheap no-op once nothing is pending). */
export async function flushPendingOnce() {
  if (globalThis.__offFlushed) return;
  globalThis.__offFlushed = true;
  try { await verifyAllPending(); } catch { globalThis.__offFlushed = false; }
}

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
