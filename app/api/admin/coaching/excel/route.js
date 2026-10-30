import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { sessionList, hours, t12, dmy, DAY_EN, dow } from '@/lib/coaching';

const head = (ws) => { const r = ws.getRow(1); r.font = { bold: true }; r.alignment = { wrapText: true, vertical: 'middle' }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF8' } }; };

/** Faculty class attendance as Excel: Attendance (every class), Faculty summary, Course summary. ?course&faculty&from&to */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const q = new URL(req.url).searchParams;
  const rows = await sessionList({ course: q.get('course'), faculty: q.get('faculty'), from: q.get('from'), to: q.get('to') });
  const wb = new ExcelJS.Workbook();
  const a = wb.addWorksheet('Attendance', { views: [{ state: 'frozen', ySplit: 1 }] });
  a.columns = [{ header: 'S.No', width: 6 }, { header: 'Date', width: 12 }, { header: 'Day', width: 6 }, { header: 'Course', width: 30 }, { header: 'Place', width: 30 },
    { header: 'Faculty', width: 24 }, { header: 'Mobile', width: 13 }, { header: 'Subject', width: 26 }, { header: 'Topic taught', width: 40 },
    { header: 'From', width: 10 }, { header: 'To', width: 10 }, { header: 'Hours', width: 8 }, { header: 'Entered at', width: 17 }];
  rows.forEach((r, i) => a.addRow([i + 1, dmy(r.d), DAY_EN[dow(r.d)], r.course, r.place, r.faculty, r.mobile, r.subject, r.topic || '', t12(r.t_from), t12(r.t_to), hours(r.t_from, r.t_to), r.entered_at]));
  const total = rows.reduce((t, r) => t + hours(r.t_from, r.t_to), 0);
  const tr = a.addRow(['', '', '', '', '', '', '', '', 'Total', '', '', Math.round(total * 100) / 100, '']); tr.font = { bold: true };
  head(a);

  const by = (key) => { const m = new Map(); for (const r of rows) { const k = key(r); const x = m.get(k) || { r, n: 0, h: 0, days: new Set() }; x.n++; x.h += hours(r.t_from, r.t_to); x.days.add(r.d); m.set(k, x); } return [...m.values()]; };
  const f = wb.addWorksheet('Faculty summary', { views: [{ state: 'frozen', ySplit: 1 }] });
  f.columns = [{ header: 'Faculty', width: 26 }, { header: 'Mobile', width: 13 }, { header: 'Classes', width: 9 }, { header: 'Days', width: 8 }, { header: 'Hours', width: 9 }, { header: 'Subjects', width: 50 }];
  by((r) => r.faculty_id).sort((x, y) => y.h - x.h).forEach((x) => f.addRow([x.r.faculty, x.r.mobile, x.n, x.days.size, Math.round(x.h * 100) / 100, [...new Set(rows.filter((r) => r.faculty_id === x.r.faculty_id).map((r) => r.subject))].join(', ')]));
  head(f);
  const c = wb.addWorksheet('Course summary', { views: [{ state: 'frozen', ySplit: 1 }] });
  c.columns = [{ header: 'Course', width: 32 }, { header: 'Place', width: 32 }, { header: 'Classes', width: 9 }, { header: 'Days held', width: 10 }, { header: 'Hours', width: 9 }, { header: 'Faculty', width: 50 }];
  by((r) => r.course_id).forEach((x) => c.addRow([x.r.course, x.r.place, x.n, x.days.size, Math.round(x.h * 100) / 100, [...new Set(rows.filter((r) => r.course_id === x.r.course_id).map((r) => r.faculty))].join(', ')]));
  head(c);

  const span = [q.get('from'), q.get('to')].filter(Boolean).join('_to_') || 'all';
  return new Response(await wb.xlsx.writeBuffer(), { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="faculty_attendance_${span}.xlsx"` } });
}
