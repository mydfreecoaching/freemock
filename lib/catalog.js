import { sql } from './db';

/**
 * Which exams (courses) belong in which tab, from the type of their published tests.
 * Courses   = exams with class tests (or a new exam without tests yet, except the full / subject exams)
 * Full mocks = exams with full mock tests (always includes the 'full' exam)
 */
export async function examTabs(exams) {
  const rows = await sql`SELECT kind, ttype, count(*)::int n FROM tests WHERE published GROUP BY kind, ttype`;
  const has = (code, type) => rows.some((r) => r.kind === code && r.ttype === type);
  const any = (code) => rows.some((r) => r.kind === code);
  return {
    classExams: exams.filter((e) => has(e.code, 'class') || (!any(e.code) && e.code !== 'full' && e.code !== 'subject')),
    fullExams: exams.filter((e) => has(e.code, 'full') || e.code === 'full'),
  };
}
