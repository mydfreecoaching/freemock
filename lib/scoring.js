import { sql } from './db';

/**
 * questions: [{qno, section, answer, nopts}]; answers: {qno: 'A'..'E'}.
 * 'E' on a 4-option question = "answer not known" (no marks, no penalty).
 * On a 5-option question E is a real option.
 */
export function score(questions, answers, test) {
  const mk = Number(test.marks_per_q), pen = Number(test.unanswered_penalty), neg = Number(test.negative_mark || 0);
  let correct = 0, wrong = 0, e = 0, un = 0;
  const sec = {};
  for (const q of questions) {
    const a = answers[q.qno];
    const s = (sec[q.section] ??= { correct: 0, wrong: 0, total: 0, marks: 0 });
    s.total++;
    if (!a) un++;
    else if (a === 'E' && Number(q.nopts || 4) < 5) e++;
    else if (a === q.answer) { correct++; s.correct++; s.marks += mk; }
    else { wrong++; s.wrong++; s.marks -= neg; }
  }
  for (const s of Object.values(sec)) s.marks = Math.round(s.marks * 100) / 100;
  const deduction = (un > 0 ? (Number(test.penalty_mode) === 2 ? un * pen : pen) : 0) + wrong * neg;
  return { correct, wrong, e_count: e, unanswered: un, section_scores: sec, score: Math.round((correct * mk - deduction) * 100) / 100 };
}

/** An attempt left without any save/heartbeat for this long is treated as abandoned and auto-submitted. */
export const ABANDON_MIN = 10;
const lastSeen = (a) => new Date(a.last_seen || a.started_at).getTime();
export const isAbandoned = (a, now = Date.now()) => !!a && !a.submitted_at && lastSeen(a) < now - ABANDON_MIN * 60000;
/** True when an unsubmitted attempt should be closed: time over, or the student left the test. */
export function isStale(a, now = Date.now()) {
  if (!a || a.submitted_at) return false;
  return new Date(a.deadline).getTime() < now - 30000 || isAbandoned(a, now);
}

/** Finalise one attempt (on submit, after its deadline passed, or when abandoned). */
export async function finalize(attemptId) {
  const [att] = await sql`SELECT * FROM attempts WHERE id=${attemptId}`;
  if (!att || att.submitted_at) return att;
  const [test] = await sql`SELECT * FROM tests WHERE id=${att.test_id}`;
  const qs = await sql`SELECT qno, section, answer, nopts FROM questions WHERE test_id=${att.test_id}`;
  const r = score(qs, att.answers || {}, test);
  const now = new Date();
  let at = now > att.deadline ? att.deadline : now;
  // abandoned: count time only up to the last moment the student was on the test
  if (lastSeen(att) < Date.now() - ABANDON_MIN * 60000 && new Date(lastSeen(att)) < at) at = new Date(lastSeen(att));
  if (at < att.started_at) at = att.started_at;
  const [u] = await sql`UPDATE attempts SET submitted_at=${at}, score=${r.score}, correct=${r.correct}, wrong=${r.wrong},
      e_count=${r.e_count}, unanswered=${r.unanswered}, section_scores=${sql.json(r.section_scores)}
      WHERE id=${attemptId} AND submitted_at IS NULL RETURNING *`;
  return u || att;
}
/** Close every attempt whose time is over or that was abandoned (called before showing results). */
export async function finalizeExpired(testId) {
  const rows = await sql`SELECT id FROM attempts WHERE test_id=${testId} AND submitted_at IS NULL
    AND (deadline < now() - interval '30 seconds' OR COALESCE(last_seen, started_at) < now() - make_interval(mins => ${ABANDON_MIN}))`;
  for (const r of rows) await finalize(r.id);
}
/** Re-score all submitted attempts (after an answer-key correction). */
export async function rescoreAll(testId) {
  const [test] = await sql`SELECT * FROM tests WHERE id=${testId}`;
  const qs = await sql`SELECT qno, section, answer, nopts FROM questions WHERE test_id=${testId}`;
  const atts = await sql`SELECT id, answers FROM attempts WHERE test_id=${testId} AND submitted_at IS NOT NULL`;
  for (const a of atts) {
    const r = score(qs, a.answers || {}, test);
    await sql`UPDATE attempts SET score=${r.score}, correct=${r.correct}, wrong=${r.wrong}, e_count=${r.e_count},
      unanswered=${r.unanswered}, section_scores=${sql.json(r.section_scores)} WHERE id=${a.id}`;
  }
  return atts.length;
}
