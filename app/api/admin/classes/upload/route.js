import ExcelJS from 'exceljs';
import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';

const pad = (n) => String(n).padStart(2, '0');
function toDate(v) {
  if (v instanceof Date) return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  return null;
}
function toTime(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}`;
  if (typeof v === 'number' && v < 1) { const m = Math.round(v * 1440); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
  const s = String(v).trim().toUpperCase();
  const m = s.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/);
  if (!m) return undefined;
  let h = Number(m[1]); if (m[3] === 'PM' && h < 12) h += 12; if (m[3] === 'AM' && h === 12) h = 0;
  return h < 24 && Number(m[2]) < 60 ? `${pad(h)}:${m[2]}` : undefined;
}
const cellVal = (c) => (c && typeof c === 'object' && !(c instanceof Date) ? (c.result ?? c.text ?? c.richText?.map((r) => r.text).join('') ?? '') : c);

/** Replace a class's timetable from an Excel file: date | subject | faculty | hours | start_time | end_time */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const fd = await req.formData();
  const id = Number(fd.get('class_id'));
  const file = fd.get('file');
  if (!id || !file || typeof file === 'string' || !file.size) return Response.json({ error: 'கோப்பைத் தேர்வு செய்யவும்.' }, { status: 400 });
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(Buffer.from(await file.arrayBuffer())); } catch { return Response.json({ error: 'Excel (.xlsx) கோப்பைப் படிக்க இயலவில்லை.' }, { status: 400 }); }
  const ws = wb.worksheets[0];
  const head = (ws.getRow(1).values || []).map((v) => String(cellVal(v) ?? '').trim().toLowerCase());
  const col = (n) => head.indexOf(n);
  if (col('date') < 0 || col('subject') < 0) return Response.json({ error: 'முதல் வரிசையில் date, subject (தேவைப்பட்டால் faculty, hours, start_time, end_time) தலைப்புகள் இருக்க வேண்டும்.' }, { status: 400 });
  const rows = []; const errors = [];
  ws.eachRow((r, i) => {
    if (i === 1) return;
    const get = (n) => (col(n) < 0 ? null : cellVal(r.getCell(col(n)).value));
    const date = toDate(get('date')); const subject = String(get('subject') ?? '').trim();
    if (!date && !subject) return;
    const st = toTime(get('start_time')), et = toTime(get('end_time'));
    if (!date) errors.push(`வரிசை ${i}: தேதி தவறு`);
    else if (!subject) errors.push(`வரிசை ${i}: பாடம் இல்லை`);
    else if (st === undefined || et === undefined) errors.push(`வரிசை ${i}: நேரம் தவறு (எ.கா. 16:30 அல்லது 4:30 PM)`);
    else rows.push({ class_id: id, date, subject: subject.slice(0, 200), faculty: String(get('faculty') ?? '').trim().slice(0, 100) || null, hours: Number(get('hours')) || null, start_time: st, end_time: et });
  });
  if (errors.length) return Response.json({ error: errors.slice(0, 20).join('\n') }, { status: 400 });
  if (!rows.length) return Response.json({ error: 'வகுப்புகள் இல்லை.' }, { status: 400 });
  await sql.begin(async (tx) => {
    await tx`DELETE FROM class_sessions WHERE class_id=${id}`;
    for (let i = 0; i < rows.length; i += 500) await tx`INSERT INTO class_sessions ${tx(rows.slice(i, i + 500))}`;
  });
  return Response.json({ message: `${rows.length} வகுப்புகள் (${rows[0].date} – ${rows[rows.length - 1].date}) பதிவேற்றப்பட்டன.`, reload: true });
}
