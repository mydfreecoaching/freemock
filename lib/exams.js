import { sql } from './db';
import { tnpscMinutes } from './util';

/** All exams (admin) or only active ones (students / faculty), in display order. */
export const getExams = (all = false) =>
  all ? sql`SELECT * FROM exams ORDER BY sort, id` : sql`SELECT * FROM exams WHERE active ORDER BY sort, id`;
export const examMap = (list) => Object.fromEntries(list.map((e) => [e.code, e]));
export async function getExam(code) { const [e] = await sql`SELECT * FROM exams WHERE code=${String(code || '')}`; return e || null; }
export const examName = (map, code) => map[code]?.name || code;

/** Message when the question count does not match the exam's fixed count (null = fine). */
export function countError(exam, n) {
  if (!exam?.qcount || n === exam.qcount) return null;
  return `${exam.name} – சரியாக ${exam.qcount} வினாக்கள் இருக்க வேண்டும்; தற்போது ${n} உள்ளன.`;
}
/** Duration follows the question count: 0.9 min per question (200 → 180, 100 → 90, 20 → 18). */
export const examMinutes = (n) => (n > 0 ? tnpscMinutes(n) : null);
/** Marking preset for the test form. */
export const preset = (e) => (e ? { marks_per_q: Number(e.marks_per_q), negative_mark: Number(e.negative_mark), unanswered_penalty: Number(e.unanswered_penalty), allow_e: !!e.allow_e, duration_min: e.qcount ? tnpscMinutes(e.qcount) : 180 } : {});
