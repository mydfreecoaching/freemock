import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { VENUE_LABEL } from '@/lib/venues';
import { g4OffList, offText } from '@/lib/g4OfflineList';

const head = (ws) => { const r = ws.getRow(1); r.font = { bold: true }; r.alignment = { wrapText: true, vertical: 'middle' }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF8' } }; };
/** Excel: offline Group 4 mock test answers – Students (filtered as on the page) + Summary. */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const q = new URL(req.url).searchParams;
  const f = { d: ['MYD', 'TVR'].includes(q.get('d')) ? q.get('d') : '', a: ['yes', 'no', 'none'].includes(q.get('a')) ? q.get('a') : '', g: ['yes', 'no'].includes(q.get('g')) ? q.get('g') : '' };
  const { list, summary } = await g4OffList(f);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Students', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [{ header: 'S.No', width: 6 }, { header: 'Reg No', width: 16 }, { header: 'Name', width: 26 }, { header: 'Mobile', width: 13 }, { header: 'District', width: 14 },
    { header: 'Coaching venue', width: 45 }, { header: 'Offline G4 mock tests', width: 14 }, { header: 'Group 4 applied', width: 10 }, { header: 'Group 4 application no.', width: 20 }, { header: 'Answered at', width: 17 }];
  list.forEach((s, i) => ws.addRow([i + 1, s.reg_no, s.name, s.mobile, s.district, VENUE_LABEL(s.coaching_venue), offText(s.g4_offline), s.g4_applied ? 'Yes' : 'No', s.g4_app_no || '', s.answered_at || '']));
  head(ws);
  const sm = wb.addWorksheet('Summary');
  sm.columns = [{ header: 'District', width: 16 }, { header: 'Students', width: 10 }, { header: 'Yes', width: 8 }, { header: 'Yes – G4 applied', width: 14 }, { header: 'Yes – not applied', width: 14 }, { header: 'No', width: 8 }, { header: 'Not answered', width: 12 }];
  summary.forEach((s) => sm.addRow([s.d === 'MYD' ? 'Mayiladuthurai' : 'Thiruvarur', s.total, s.yes, s.yesApplied, s.yesNotApplied, s.no, s.none]));
  head(sm);
  return new Response(await wb.xlsx.writeBuffer(), { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="g4_offline_mock_${f.d || 'MYD_TVR'}_${f.a || 'all'}.xlsx"` } });
}
