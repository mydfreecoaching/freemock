import ExcelJS from 'exceljs';
import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { DISTRICT_EN, GENDER_LABEL, PRIORITY_LABEL } from '@/lib/util';
import { studentList, XLSX_PAGE, listFilters } from '@/lib/studentList';
import { VENUE_LABEL, GUIDANCE_LABEL } from '@/lib/venues';

/** Excel of registered students with their passport photos embedded (400 per file: ?p=1,2,…). */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const u = new URL(req.url).searchParams;
  const f = listFilters((k) => u.get(k) || '');
  const page = Math.max(1, Number(u.get('p')) || 1);
  const all = await studentList(f);
  const rows = all.slice((page - 1) * XLSX_PAGE, page * XLSX_PAGE);
  const ids = rows.filter((r) => r.has_photo).map((r) => r.id);
  const photos = ids.length ? await sql`SELECT student_id, thumb FROM student_photos WHERE student_id = ANY(${ids})` : [];
  const thumb = Object.fromEntries(photos.map((p) => [p.student_id, p.thumb]));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Students', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    { header: 'S.No', width: 6 }, { header: 'Photo', width: 12 }, { header: 'Reg No', width: 16 }, { header: 'Name', width: 26 },
    { header: 'Mobile', width: 13 }, { header: 'Email', width: 28 }, { header: 'DOB', width: 11 }, { header: 'Gender', width: 9 },
    { header: 'Community', width: 11 }, { header: 'District', width: 18 }, { header: 'Qualification', width: 18 }, { header: 'Priority', width: 22 }, { header: 'Coaching venue', width: 34 }, { header: 'Group 2/2A applied', width: 10 }, { header: 'Group 2/2A application no.', width: 20 }, { header: 'Group 4 applied', width: 10 }, { header: 'Group 4 application no.', width: 20 }, { header: 'Guidance programme', width: 34 }, { header: 'Registered on', width: 13 },
  ];
  ws.getRow(1).font = { bold: true }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E3D3' } };
  rows.forEach((r, i) => {
    const row = ws.addRow([(page - 1) * XLSX_PAGE + i + 1, r.has_photo ? '' : 'No photo', r.reg_no, r.name, r.mobile, r.email || '', r.dob,
      GENDER_LABEL[r.gender] || '', r.community || '', `${r.district} – ${DISTRICT_EN[r.district] || ''}`, r.qualification || '',
      (r.priority || []).map((p) => (p === 'OTHER' ? `Other: ${r.priority_other || ''}` : PRIORITY_LABEL[p] || p)).join('; '), VENUE_LABEL(r.coaching_venue), r.g2_applied ? 'Yes' : r.g2_applied === false ? 'No' : '', r.g2_app_no || '', r.g4_applied ? 'Yes' : r.g4_applied === false ? 'No' : '', r.g4_app_no || '', (r.guidance || []).map((k) => GUIDANCE_LABEL[k]).join('; '), r.reg_at]);
    row.height = 78; row.alignment = { vertical: 'middle', wrapText: true };
    if (thumb[r.id]) {
      const img = wb.addImage({ buffer: thumb[r.id], extension: 'jpeg' });
      ws.addImage(img, { tl: { col: 1.1, row: row.number - 1 + 0.06 }, ext: { width: 72, height: 93 }, editAs: 'oneCell' });
    }
  });
  const buf = await wb.xlsx.writeBuffer();
  const name = `students${f.d ? '_' + DISTRICT_EN[f.d].replace(/\W+/g, '') : ''}${f.y ? '_' + f.y : ''}${all.length > XLSX_PAGE ? '_part' + page : ''}.xlsx`;
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="${name}"` } });
}
