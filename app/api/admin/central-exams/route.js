import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { CX_LABEL, appsText } from '@/lib/centralExams';
import { cxList } from '@/lib/cxList';

const head = (ws) => { const r = ws.getRow(1); r.font = { bold: true }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF8' } }; };
/** Excel: SSC / IBPS / RRB – Students, Applications (one row per application), By exam. Same filters as the page. */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const q = new URL(req.url).searchParams;
  const f = { d: ['MYD', 'TVR', 'OTH'].includes(q.get('d')) ? q.get('d') : '', a: ['yes', 'no', 'none'].includes(q.get('a')) ? q.get('a') : '', x: CX_LABEL[q.get('x')] ? q.get('x') : '' };
  const { list, perExam } = await cxList(f);
  const wb = new ExcelJS.Workbook();
  const s = wb.addWorksheet('Students', { views: [{ state: 'frozen', ySplit: 1 }] });
  s.columns = [{ header: 'S.No', width: 6 }, { header: 'Reg No', width: 16 }, { header: 'Name', width: 24 }, { header: 'Mobile', width: 13 }, { header: 'District', width: 16 }, { header: 'Qualification', width: 16 },
    { header: 'Willing to join', width: 12 }, { header: 'Coaching wanted for', width: 40 }, { header: 'Applications (exam: number)', width: 50 }, { header: 'Answered at', width: 17 }];
  list.forEach((x, i) => s.addRow([i + 1, x.reg_no, x.name, x.mobile, x.district_other || x.district, x.qualification || '', x.cx_at ? (x.cx_interest ? 'Yes' : 'No') : 'Not answered',
    (x.cx_exams || []).map((k) => CX_LABEL[k]).join(', '), x.cx_apps?.length ? appsText(x.cx_apps) : x.cx_none ? 'Not applied' : '', x.cx_at || '']));
  head(s);
  const a = wb.addWorksheet('Applications', { views: [{ state: 'frozen', ySplit: 1 }] });
  a.columns = [{ header: 'Reg No', width: 16 }, { header: 'Name', width: 24 }, { header: 'Mobile', width: 13 }, { header: 'District', width: 16 }, { header: 'Exam', width: 32 }, { header: 'Application / Reg. No', width: 22 }, { header: 'Details', width: 30 }];
  list.forEach((x) => (x.cx_apps || []).filter((p) => !f.x || p.exam === f.x).forEach((p) => a.addRow([x.reg_no, x.name, x.mobile, x.district_other || x.district, p.exam === 'OTHER' ? p.note : CX_LABEL[p.exam], p.app_no, p.exam === 'OTHER' ? '' : p.note || ''])));
  head(a);
  const e = wb.addWorksheet('By exam');
  e.columns = [{ header: 'Exam', width: 34 }, { header: 'Willing (coaching)', width: 16 }, { header: 'Applied', width: 10 }];
  perExam.forEach((r) => e.addRow([r.l, r.want, r.applied]));
  head(e);
  return new Response(await wb.xlsx.writeBuffer(), { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="ssc_ibps_rrb_${f.d || 'all'}.xlsx"` } });
}
