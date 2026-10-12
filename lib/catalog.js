import { sql } from './db';

/**
 * Which exams (courses) belong in which tab, from the type of their published tests.
 * Courses    = exams with class tests (for a logged-in student: class tests for their district only;
 *              for visitors / admin also a new exam without tests yet, except the full / subject exams)
 * Full mocks = exams with full mock tests (always includes the 'full' exam)
 */
export async function examTabs(exams, v = null) {
  const rows = await sql`SELECT kind, ttype, districts FROM tests WHERE published`;
  const student = v && !v.guest;
  const hasClass = (code) => rows.some((r) => r.kind === code && r.ttype === 'class' && (!student || (r.districts || []).includes(v.district)));
  const any = (code) => rows.some((r) => r.kind === code);
  return {
    classExams: exams.filter((e) => hasClass(e.code) || (!student && !any(e.code) && e.code !== 'full' && e.code !== 'subject')),
    fullExams: exams.filter((e) => rows.some((r) => r.kind === e.code && r.ttype === 'full') || e.code === 'full'),
  };
}
