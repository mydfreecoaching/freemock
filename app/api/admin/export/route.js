import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { VENUE_LABEL } from '@/lib/venues';
import { ranking } from '@/lib/rank';
import { testAnalysis, weeklyAnalysis } from '@/lib/analysis';
import { combinedRanking } from '@/lib/combined';
import { getExam } from '@/lib/exams';
import { weekStart, genderText, priorityText } from '@/lib/util';
import { studentInfo, STUDENT_HEAD, studentCells, studentHead, studentCellsSkip, ALREADY_IN_RESULTS as SK } from '@/lib/studentCols';

const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

export async function GET(req) {
  const g = await guard(); if (g) return g;
  const u = new URL(req.url);
  const type = u.searchParams.get('type');
  let rows, name;
  if (type === 'students') {
    const s = await sql`SELECT reg_no, name, mobile FROM students ORDER BY reg_no`;
    const info = await studentInfo(s.map((r) => r.reg_no));
    rows = [['Reg No', 'Name', 'Mobile', ...STUDENT_HEAD], ...s.map((r) => [r.reg_no, r.name, r.mobile, ...studentCells(info[r.reg_no])])];
    name = 'students';
  } else if (type === 'classfeedback') {
    const v = u.searchParams.get('v') || '';
    const f = await sql`SELECT to_char(c.created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') at, s.reg_no, s.name, s.mobile, s.district, c.venue, c.rating, c.teaching, c.facility, c.comment, c.suggestion
      FROM class_feedback c JOIN students s ON s.id=c.student_id WHERE (${v} = '' OR c.venue=${v}) ORDER BY c.created_at DESC`;
    rows = [['Date', 'Reg No', 'Name', 'Mobile', 'District', 'Venue', 'Overall (1-5)', 'Teaching (1-5)', 'Facilities (1-5)', 'Feedback', 'Suggestions'],
      ...f.map((r) => [r.at, r.reg_no, r.name, r.mobile, r.district, VENUE_LABEL(r.venue), r.rating, r.teaching, r.facility, r.comment, r.suggestion || ''])];
    name = 'class_feedback';
  } else if (type === 'items') {
    const id = Number(u.searchParams.get('test'));
    const A = await testAnalysis(id);
    rows = [['Q.No', 'Section', 'Key', 'Correct %', 'Level', 'A', 'B', 'C', 'D', 'E', 'Blank', 'Discrimination', 'Most chosen wrong', 'Wrong %', 'Check key', 'Question'],
      ...A.items.map((i) => [i.qno, i.section, i.answer, i.pct, i.level, i.dist.A, i.dist.B, i.dist.C, i.dist.D, i.dist.E, i.dist['-'], i.disc ?? '', i.topWrong, i.topWrongPct, i.flag ? 'YES' : '', i.text])];
    name = `test_${id}_question_analysis`;
  } else if (type === 'combined') {
    // combined ranking of every test held so far for one exam, with each test's marks
    // one test series: optional test type / subject / date range; ranked on total marks of all tests in it
    const code = u.searchParams.get('e') || 'full';
    const ex = await getExam(code);
    const TTN = { class: 'Class tests', full: 'Full mock tests', subject: 'Subject tests' };
    const day = (k) => (/^\d{4}-\d{2}-\d{2}$/.test(u.searchParams.get(k) || '') ? u.searchParams.get(k) : '');
    const opts = { ttype: TTN[u.searchParams.get('tt')] ? u.searchParams.get('tt') : '', subject: String(u.searchParams.get('s') || '').slice(0, 80), from: day('from'), to: day('to'), byTotal: true };
    const C = await combinedRanking(code, opts);
    const info = await studentInfo(C.rows.map((r) => r.reg_no));
    rows = [
      [`${ex?.name || code}${opts.ttype ? ` – ${TTN[opts.ttype]}` : ''}${opts.subject ? ` – ${opts.subject}` : ''}${opts.from || opts.to ? ` – ${opts.from || '…'} to ${opts.to || '…'}` : ''} – Combined ranking by total marks (${C.tests.length} tests, max ${C.grand})`],
      ['Rank', 'District Rank', 'Reg No', 'Name', 'Mobile', 'District', 'Gender', 'Community', 'Priority',
        ...C.tests.map((t, i) => `Test ${i + 1}: ${t.unit ? `Unit ${t.unit} · ` : ''}${t.title} (${new Date(t.start_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}) (/${t.max})`), `Total (/${C.grand})`, 'Tests written', 'Tests missed', 'Average %', 'Total time (min)', ...studentHead(SK)],
      ...C.rows.map((r) => [r.rank, r.drank, r.reg_no, r.name, r.mobile || '', r.district, genderText(r.gender), r.community || '', priorityText(r),
        ...C.tests.map((t) => r.scores[t.id] ?? 'Absent'), r.total, `${r.written}/${C.tests.length}`, r.missed, r.avgPct, Math.round((r.secs || 0) / 6) / 10, ...studentCellsSkip(info[r.reg_no], SK)]),
    ];
    name = `combined_${code}${opts.ttype ? `_${opts.ttype}` : ''}_${new Date().toISOString().slice(0, 10)}`;
  } else if (type === 'weekly') {
    const from = u.searchParams.get('w') ? new Date(`${u.searchParams.get('w')}T00:00:00+05:30`) : weekStart();
    const kk = u.searchParams.get('k') || 'g2_daily';
    const W = await weeklyAnalysis(from, kk);
    const info = await studentInfo(W.students.map((x) => x.reg_no));
    rows = [['Rank', 'Reg No', 'Name', 'District', 'Gender', 'Community', 'Priority', 'Tests', 'Score', 'Max', 'Score %', 'Correct', 'Wrong', 'Accuracy %', 'Mobile', ...studentHead(SK)],
      ...W.students.map((s) => [s.rank, s.reg_no, s.name, s.district, genderText(s.gender), s.community || '', priorityText(s), `${s.tests}/${W.closed.length}`, s.score, W.totalMax, s.pct, s.correct, s.wrong, s.acc, info[s.reg_no]?.mobile || s.mobile || '', ...studentCellsSkip(info[s.reg_no], SK)])];
    name = `weekly_${kk}_${u.searchParams.get('w') || 'current'}`;
  } else {
    const id = Number(u.searchParams.get('test'));
    const qs = await sql`SELECT qno FROM questions WHERE test_id=${id} ORDER BY qno`;
    const rk = await ranking(id);
    const info = await studentInfo(rk.map((r) => r.reg_no));
    const head = ['Rank', 'District Rank', 'Reg No', 'Name', 'Mobile', 'District', 'Gender', 'Community', 'Priority', 'Score', 'Correct', 'Wrong', 'E', 'Unanswered', 'Tamil', 'GS', 'Aptitude', 'Time (min)', 'Tab switches', 'Mode', ...studentHead(SK), 'Responses (200, - = blank)'];
    rows = [head, ...rk.map((r) => {
      const s = r.section_scores || {};
      return [r.rank, r.drank, r.reg_no, r.name, r.mobile, r.district, genderText(r.gender), r.community || '', priorityText(r), r.score, r.correct, r.wrong, r.e_count, r.unanswered,
        s['தமிழ்']?.marks ?? '', s.GS?.marks ?? '', s.APT?.marks ?? '', Math.round((r.secs || 0) / 6) / 10, r.tab_switches, r.offline ? 'Offline (paper)' : 'Online', ...studentCellsSkip(info[r.reg_no], SK),
        r.offline ? '' : qs.map((q) => r.answers?.[q.qno] || '-').join('')];
    })];
    name = `test_${id}_results`;
  }
  return new Response(csv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}.csv"` } });
}
