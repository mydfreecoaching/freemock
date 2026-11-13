import ExcelJS from 'exceljs';
import { guard } from '@/lib/adminGuard';
import { parseFilters, venueWriters } from '@/lib/venueWriters';
import { studentInfo, STUDENT_HEAD, studentCells } from '@/lib/studentCols';

const dmy = (k) => `${k.slice(8, 10)}.${k.slice(5, 7)}.${k.slice(0, 4)}`;
const HEAD = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B57D0' } } };
const style = (row) => row.eachCell((c) => { c.font = HEAD.font; c.fill = HEAD.fill; c.alignment = { wrapText: true, vertical: 'middle' }; });
const bold = (row) => { row.font = { bold: true }; row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF3FB' } }; }); };

/** Admin: writers by place – Excel (place-wise, day-wise, and every attempt). */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const f = parseFilters({ ...sp, view: 'daily' });
  const x = await venueWriters(f);
  const period = f.from === f.to ? dmy(f.from) : `${dmy(f.from)} – ${dmy(f.to)}`;
  const wb = new ExcelJS.Workbook();
  const vals = (r) => [...x.cats.map((c) => r.by[c] || 0), r.people, r.attempts];

  const ws = wb.addWorksheet('இட வாரியாக');
  ws.addRow([`இட வாரியாக எழுதியவர்கள் – ${period}`]).font = { bold: true, size: 13 };
  ws.addRow(['எண்கள் = தனி நபர்கள்; "எழுதிய தேர்வுகள்" = மொத்த முயற்சிகள்']);
  style(ws.addRow(['மாவட்டம்', 'இடம்', ...x.cats, 'மொத்த நபர்கள்', 'எழுதிய தேர்வுகள்']));
  for (const d of x.placeTable) {
    bold(ws.addRow([d.district, 'மாவட்ட மொத்தம்', ...vals(d.sum)]));
    for (const p of d.places) ws.addRow([d.district, p.place, ...vals(p)]);
  }
  bold(ws.addRow(['மொத்தம்', '', ...vals(x.total)]));
  ws.columns.forEach((c, i) => { c.width = i === 0 ? 16 : i === 1 ? 42 : 16; });
  ws.views = [{ state: 'frozen', ySplit: 3, xSplit: 2 }];

  const wd = wb.addWorksheet('நாள் வாரியாக');
  style(wd.addRow(['நாள்', 'மாவட்டம்', 'இடம்', ...x.cats, 'மொத்த நபர்கள்', 'எழுதிய தேர்வுகள்']));
  for (const d of x.dayTable) {
    bold(wd.addRow([dmy(d.day), '', 'அன்றைய மொத்தம்', ...vals(d.sum)]));
    for (const p of d.places) wd.addRow([dmy(d.day), p.district, p.place, ...vals(p)]);
  }
  wd.columns.forEach((c, i) => { c.width = i === 2 ? 42 : i < 2 ? 14 : 16; });
  wd.views = [{ state: 'frozen', ySplit: 1 }];

  const info = await studentInfo(x.rows.map((r) => r.reg_no));
  const wr = wb.addWorksheet('விவரம்');
  style(wr.addRow(['நாள்', 'பதிவு எண்', 'பெயர்', 'கைபேசி', 'மாவட்டம்', 'இடம்', 'தேர்வு · வகை · உப தலைப்பு', 'தேர்வுப் பெயர்', 'மதிப்பெண்', 'முறை', ...STUDENT_HEAD]));
  for (const r of x.rows) wr.addRow([dmy(r.day), r.reg_no, r.name, r.mobile, r.district, r.place, r.cat, `${r.unit ? `அலகு ${r.unit} · ` : ''}${r.title}`, r.score, r.offline ? 'நேரடி (அலுவலகம்)' : 'இணையவழி', ...studentCells(info[r.reg_no])]);
  wr.columns.forEach((c, i) => { c.width = [12, 16, 24, 13, 14, 36, 40, 40, 10][i]; });
  wr.views = [{ state: 'frozen', ySplit: 1 }];
  wr.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 10 + STUDENT_HEAD.length } };

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="writers_by_place_${f.from}_${f.to}.xlsx"` } });
}
