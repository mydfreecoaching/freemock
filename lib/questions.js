import ExcelJS from 'exceljs';

export const HEADERS = ['qno', 'section', 'en_question', 'en_A', 'en_B', 'en_C', 'en_D', 'ta_question', 'ta_A', 'ta_B', 'ta_C', 'ta_D', 'answer'];
const SEC = { 'தமிழ்': 'தமிழ்', TAMIL: 'தமிழ்', GT: 'தமிழ்', GS: 'GS', APT: 'APT', APTITUDE: 'APT' };

const cellText = (v) => {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((r) => r.text).join('');
    if (v.text != null) return String(v.text);
    if (v.result != null) return String(v.result);
    if (v instanceof Date) return v.toISOString();
  }
  return String(v);
};
const clean = (s) => cellText(s).replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();

export function normalize(rows) {
  const out = [], errors = [], seen = new Set();
  for (const r of rows) {
    const qno = Number(r.qno);
    if (!Number.isInteger(qno) || qno < 1 || qno > 300) { if (Object.values(r).some((x) => String(x ?? '').trim())) errors.push(`qno தவறு: ${r.qno}`); continue; }
    if (seen.has(qno)) { errors.push(`வினா ${qno} இருமுறை உள்ளது`); continue; }
    seen.add(qno);
    const answer = String(r.answer || '').trim().toUpperCase().replace(/[()]/g, '');
    const section = SEC[String(r.section || '').trim().toUpperCase()] || SEC[String(r.section || '').trim()] || (qno <= 100 ? 'தமிழ்' : 'GS');
    const en_opts = [r.en_A, r.en_B, r.en_C, r.en_D].map(clean);
    const ta_opts = [r.ta_A, r.ta_B, r.ta_C, r.ta_D].map(clean);
    const q = { qno, section, en_q: clean(r.en_question), en_opts, ta_q: clean(r.ta_question), ta_opts, answer };
    if (!['A', 'B', 'C', 'D'].includes(answer)) errors.push(`வினா ${qno}: விடை A/B/C/D ஆக இருக்க வேண்டும் (உள்ளது: "${r.answer ?? ''}")`);
    if (!q.en_q && !q.ta_q) errors.push(`வினா ${qno}: வினா உரை இல்லை`);
    const filled = (o) => o.filter(Boolean).length;
    if (filled(en_opts) < 4 && filled(ta_opts) < 4) errors.push(`வினா ${qno}: 4 விருப்பங்கள் இல்லை`);
    out.push(q);
  }
  out.sort((a, b) => a.qno - b.qno);
  out.forEach((q, i) => { if (q.qno !== i + 1) errors.push(`வினா எண் ${i + 1} இல்லை`); });
  return { questions: out, errors: [...new Set(errors)].slice(0, 40) };
}

export async function parseUpload(file) {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.json')) {
    const arr = JSON.parse(buf.toString('utf8'));
    return normalize(arr.map((q) => ({
      qno: q.qno, section: q.section, en_question: q.en_q ?? q.en_question, ta_question: q.ta_q ?? q.ta_question, answer: q.answer,
      en_A: q.en_opts?.[0] ?? q.en_A, en_B: q.en_opts?.[1] ?? q.en_B, en_C: q.en_opts?.[2] ?? q.en_C, en_D: q.en_opts?.[3] ?? q.en_D,
      ta_A: q.ta_opts?.[0] ?? q.ta_A, ta_B: q.ta_opts?.[1] ?? q.ta_B, ta_C: q.ta_opts?.[2] ?? q.ta_C, ta_D: q.ta_opts?.[3] ?? q.ta_D,
    })));
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  const head = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => { head[i] = cellText(c.value).trim(); });
  const missing = HEADERS.filter((h) => !head.includes(h));
  if (missing.length) return { questions: [], errors: [`Excel தலைப்பு வரிசையில் இவை இல்லை: ${missing.join(', ')}`] };
  const rows = [];
  ws.eachRow((row, rn) => {
    if (rn === 1) return;
    const o = {};
    head.forEach((h, i) => { if (h) o[h] = row.getCell(i).value; });
    o.qno = cellText(o.qno); o.answer = cellText(o.answer); o.section = cellText(o.section);
    rows.push(o);
  });
  return normalize(rows);
}

export async function templateWorkbook(sample = []) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('questions');
  ws.columns = HEADERS.map((h) => ({ header: h, key: h, width: h.endsWith('question') ? 60 : h === 'qno' || h === 'answer' ? 7 : h === 'section' ? 9 : 28 }));
  ws.getRow(1).font = { bold: true };
  for (const q of sample) ws.addRow({ qno: q.qno, section: q.section, en_question: q.en_q, en_A: q.en_opts[0], en_B: q.en_opts[1], en_C: q.en_opts[2], en_D: q.en_opts[3], ta_question: q.ta_q, ta_A: q.ta_opts[0], ta_B: q.ta_opts[1], ta_C: q.ta_opts[2], ta_D: q.ta_opts[3], answer: q.answer });
  ws.eachRow((r) => { r.alignment = { wrapText: true, vertical: 'top' }; });
  const help = wb.addWorksheet('வழிமுறை');
  [
    ['qno', '1 முதல் 200 வரை வினா எண்'],
    ['section', 'தமிழ் / GS / APT (திறனறிவு & காரணவியல்)'],
    ['en_question, en_A … en_D', 'ஆங்கில வினா, விருப்பங்கள் (பொதுத்தமிழ் வினாக்களுக்குக் காலியாக விடலாம்)'],
    ['ta_question, ta_A … ta_D', 'தமிழ் வினா, விருப்பங்கள்'],
    ['answer', 'A / B / C / D'],
    ['வரிகள்', 'கூற்றுகள் போன்றவற்றை Alt+Enter மூலம் தனி வரிகளாக எழுதலாம்'],
    ['பொருத்துக அட்டவணை', 'ஒவ்வொரு வரிசையையும் "a. மொகஞ்சதாரோ | 1. கப்பல் துறைமுகம்" என  " | " கொண்டு எழுதினால் அட்டவணையாகக் காட்டப்படும்'],
  ].forEach((r) => help.addRow(r));
  help.getColumn(1).width = 28; help.getColumn(2).width = 100;
  return wb.xlsx.writeBuffer();
}
