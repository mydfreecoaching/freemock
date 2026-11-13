import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { getExams } from '@/lib/exams';
import { lbRaw, computeView, lbSettings, adminExtras } from '@/lib/lb';
import { secLabel } from '@/lib/util';
import { studentInfo, STUDENT_HEAD, studentCells } from '@/lib/studentCols';

const MODE_LABEL = { day: 'Daily', week: 'Weekly', month: 'Monthly', overall: 'Overall', subject: 'Subject-wise', test: 'Test-wise' };
const hms = (s) => (s == null ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

/** Admin: the selected leaderboard view as an Excel file (ranking + district-wise + improving / declining sheets). */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const p = Object.fromEntries(new URL(req.url).searchParams);
  const exams = await getExams(true);
  const ex = exams.find((e) => e.code === p.exam) || exams[0];
  if (!ex) return Response.json({ error: 'தேர்வு இல்லை.' }, { status: 404 });
  const raw = await lbRaw(ex.code);
  const settings = await lbSettings();
  const v = computeView(raw, p, settings);
  const x = adminExtras(v, raw);
  const info = await studentInfo(v.rows.map((r) => r.reg_no));
  const selText = v.mode === 'test' ? (v.options.test.find((t) => t.id === v.sel)?.title || '') : v.mode === 'subject' ? secLabel(v.sel) : v.sel || 'All';

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Leaderboard');
  ws.addRow([`${ex.name} – ${MODE_LABEL[v.mode]} leaderboard – ${selText}`]).font = { bold: true, size: 13 };
  ws.addRow([`Ranked by average % per test; ties: accuracy → fewer wrong → less time. Participants: ${v.participants}. Exported ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`]);
  ws.addRow([]);
  const head = ws.addRow(['Rank', 'Change', 'Reg No', 'Name', 'District', 'Score', 'Max', 'Percentage', 'Accuracy %', 'Tests', 'Correct', 'Wrong', 'Avg time (m:ss)', 'Highest %', 'Mobile', ...STUDENT_HEAD]);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2A5B' } }; });
  for (const r of v.rows) ws.addRow([r.rank, r.change == null ? (v.hasPrev ? 'New' : '') : r.change, r.reg_no, r.name, r.district, r.score, r.max, r.pct, r.acc, r.n, r.correct, r.wrong, hms(r.secsAvg), r.best, info[r.reg_no]?.mobile || '', ...studentCells(info[r.reg_no])]);
  ws.columns.forEach((c, i) => { c.width = [7, 8, 16, 26, 16, 9, 8, 11, 11, 7, 9, 8, 13, 10][i] || 12; });
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  const wd = wb.addWorksheet('District-wise');
  wd.addRow(['District', 'Students', 'Average %', 'Top rank', 'Top student', 'Reg No', 'Top %']).font = { bold: true };
  for (const d of x.districts) wd.addRow([d.district, d.n, d.avg, d.top.rank, d.top.name, d.top.reg_no, d.top.pct]);
  wd.columns.forEach((c) => { c.width = 18; });
  for (const [name, list] of [['Improving', x.improving], ['Declining', x.declining]]) {
    const w = wb.addWorksheet(name);
    w.addRow(['Reg No', 'Name', 'District', 'Tests', 'Earlier avg %', 'Last test %', 'Change']).font = { bold: true };
    for (const t of list) w.addRow([t.reg_no, t.name, t.district, t.tests, t.before, t.last, t.delta]);
    w.columns.forEach((c) => { c.width = 16; });
  }
  const buf = await wb.xlsx.writeBuffer();
  const fn = `leaderboard_${ex.code}_${v.mode}_${String(v.sel ?? 'all').replace(/[^\w-]+/g, '')}.xlsx`;
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="${fn}"` } });
}
