import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { ranking } from '@/lib/rank';

const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

export async function GET(req) {
  const g = await guard(); if (g) return g;
  const u = new URL(req.url);
  const type = u.searchParams.get('type');
  let rows, name;
  if (type === 'students') {
    const s = await sql`SELECT reg_no,name,mobile,to_char(dob,'DD.MM.YYYY') dob,district,qualification,to_char(created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') reg_at FROM students ORDER BY reg_no`;
    rows = [['Reg No', 'Name', 'Mobile', 'DOB', 'District', 'Qualification', 'Registered at'], ...s.map((r) => Object.values(r))];
    name = 'students';
  } else {
    const id = Number(u.searchParams.get('test'));
    const qs = await sql`SELECT qno FROM questions WHERE test_id=${id} ORDER BY qno`;
    const rk = await ranking(id);
    const head = ['Rank', 'District Rank', 'Reg No', 'Name', 'Mobile', 'District', 'Score', 'Correct', 'Wrong', 'E', 'Unanswered', 'Tamil', 'GS', 'Aptitude', 'Time (min)', 'Tab switches', 'Responses (200, - = blank)'];
    rows = [head, ...rk.map((r) => {
      const s = r.section_scores || {};
      return [r.rank, r.drank, r.reg_no, r.name, r.mobile, r.district, r.score, r.correct, r.wrong, r.e_count, r.unanswered,
        s['தமிழ்']?.marks ?? '', s.GS?.marks ?? '', s.APT?.marks ?? '', Math.round((r.secs || 0) / 6) / 10, r.tab_switches,
        qs.map((q) => r.answers?.[q.qno] || '-').join('')];
    })];
    name = `test_${id}_results`;
  }
  return new Response(csv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}.csv"` } });
}
