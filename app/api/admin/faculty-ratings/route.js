import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { CLARITY, dmy, t12 } from '@/lib/coaching';
import { ratingList, byFaculty } from '@/lib/ratingList';

const head = (ws) => { const r = ws.getRow(1); r.font = { bold: true }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF8' } }; };
/** Excel: faculty ratings – Summary (per faculty) + Ratings (every student response). */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const q = new URL(req.url).searchParams;
  const rows = await ratingList({ course: q.get('course'), faculty: q.get('faculty'), from: q.get('from'), to: q.get('to') });
  const wb = new ExcelJS.Workbook();
  const s = wb.addWorksheet('Summary');
  s.columns = [{ header: 'Faculty', width: 26 }, { header: 'Mobile', width: 13 }, { header: 'Classes rated', width: 13 }, { header: 'Responses', width: 11 }, { header: 'Clarity avg (/5)', width: 15 }, { header: 'Teaching avg (/5)', width: 16 }];
  byFaculty(rows).forEach((x) => s.addRow([x.name, x.mobile, x.classes, x.n, x.clarity, x.teaching]));
  head(s);
  const r = wb.addWorksheet('Ratings', { views: [{ state: 'frozen', ySplit: 1 }] });
  r.columns = [{ header: 'Class date', width: 11 }, { header: 'Time', width: 18 }, { header: 'Course', width: 32 }, { header: 'Faculty', width: 24 }, { header: 'Subject', width: 22 }, { header: 'Topic', width: 32 },
    { header: 'Student', width: 22 }, { header: 'Reg No', width: 16 }, { header: 'Clarity (/5)', width: 11 }, { header: 'Clarity', width: 22 }, { header: 'Teaching (/5)', width: 12 }, { header: 'Comment', width: 40 }, { header: 'Given at', width: 17 }];
  rows.forEach((x) => r.addRow([dmy(x.d), `${t12(x.t_from)} – ${t12(x.t_to)}`, x.course, x.faculty, x.subject, x.topic || '', x.student, x.reg_no, x.clarity, CLARITY[x.clarity], x.teaching, x.comment || '', x.at]));
  head(r);
  return new Response(await wb.xlsx.writeBuffer(), { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="faculty_ratings.xlsx"' } });
}
