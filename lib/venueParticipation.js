import { sql } from './db';
import { attVenues } from './attendance';
import { DISTRICT_LIST } from './util';

/** Tamil district name for a district code. */
export const districtTa = (code) => DISTRICT_LIST.find((d) => d[2] === code)?.[0] || '';

/**
 * Class tests of a district with, for the chosen venues (empty = all class venues of the district):
 * registered students there, how many of them wrote each test, and all writers of the test.
 */
export async function classTestParticipation(dcode, venues) {
  const all = attVenues(dcode).map((v) => v.code);
  const codes = (venues || []).filter((c) => all.includes(c)).length ? venues.filter((c) => all.includes(c)) : all;
  const ta = districtTa(dcode);
  const [{ reg }] = await sql`SELECT count(*)::int reg FROM students WHERE coaching_venue = ANY(${codes})`;
  const tests = await sql`SELECT t.id, t.title, t.start_at, t.subject, t.unit,
      (SELECT count(*) FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.test_id=t.id AND a.submitted_at IS NOT NULL AND s.coaching_venue = ANY(${codes}))::int wrote,
      (SELECT count(*) FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.test_id=t.id AND a.submitted_at IS NOT NULL AND s.district = ${ta})::int district_wrote,
      (SELECT count(*) FROM attempts a WHERE a.test_id=t.id AND a.submitted_at IS NOT NULL)::int total_wrote
    FROM tests t WHERE t.published AND t.ttype='class' AND ${ta} = ANY(t.districts) ORDER BY t.start_at DESC`;
  return { reg, tests, codes };
}

/** One test: registered and writers per coaching venue (venues of the test's districts). */
export async function testVenueBreakdown(testId, districts) {
  const rows = await sql`SELECT s.coaching_venue v, count(*)::int reg,
      count(a.student_id) FILTER (WHERE a.submitted_at IS NOT NULL)::int wrote
    FROM students s LEFT JOIN attempts a ON a.student_id=s.id AND a.test_id=${testId}
    WHERE s.district = ANY(${districts}) AND s.coaching_venue IS NOT NULL GROUP BY 1`;
  const by = Object.fromEntries(rows.map((r) => [r.v, r]));
  const out = [];
  for (const ta of districts) {
    const code = DISTRICT_LIST.find((d) => d[0] === ta)?.[2];
    for (const v of attVenues(code)) out.push({ district: ta, code: v.code, title: v.title, days: v.days, reg: by[v.code]?.reg || 0, wrote: by[v.code]?.wrote || 0 });
  }
  return out;
}
