import { sql } from './db';
import { PREFIX } from './util';
import { CX_EXAMS } from './centralExams';

/** Students with their SSC / IBPS / RRB answers. f = { d: 'MYD'|'TVR'|'OTH'|'', a: 'yes'|'no'|'none'|'', x: exam key } */
export async function cxList(f = {}) {
  const rows = await sql`SELECT id, reg_no, name, mobile, district, district_other, qualification, cx_interest, cx_exams, cx_apps, cx_none,
      to_char(cx_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') cx_at FROM students ORDER BY district, reg_no`;
  const inD = (s) => !f.d || PREFIX[s.district] === f.d;
  const all = rows.filter(inD);
  const list = all.filter((s) => (!f.a || (f.a === 'yes' ? s.cx_interest === true : f.a === 'no' ? s.cx_interest === false : !s.cx_at))
    && (!f.x || s.cx_exams?.includes(f.x) || s.cx_apps?.some((a) => a.exam === f.x)));
  const answered = all.filter((s) => s.cx_at);
  const perExam = CX_EXAMS.map(([k, l]) => ({ k, l, want: answered.filter((s) => s.cx_exams?.includes(k)).length, applied: answered.filter((s) => s.cx_apps?.some((a) => a.exam === k)).length }));
  return { list, perExam, total: all.length, answered: answered.length, yes: answered.filter((s) => s.cx_interest).length, applied: answered.filter((s) => s.cx_apps?.length).length };
}
