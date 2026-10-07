import { sql } from './db';

export function score(questions, answers, test) {
  const mk = Number(test.marks_per_q), pen = Number(test.unanswered_penalty);
  let correct = 0, wrong = 0, e = 0, un = 0;
  const sec = {};
  for (const q of questions) {
    const a = answers[q.qno];
    sec[q.section] ??= { correct: 0, total: 0, marks: 0 };
    sec[q.section].total++;
    if (!a) un++;
    else if (a === 'E') e++;
    else if (a === q.answer) { correct++; sec[q.section].correct++; sec[q.section].marks += mk; }
    else wrong++;
  }
  const deduction = un > 0 ? (Number(test.penalty_mode) === 2 ? un * pen : pen) : 0;
  return { correct, wrong, e_count: e, unanswered: un, section_scores: sec, score: Math.round((correct * mk - deduction) * 100) / 100 };
}

/** Finalise one attempt (on submit or after its deadline passed). */
export async function finalize(attemptId) {
  const [att] = await sql`SELECT * FROM attempts WHERE id=${attemptId}`;
  if (!att || att.submitted_at) return att;
  const [test] = await sql`SELECT * FROM tests WHERE id=${att.test_id}`;
  const qs = await sql`SELECT qno, section, answer FROM questions WHERE test_id=${att.test_id}`;
  const r = score(qs, att.answers || {}, test);
  const now = new Date();
  let at = now > att.deadline ? att.deadline : now;
  if (at < att.started_at) at = att.started_at;
  const [u] = await sql`UPDATE attempts SET submitted_at=${at}, score=${r.score}, correct=${r.correct}, wrong=${r.wrong},
      e_count=${r.e_count}, unanswered=${r.unanswered}, section_scores=${sql.json(r.section_scores)}
      WHERE id=${attemptId} AND submitted_at IS NULL RETURNING *`;
  return u || att;
}
/** Close every attempt whose time is over (called before showing results). */
export async function finalizeExpired(testId) {
  const rows = await sql`SELECT id FROM attempts WHERE test_id=${testId} AND submitted_at IS NULL AND deadline < now() - interval '30 seconds'`;
  for (const r of rows) await finalize(r.id);
}
/** Re-score all submitted attempts (after an answer-key correction). */
export async function rescoreAll(testId) {
  const [test] = await sql`SELECT * FROM tests WHERE id=${testId}`;
  const qs = await sql`SELECT qno, section, answer FROM questions WHERE test_id=${testId}`;
  const atts = await sql`SELECT id, answers FROM attempts WHERE test_id=${testId} AND submitted_at IS NOT NULL`;
  for (const a of atts) {
    const r = score(qs, a.answers || {}, test);
    await sql`UPDATE attempts SET score=${r.score}, correct=${r.correct}, wrong=${r.wrong}, e_count=${r.e_count},
      unanswered=${r.unanswered}, section_scores=${sql.json(r.section_scores)} WHERE id=${a.id}`;
  }
  return atts.length;
}
