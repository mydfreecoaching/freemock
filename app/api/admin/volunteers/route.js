import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { ensureSchema } from '@/lib/db';
import { volunteerRows } from '@/lib/volunteerList';
import { vVenues } from '@/lib/volunteers';

/** Excel of resource persons (all, or one venue with ?v=TVCn). */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  await ensureSchema();
  const venue = String(new URL(req.url).searchParams.get('v') || '');
  const rows = await volunteerRows(venue);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Resource persons', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    { header: '#', width: 5 }, { header: 'Name', width: 24 }, { header: 'Mobile', width: 13 }, { header: 'Email', width: 24 },
    { header: 'Department', width: 30 }, { header: 'Designation', width: 22 }, { header: 'Office / place', width: 30 }, { header: 'Qualification', width: 16 },
    { header: 'Subjects', width: 40 }, { header: 'Preferred venues', width: 40 }, { header: 'Days', width: 14 }, { header: 'Experience / notes', width: 40 }, { header: 'Registered', width: 16 },
  ];
  ws.getRow(1).font = { bold: true };
  rows.forEach((r, i) => ws.addRow([i + 1, r.name, r.mobile, r.email || '', r.deptText, r.designation, r.office, r.qualification || '', r.subjectsText, r.venuesText, r.daysText, r.experience || '',
    new Date(r.updated_at || r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]));
  ws.eachRow((row) => { row.alignment = { wrapText: true, vertical: 'top' }; });
  const vn = venue ? (Object.fromEntries(vVenues())[venue] || venue).split(' – ')[0] : 'all';
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`resource_persons_${vn}.xlsx`)}` } });
}
