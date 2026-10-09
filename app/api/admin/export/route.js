import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { GENDER_LABEL, PRIORITY_LABEL } from '@/lib/util';
import { ranking } from '@/lib/rank';
import { testAnalysis, weeklyAnalysis } from '@/lib/analysis';
import { weekStart } from '@/lib/util';

const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

export async function GET(req) {
  const g = await guard(); if (g) return g;
  const u = new URL(req.url);
  const type = u.searchParams.get('type');
  let rows, name;
  if (type === 'students') {
    const s = await sql`SELECT reg_no,name,mobile,email,to_char(dob,'DD.MM.YYYY') dob,gender,community,priority,priority_other,district,qualification,to_char(created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') reg_at FROM students ORDER BY reg_no`;
    rows = [['Reg No', 'Name', 'Mobile', 'Email', 'DOB', 'Gender', 'Community', 'Priority', 'District', 'Qualification', 'Registered at'],
      ...s.map((r) => [r.reg_no, r.name, r.mobile, r.email || '', r.dob, GENDER_LABEL[r.gender] || '', r.community || '',
        (r.priority || []).map((p) => (p === 'OTHER' ? `Other: ${r.priority_other || ''}` : PRIORITY_LABEL[p] || p)).join('; '), r.district, r.qualification || '', r.reg_at])];
    name = 'students';
  } else if (type === 'items') {
    const id = Number(u.searchParams.get('test'));
    const A = await testAnalysis(id);
    rows = [['Q.No', 'Section', 'Key', 'Correct %', 'Level', 'A', 'B', 'C', 'D', 'E', 'Blank', 'Discrimination', 'Most chosen wrong', 'Wrong %', 'Check key', 'Question'],
      ...A.items.map((i) => [i.qno, i.section, i.answer, i.pct, i.level, i.dist.A, i.dist.B, i.dist.C, i.dist.D, i.dist.E, i.dist['-'], i.disc ?? '', i.topWrong, i.topWrongPct, i.flag ? 'YES' : '', i.text])];
    name = `test_${id}_question_analysis`;
  } else if (type === 'weekly') {
    const from = u.searchParams.get('w') ? new Date(`${u.searchParams.get('w')}T00:00:00+05:30`) : weekStart();
    const kk = u.searchParams.get('k') || 'g2_daily';
    const W = await weeklyAnalysis(from, kk);
    rows = [['Rank', 'Reg No', 'Name', 'District', 'Tests', 'Score', 'Max', 'Score %', 'Correct', 'Wrong', 'Accuracy %'],
      ...W.students.map((s) => [s.rank, s.reg_no, s.name, s.district, `${s.tests}/${W.closed.length}`, s.score, W.totalMax, s.pct, s.correct, s.wrong, s.acc])];
    name = `weekly_${kk}_${u.searchParams.get('w') || 'current'}`;
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
