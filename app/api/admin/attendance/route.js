import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { ensureSchema } from '@/lib/db';
import { ATT_DISTRICTS, attVenues, istToday, fmtDay } from '@/lib/attendance';
import { attendanceRows } from '@/lib/attendanceList';

/** Excel: students of a venue / district with their attendance for one day and totals. */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  await ensureSchema();
  const q = new URL(req.url).searchParams;
  const d = ATT_DISTRICTS.some(([c]) => c === q.get('d')) ? q.get('d') : 'TVR';
  const v = String(q.get('v') || '').split(',').filter((c) => attVenues(d).some((x) => x.code === c));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '') ? q.get('date') : istToday();
  const rows = await attendanceRows(d, v, date);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Attendance', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [{ header: '#', width: 5 }, { header: 'Reg No', width: 16 }, { header: 'Name', width: 26 }, { header: 'Mobile', width: 13 }, { header: 'Venue', width: 44 },
    { header: `Attendance ${fmtDay(date)}`, width: 16 }, { header: 'Marked at', width: 20 }, { header: 'Days present', width: 12 }, { header: 'Days marked', width: 12 }];
  ws.getRow(1).font = { bold: true };
  rows.forEach((r, i) => ws.addRow([i + 1, r.reg_no, r.name, r.mobile, r.venueTitle, r.status === 'P' ? 'Present' : r.status === 'A' ? 'Absent' : 'Not marked',
    r.marked_at ? new Date(r.marked_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '', r.present_total, r.marked_total]));
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="attendance_${d}_${v.join('-') || 'all'}_${date}.xlsx"` } });
}
