import ExcelJS from 'exceljs';
import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { scoreLimits, checkCounts, applyVerified } from '@/lib/offline';
import { clearLbCache } from '@/lib/lb';

const cellText = (v) => {
  if (v == null) return '';
  if (typeof v === 'object') return String(v.result ?? v.text ?? (v.richText ? v.richText.map((x) => x.text).join('') : '')).trim();
  return String(v).trim();
};

/**
 * Admin: upload paper-test results of one test from Excel (Reg No or mobile | Correct | Wrong).
 * Every valid row is saved as an office entry and joins the rankings at once; rows with problems are listed and skipped.
 */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const fd = await req.formData();
  const id = Number(fd.get('test_id'));
  const file = fd.get('file');
  if (!id || !file || typeof file === 'string' || !file.size) return Response.json({ error: 'Excel கோப்பைத் தேர்வு செய்யவும்.' }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return Response.json({ error: 'கோப்பு 4 MB-க்குள் இருக்க வேண்டும்.' }, { status: 400 });
  const [t] = await sql`SELECT * FROM tests WHERE id=${id}`;
  if (!t) return Response.json({ error: 'தேர்வு இல்லை.' }, { status: 404 });
  const lim = await scoreLimits(t);
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(Buffer.from(await file.arrayBuffer())); } catch { return Response.json({ error: 'கோப்பைப் படிக்க இயலவில்லை – .xlsx (Excel) கோப்பைப் பதிவேற்றவும்.' }, { status: 400 }); }
  const ws = wb.worksheets[0];
  const rows = [];
  ws.eachRow((row, n) => {
    if (n === 1) return; // header
    const reg = cellText(row.getCell(1).value).toUpperCase().replace(/\s+/g, '');
    const c = cellText(row.getCell(2).value), w = cellText(row.getCell(3).value);
    if (!reg && !c && !w) return;
    if (/^MYD2026000001$/.test(reg) && /எடுத்துக்காட்டு/.test(cellText(row.getCell(4).value))) return; // sample row
    rows.push({ n, reg, c, w });
  });
  if (!rows.length) return Response.json({ error: 'கோப்பில் விவரங்கள் இல்லை.' }, { status: 400 });
  if (rows.length > 2000) return Response.json({ error: 'ஒரு முறை 2000 வரிகள் வரை மட்டும்.' }, { status: 400 });

  const errs = []; let added = 0, updated = 0, skipped = 0;
  const seen = new Set();
  for (const r of rows) {
    const bad = (m) => errs.push(`வரி ${r.n} (${r.reg || '—'}): ${m}`);
    if (!r.reg) { bad('பதிவு எண் இல்லை'); continue; }
    const [s] = await sql`SELECT id, name FROM students WHERE ${r.reg} IN (reg_no, old_reg_no) OR mobile=${r.reg} LIMIT 1`;
    if (!s) { bad('இந்தப் பதிவு எண் / கைபேசி எண்ணில் மாணவர் இல்லை'); continue; }
    if (seen.has(s.id)) { bad('இதே மாணவர் கோப்பில் மீண்டும் வருகிறார் – முதல் வரி மட்டும் எடுக்கப்பட்டது'); continue; }
    seen.add(s.id);
    const k = checkCounts({ correct: r.c, wrong: r.w }, lim);
    if (k.error) { bad(k.error); continue; }
    const [a] = await sql`SELECT offline FROM attempts WHERE test_id=${id} AND student_id=${s.id}`;
    if (a && !a.offline) { skipped++; bad(`${s.name} இணையவழியில் ஏற்கனவே எழுதியுள்ளார் – தவிர்க்கப்பட்டது`); continue; }
    const [o] = await sql`INSERT INTO offline_scores (test_id, student_id, score, correct, wrong, minutes, status, by_admin, verified_at)
      VALUES (${id}, ${s.id}, ${k.score}, ${k.correct}, ${k.wrong}, ${k.minutes}, 'verified', true, now())
      ON CONFLICT (test_id, student_id) DO UPDATE SET score=EXCLUDED.score, correct=EXCLUDED.correct, wrong=EXCLUDED.wrong, minutes=EXCLUDED.minutes,
        status='verified', by_admin=true, note=NULL, verified_at=now(), updated_at=now()
      RETURNING *, (xmax <> 0) AS existed`;
    await applyVerified(o, t);
    if (o.existed) updated++; else added++;
  }
  clearLbCache();
  const head = `✅ ${added} புதியவை சேர்க்கப்பட்டன${updated ? `, ${updated} புதுப்பிக்கப்பட்டன` : ''} – தரவரிசையில் இணைக்கப்பட்டது.`;
  if (!errs.length) return Response.json({ message: head, reload: true });
  // keep the page so the problem rows can be read
  return Response.json({ message: `${head}\n⚠️ ${errs.length} வரிகள் சேர்க்கப்படவில்லை:\n${errs.slice(0, 60).join('\n')}${errs.length > 60 ? `\n… மேலும் ${errs.length - 60}` : ''}` });
}
