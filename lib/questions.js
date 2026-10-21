import ExcelJS from 'exceljs';
import { sheetPictures, storePicture, slotOf } from './qimages';

export const HEADERS = ['qno', 'section', 'en_question', 'en_A', 'en_B', 'en_C', 'en_D', 'ta_question', 'ta_A', 'ta_B', 'ta_C', 'ta_D', 'answer'];
export const OPTIONAL = ['en_E', 'ta_E'];
const ALL = ['qno', 'section', 'en_question', 'en_A', 'en_B', 'en_C', 'en_D', 'en_E', 'ta_question', 'ta_A', 'ta_B', 'ta_C', 'ta_D', 'ta_E', 'answer'];
const SEC = { 'தமிழ்': 'தமிழ்', TAMIL: 'தமிழ்', GT: 'தமிழ்', 'GENERAL TAMIL': 'தமிழ்', 'பொதுத்தமிழ்': 'தமிழ்', GS: 'GS', 'GENERAL STUDIES': 'GS', APT: 'APT', APTITUDE: 'APT' };

const cellText = (v) => {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.error) return '';
    if (v.formula && /DISPIMG/i.test(v.formula)) return '';
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
    const qno = Number(cellText(r.qno).trim());
    if (!Number.isInteger(qno) || qno < 1 || qno > 300) { if (Object.values(r).some((x) => cellText(x).trim())) errors.push(`qno தவறு: ${cellText(r.qno)}`); continue; }
    if (seen.has(qno)) { errors.push(`வினா ${qno} இருமுறை உள்ளது`); continue; }
    seen.add(qno);
    const answer = cellText(r.answer).trim().toUpperCase().replace(/[()\s.]/g, '');
    const rawSec = cellText(r.section).trim();
    const section = SEC[rawSec.toUpperCase()] || SEC[rawSec] || rawSec.slice(0, 40);
    const en_opts = [r.en_A, r.en_B, r.en_C, r.en_D, r.en_E].map(clean);
    const ta_opts = [r.ta_A, r.ta_B, r.ta_C, r.ta_D, r.ta_E].map(clean);
    const nopts = en_opts[4] || ta_opts[4] ? 5 : 4;
    if (nopts === 4) { en_opts.pop(); ta_opts.pop(); }
    const imgs = Object.fromEntries(Object.entries(r.__imgs || r.imgs || {}).filter(([k, v]) => /^[qA-E]$/.test(k) && /^[0-9a-f]{8,40}$/.test(String(v))));
    if (nopts === 4) delete imgs.E;
    const q = { qno, section, en_q: clean(r.en_question), en_opts, ta_q: clean(r.ta_question), ta_opts, answer, nopts, imgs };
    const allowed = nopts === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
    if (!allowed.includes(answer)) errors.push(`வினா ${qno}: விடை ${allowed.join('/')} ஆக இருக்க வேண்டும் (உள்ளது: "${cellText(r.answer)}")`);
    if (!q.en_q && !q.ta_q && !imgs.q) errors.push(`வினா ${qno}: வினா உரை இல்லை`);
    const filled = (o) => o.filter((x, k) => x || imgs['ABCDE'[k]]).length;
    if (filled(en_opts) < nopts && filled(ta_opts) < nopts) errors.push(`வினா ${qno}: ${nopts} விருப்பங்கள் இல்லை`);
    out.push(q);
  }
  out.sort((a, b) => a.qno - b.qno);
  out.forEach((q, i) => { if (q.qno !== i + 1) errors.push(`வினா எண் ${i + 1} இல்லை`); });
  const tnpsc200 = out.length === 200;
  for (const q of out) if (!q.section) q.section = tnpsc200 ? (q.qno <= 100 ? 'தமிழ்' : 'GS') : 'General';
  return { questions: out, errors: [...new Set(errors)].slice(0, 40) };
}

export async function parseUpload(file) {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.json')) {
    const arr = JSON.parse(buf.toString('utf8'));
    return normalize(arr.map((q) => ({
      qno: q.qno, section: q.section, en_question: q.en_q ?? q.en_question, ta_question: q.ta_q ?? q.ta_question, answer: q.answer,
      en_A: q.en_opts?.[0] ?? q.en_A, en_B: q.en_opts?.[1] ?? q.en_B, en_C: q.en_opts?.[2] ?? q.en_C, en_D: q.en_opts?.[3] ?? q.en_D, en_E: q.en_opts?.[4] ?? q.en_E,
      ta_A: q.ta_opts?.[0] ?? q.ta_A, ta_B: q.ta_opts?.[1] ?? q.ta_B, ta_C: q.ta_opts?.[2] ?? q.ta_C, ta_D: q.ta_opts?.[3] ?? q.ta_D, ta_E: q.ta_opts?.[4] ?? q.ta_E, imgs: q.imgs,
    })));
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  const head = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => { head[i] = cellText(c.value).trim(); });
  const missing = HEADERS.filter((h) => !head.includes(h));
  if (missing.length) return { questions: [], errors: [`Excel தலைப்பு வரிசையில் இவை இல்லை: ${missing.join(', ')}`] };
  // pictures in question / option cells → stored once, referenced by id per row and slot
  const pics = await sheetPictures(buf, wb, ws);
  const rowImgs = {}, picErrors = [];
  for (const [key, b] of Object.entries(pics)) {
    const [rn, cn] = key.split(':').map(Number);
    const slot = slotOf(head[cn]);
    if (rn < 2 || !slot) continue;
    try { const id = await storePicture(b); (rowImgs[rn] ??= {})[slot] ??= id; }
    catch (e) { picErrors.push(`வரிசை ${rn} (${head[cn]}): படத்தைப் படிக்க இயலவில்லை – ${e.message}`); }
  }
  const rows = [];
  ws.eachRow((row, rn) => {
    if (rn === 1) return;
    const o = {};
    head.forEach((h, i) => { if (h) o[h] = row.getCell(i).value; });
    if (rowImgs[rn]) o.__imgs = rowImgs[rn];
    rows.push(o);
  });
  const r = normalize(rows);
  if (picErrors.length) r.errors = [...picErrors, ...r.errors].slice(0, 40);
  return r;
}

export async function templateWorkbook(sample = [], pics = {}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('questions');
  ws.columns = ALL.map((h) => ({ header: h, key: h, width: h.endsWith('question') ? 60 : h === 'qno' || h === 'answer' ? 7 : h === 'section' ? 9 : 28 }));
  ws.getRow(1).font = { bold: true };
  for (const q of sample) ws.addRow({ qno: q.qno, section: q.section, en_question: q.en_q, en_A: q.en_opts[0], en_B: q.en_opts[1], en_C: q.en_opts[2], en_D: q.en_opts[3], en_E: q.en_opts[4] || '', ta_question: q.ta_q, ta_A: q.ta_opts[0], ta_B: q.ta_opts[1], ta_C: q.ta_opts[2], ta_D: q.ta_opts[3], ta_E: q.ta_opts[4] || '', answer: q.answer });
  ws.eachRow((r) => { r.alignment = { wrapText: true, vertical: 'top' }; });
  // put stored pictures back into their cells (question picture in the Tamil column if there is Tamil text)
  sample.forEach((q, i) => {
    for (const [slot, id] of Object.entries(q.imgs || {})) {
      const p = pics[id]; if (!p) continue;
      const lang = slot === 'q' ? (q.ta_q || !q.en_q ? 'ta' : 'en') : (q.ta_opts?.['ABCDE'.indexOf(slot)] || !q.en_opts?.['ABCDE'.indexOf(slot)] ? 'ta' : 'en');
      const col = ALL.indexOf(slot === 'q' ? `${lang}_question` : `${lang}_${slot}`);
      const scale = Math.min(1, 220 / p.w, 160 / p.h);
      const imageId = wb.addImage({ buffer: p.buffer, extension: 'png' });
      ws.addImage(imageId, { tl: { col, row: i + 1 }, ext: { width: Math.round(p.w * scale), height: Math.round(p.h * scale) } });
      ws.getRow(i + 2).height = Math.max(ws.getRow(i + 2).height || 15, Math.round(p.h * scale * 0.75) + 6);
    }
  });
  const help = wb.addWorksheet('வழிமுறை');
  [
    ['qno', 'வினா எண் 1 முதல் (Daily Class Test 20 · Evening / PSPT / Weekend 100 · Weekly Revision / Full Mock 200)'],
    ['section', 'தமிழ் / GS / APT'],
    ['en_E, ta_E', 'காலியாக விடவும் (TNPSC-க்குத் தேவையில்லை)'],
    ['en_question, en_A … en_D', 'ஆங்கில வினா, விருப்பங்கள் (பொதுத்தமிழ் வினாக்களுக்குக் காலியாக விடலாம்)'],
    ['ta_question, ta_A … ta_D', 'தமிழ் வினா, விருப்பங்கள்'],
    ['answer', 'A / B / C / D'],
    ['வரிகள்', 'கூற்றுகள் போன்றவற்றை Alt+Enter மூலம் தனி வரிகளாக எழுதலாம்'],
    ['படங்கள் / Pictures', 'வினா அல்லது விருப்பக் கலத்தில் படத்தைச் செருகலாம் (Insert → Picture → Place over / in Cell; WPS-இல் Insert → Picture). படம் அந்தக் கலத்தின் மேல்-இடது மூலையில் இருக்க வேண்டும். தமிழ் அல்லது ஆங்கிலக் கலம் – ஏதேனும் ஒன்றில் இட்டால் போதும்; இரு மொழிகளிலும் காட்டப்படும். கோப்பு 4 MB-க்குள் இருக்க வேண்டும் (தேவையெனில் Compress Pictures பயன்படுத்தவும்).'],
    ['பொருத்துக அட்டவணை', 'ஒவ்வொரு வரிசையையும் "a. மொகஞ்சதாரோ | 1. கப்பல் துறைமுகம்" என  " | " கொண்டு எழுதினால் அட்டவணையாகக் காட்டப்படும்'],
  ].forEach((r) => help.addRow(r));
  help.getColumn(1).width = 28; help.getColumn(2).width = 100;
  return wb.xlsx.writeBuffer();
}

/** Replace all questions of a test (inside an existing transaction `tx`). */
export async function saveQuestions(tx, testId, questions) {
  await tx`DELETE FROM questions WHERE test_id=${testId}`;
  for (const q of questions) {
    await tx`INSERT INTO questions (test_id,qno,section,en_q,en_opts,ta_q,ta_opts,answer,nopts,imgs)
      VALUES (${testId},${q.qno},${q.section},${q.en_q},${tx.json(q.en_opts)},${q.ta_q},${tx.json(q.ta_opts)},${q.answer},${q.nopts || 4},${tx.json(q.imgs || {})})`;
  }
}
export const sectionSummary = (qs) =>
  Object.entries(qs.reduce((m, q) => ((m[q.section] = (m[q.section] || 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(', ');
