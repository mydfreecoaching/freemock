import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { VENUE_LABEL } from '@/lib/venues';
import { ATT_DISTRICTS } from '@/lib/attendance';
import { CLASS_SOURCES, sourceText } from '@/lib/classSource';
import { classSourceStats } from '@/lib/classSourceStats';

const bold = (row) => { row.font = { bold: true }; };
const head = (ws) => { const r = ws.getRow(1); r.font = { bold: true }; r.alignment = { wrapText: true, vertical: 'middle' }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF8' } }; };

/** Excel: "how students heard about the classes" – Sources, By venue, Students (3 sheets). ?d=TVR|MYD (default both). */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const { d, all, answered, sources, venues, totalPicks } = await classSourceStats(new URL(req.url).searchParams.get('d') || '');
  const scope = d ? ATT_DISTRICTS.find(([c]) => c === d)[1] : 'Thiruvarur + Mayiladuthurai';
  const wb = new ExcelJS.Workbook();

  const s1 = wb.addWorksheet('Sources', { views: [{ state: 'frozen', ySplit: 1 }] });
  s1.columns = [{ header: 'எவ்வாறு தெரிய வந்தது / Source', width: 60 }, { header: 'Students', width: 12 }, { header: '% of students answered', width: 14 }];
  sources.forEach((s) => s1.addRow([s.l, s.n, answered.length ? Math.round((s.n * 1000) / answered.length) / 10 : 0]));
  bold(s1.addRow(['Total selections', totalPicks, '']));
  bold(s1.addRow(['Students answered', answered.length, 100]));
  s1.addRow(['Class students (all)', all.length, '']);
  s1.addRow(['Not answered yet', all.length - answered.length, '']);
  s1.addRow([`Scope: ${scope}`]);
  head(s1);

  const s2 = wb.addWorksheet('By venue', { views: [{ state: 'frozen', ySplit: 1, xSplit: 1 }] });
  s2.columns = [{ header: 'Venue', width: 50 }, { header: 'Students', width: 10 }, ...CLASS_SOURCES.map(([, l]) => ({ header: l.split(' / ')[0], width: 14 }))];
  venues.forEach((r) => s2.addRow([VENUE_LABEL(r.v), r.n, ...CLASS_SOURCES.map(([k]) => r.by[k] || 0)]));
  bold(s2.addRow(['Total', answered.length, ...CLASS_SOURCES.map(([k]) => sources.find((s) => s.k === k).n)]));
  head(s2); s2.getRow(1).height = 60;

  const s3 = wb.addWorksheet('Students', { views: [{ state: 'frozen', ySplit: 1 }] });
  s3.columns = [{ header: 'S.No', width: 6 }, { header: 'Reg No', width: 16 }, { header: 'Name', width: 26 }, { header: 'Mobile', width: 13 }, { header: 'District', width: 14 },
    { header: 'Venue', width: 50 }, { header: 'How they heard', width: 60 }];
  all.forEach((s, i) => s3.addRow([i + 1, s.reg_no, s.name, s.mobile, s.district, VENUE_LABEL(s.coaching_venue), sourceText(s) || 'Not answered yet']));
  head(s3);

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="class_source_${d || 'TVR_MYD'}.xlsx"` } });
}
