import { sql } from './db';
import { PREFIX } from './util';
import { ATT_DISTRICTS, classDays } from './attendance';
import { CLASS_SOURCES } from './classSource';

/** Class students of Mayiladuthurai / Thiruvarur (district code `d` or both) with "how they heard" counts. */
export async function classSourceStats(d = '') {
  const dist = ATT_DISTRICTS.some(([c]) => c === d) ? d : '';
  const all = (await sql`SELECT reg_no, name, mobile, district, coaching_venue, class_source, class_source_other FROM students WHERE coaching_venue IS NOT NULL ORDER BY reg_no DESC`)
    .filter((s) => ['TVR', 'MYD'].includes(PREFIX[s.district]) && (!dist || PREFIX[s.district] === dist) && classDays(s.coaching_venue).length);
  const answered = all.filter((s) => s.class_source?.length);
  const count = (k, list = answered) => list.filter((s) => s.class_source.includes(k)).length;
  const sources = CLASS_SOURCES.map(([k, l]) => ({ k, l, n: count(k) })).sort((a, b) => b.n - a.n);
  const venues = [...new Set(answered.map((s) => s.coaching_venue))].map((v) => {
    const list = answered.filter((s) => s.coaching_venue === v);
    return { v, n: list.length, by: Object.fromEntries(CLASS_SOURCES.map(([k]) => [k, count(k, list)])) };
  }).sort((a, b) => b.n - a.n);
  const totalPicks = sources.reduce((t, s) => t + s.n, 0);
  return { d: dist, all, answered, sources, venues, totalPicks };
}
