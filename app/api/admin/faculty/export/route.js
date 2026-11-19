import ExcelJS from 'exceljs';
import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';

const DN = { MYD: 'மயிலாடுதுறை', NGP: 'நாகப்பட்டினம்', TVR: 'திருவாரூர்', OTH: 'இதர' };
const ST = { approved: 'ஒப்புதல்', pending: 'காத்திருப்பு', rejected: 'நிராகரிப்பு' };

/** Admin: faculty details as Excel, with each person's passport photo in the first column. */
export async function GET() {
  const g = await guard(); if (g) return g;
  const rows = await sql`SELECT f.*, p.photo, (SELECT count(*) FROM faculty_sessions c WHERE c.faculty_id=f.id)::int cls,
      (SELECT count(*) FROM submissions s WHERE s.faculty_id=f.id)::int subs
    FROM faculty f LEFT JOIN faculty_photos p ON p.faculty_id=f.id
    ORDER BY (f.status='approved') DESC, f.name`;
  const CN = Object.fromEntries((await sql`SELECT id, name FROM coaching_courses`).map((c) => [c.id, c.name]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('பயிற்றுநர்கள்');
  const head = ['புகைப்படம்', 'வ.எண்', 'பெயர்', 'கைபேசி', 'மின்னஞ்சல்', 'பதவி', 'பணியிடம் / அலுவலகம்', 'மாவட்டம்', 'அனுபவம் (ஆண்டுகள்)', 'பயிற்சி நடத்திய / கற்பித்த இடங்கள்', 'பாடங்கள்', 'பயிற்சி வகுப்புகள்', 'நிலை', 'செயலில்', 'நடத்திய வகுப்புகள்', 'அனுப்பிய வினாத்தாள்கள்', 'பதிவு நாள்'];
  const h = ws.addRow(head);
  h.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  h.height = 36; // fixed height so photo anchors line up in every spreadsheet app
  h.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B57D0' } }; c.alignment = { wrapText: true, vertical: 'middle' }; });
  ws.columns = [14, 6, 24, 13, 24, 22, 30, 14, 10, 40, 30, 30, 12, 8, 10, 10, 12].map((width) => ({ width }));
  rows.forEach((f, i) => {
    const r = ws.addRow(['', i + 1, f.name, f.mobile, f.email || '', f.designation || '', f.office || '', DN[f.district] || f.district || '',
      f.exp_years != null ? Number(f.exp_years) : '', f.exp_places || '', f.subjects || '', (f.course_ids || []).map((id) => CN[id]).filter(Boolean).join('; '),
      ST[f.status] || f.status, f.active ? 'ஆம்' : 'இல்லை', f.cls, f.subs,
      f.created_at ? new Date(f.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '']);
    r.alignment = { wrapText: true, vertical: 'middle' };
    if (f.photo) {
      r.height = 100; // photo column 14 wide × 100 pt row ≈ passport 3.5 : 4.5
      const id = wb.addImage({ buffer: Buffer.from(f.photo), extension: 'jpeg' });
      ws.addImage(id, { tl: { col: 0, row: r.number - 1 }, br: { col: 1, row: r.number }, editAs: 'oneCell' }); // fills the cell
    } else { r.getCell(1).value = 'புகைப்படம் இல்லை'; r.height = 36; }
  });
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 3 }];
  ws.autoFilter = { from: { row: 1, column: 2 }, to: { row: 1, column: head.length } };
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="faculty_${new Date().toISOString().slice(0, 10)}.xlsx"` } });
}
