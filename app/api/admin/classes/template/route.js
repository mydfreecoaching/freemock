import ExcelJS from 'exceljs';
import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';

/** Timetable template; with ?class=ID the class's current timetable is filled in. */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get('class')) || null;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('timetable');
  ws.columns = [
    { header: 'date', key: 'date', width: 13 }, { header: 'subject', key: 'subject', width: 30 }, { header: 'faculty', key: 'faculty', width: 20 },
    { header: 'hours', key: 'hours', width: 8 }, { header: 'start_time', key: 'start_time', width: 11 }, { header: 'end_time', key: 'end_time', width: 11 },
  ];
  ws.getRow(1).font = { bold: true };
  const rows = id ? await sql`SELECT to_char(date,'DD-MM-YYYY') date, subject, faculty, hours, start_time, end_time FROM class_sessions s WHERE s.class_id=${id} ORDER BY s.date, s.start_time NULLS LAST, s.id` : [];
  if (rows.length) rows.forEach((r) => ws.addRow({ ...r, hours: r.hours != null ? Number(r.hours) : null }));
  else ws.addRow({ date: '09-07-2026', subject: 'Polity-1', faculty: 'ஆசிரியர் பெயர்', hours: 1.5, start_time: '16:30', end_time: '18:00' });
  ws.getColumn('date').numFmt = '@';
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="timetable${id ? '-' + id : ''}.xlsx"` } });
}
