import { sql, ensureSchema } from './db';
import { studentId } from './auth';
import { score, isStale, ABANDON_MIN } from './scoring';

/**
 * Practice retakes: a student who has already submitted a test can write it again for practice.
 * Stored only in practice_attempts — never read by any ranking, leaderboard, weekly report or analysis.
 */
export { isStale };

/** The student's ranked (first) attempt must be submitted before practice is allowed. */
export async function canPractise(testId, sid) {
  const [a] = await sql`SELECT submitted_at FROM attempts WHERE test_id=${testId} AND student_id=${sid}`;
  return !!a?.submitted_at;
}

export async function finalizePractice(id) {
  const [p] = await sql`SELECT * FROM practice_attempts WHERE id=${id}`;
  if (!p || p.submitted_at) return p;
  const [test] = await sql`SELECT * FROM tests WHERE id=${p.test_id}`;
  const qs = await sql`SELECT qno, section, answer, nopts FROM questions WHERE test_id=${p.test_id}`;
  const r = score(qs, p.answers || {}, test);
  let at = new Date();
  if (at > p.deadline) at = p.deadline;
  const seen = new Date(p.last_seen || p.started_at);
  if (seen.getTime() < Date.now() - ABANDON_MIN * 60000 && seen < at) at = seen;
  if (at < p.started_at) at = p.started_at;
  const [u] = await sql`UPDATE practice_attempts SET submitted_at=${at}, score=${r.score}, correct=${r.correct}, wrong=${r.wrong},
      e_count=${r.e_count}, unanswered=${r.unanswered}, section_scores=${sql.json(r.section_scores)}
      WHERE id=${id} AND submitted_at IS NULL RETURNING *`;
  return u || p;
}

/** The student's unfinished practice attempt for this test (closing stale ones on the way). */
export async function openPractice(testId, sid) {
  const rows = await sql`SELECT * FROM practice_attempts WHERE test_id=${testId} AND student_id=${sid} AND submitted_at IS NULL ORDER BY id DESC`;
  let live = null;
  for (const p of rows) {
    if (!live && !isStale(p)) live = p; else await finalizePractice(p.id);
  }
  return live;
}

/** API helper: logged-in student + their practice attempt by id. */
export async function currentPractice(practiceId, testId) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return { error: 'மீண்டும் உள்நுழையவும்.', status: 401 };
  const [p] = await sql`SELECT * FROM practice_attempts WHERE id=${Number(practiceId) || 0} AND student_id=${sid}`;
  if (!p || (testId && p.test_id !== Number(testId))) return { sid, error: 'பயிற்சித் தேர்வு கிடைக்கவில்லை.', status: 404 };
  return { sid, p };
}

/** Rescore practice attempts too after an answer-key correction. */
export async function rescorePractice(testId) {
  const [test] = await sql`SELECT * FROM tests WHERE id=${testId}`;
  const qs = await sql`SELECT qno, section, answer, nopts FROM questions WHERE test_id=${testId}`;
  const ps = await sql`SELECT id, answers FROM practice_attempts WHERE test_id=${testId} AND submitted_at IS NOT NULL`;
  for (const a of ps) {
    const r = score(qs, a.answers || {}, test);
    await sql`UPDATE practice_attempts SET score=${r.score}, correct=${r.correct}, wrong=${r.wrong}, e_count=${r.e_count},
      unanswered=${r.unanswered}, section_scores=${sql.json(r.section_scores)} WHERE id=${a.id}`;
  }
}

/** Practice answers written offline and sent after the attempt was closed: just re-score (practice is never ranked). */
export async function practiceLate(p, answers) {
  if (Date.now() - new Date(p.submitted_at).getTime() > 3 * 86400000) return false;
  const [test] = await sql`SELECT * FROM tests WHERE id=${p.test_id}`;
  const qs = await sql`SELECT qno, section, answer, nopts FROM questions WHERE test_id=${p.test_id}`;
  const r = score(qs, answers, test);
  await sql`UPDATE practice_attempts SET answers=${sql.json(answers)}, score=${r.score}, correct=${r.correct}, wrong=${r.wrong},
    e_count=${r.e_count}, unanswered=${r.unanswered}, section_scores=${sql.json(r.section_scores)} WHERE id=${p.id}`;
  return true;
}
