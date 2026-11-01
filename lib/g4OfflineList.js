import { sql } from './db';
import { PREFIX } from './util';

/** Mayiladuthurai / Thiruvarur students with their offline Group 4 mock test answer. f = { d, a ('yes'|'no'|'none'), g ('yes'|'no') } */
export async function g4OffList(f = {}) {
  const rows = await sql`SELECT id, reg_no, name, mobile, district, coaching_venue, g4_applied, g4_app_no, g4_offline,
      to_char(g4_offline_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') answered_at
    FROM students ORDER BY district, reg_no`;
  const all = rows.filter((s) => ['MYD', 'TVR'].includes(PREFIX[s.district]) && (!f.d || PREFIX[s.district] === f.d));
  const list = all.filter((s) => (!f.a || (f.a === 'yes' ? s.g4_offline === true : f.a === 'no' ? s.g4_offline === false : s.g4_offline == null))
    && (!f.g || (f.g === 'yes' ? s.g4_applied === true : s.g4_applied !== true)));
  const cnt = (p) => all.filter(p).length;
  const summary = ['MYD', 'TVR'].filter((d) => !f.d || f.d === d).map((d) => {
    const inD = (s) => PREFIX[s.district] === d;
    return { d, total: cnt(inD), yes: cnt((s) => inD(s) && s.g4_offline === true), no: cnt((s) => inD(s) && s.g4_offline === false), none: cnt((s) => inD(s) && s.g4_offline == null),
      yesApplied: cnt((s) => inD(s) && s.g4_offline === true && s.g4_applied === true), yesNotApplied: cnt((s) => inD(s) && s.g4_offline === true && s.g4_applied !== true) };
  });
  return { list, summary };
}
export const offText = (v) => (v === true ? 'Yes' : v === false ? 'No' : 'Not answered');
