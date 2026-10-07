import { sql, ensureSchema } from './db';
import { studentId } from './auth';

export async function current(testId) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return { error: 'மீண்டும் உள்நுழையவும்.', status: 401 };
  const [a] = await sql`SELECT * FROM attempts WHERE test_id=${testId} AND student_id=${sid}`;
  return { sid, a };
}
export function cleanAnswers(obj, max = 300) {
  const out = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const n = Number(k);
      if (Number.isInteger(n) && n >= 1 && n <= max && ['A', 'B', 'C', 'D', 'E'].includes(v)) out[n] = v;
    }
  }
  return out;
}
