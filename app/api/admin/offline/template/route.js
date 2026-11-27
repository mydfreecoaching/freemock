import ExcelJS from 'exceljs';
import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { scoreLimits } from '@/lib/offline';

/** Admin: Excel template for paper-test results of one test – Sl No | Reg No | Correct (rest = wrong), like the paper score sheet. */
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get('test'));
  const [t] = await sql`SELECT * FROM tests WHERE id=${id}`;
  if (!t) return Response.json({ error: 'தேர்வு இல்லை.' }, { status: 404 });
  const lim = await scoreLimits(t);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('நேரடித் தேர்வு');
  // same layout as the paper "மதிப்பெண் பதிவுத் தாள்": serial no | registration no | correct answers (the rest count as wrong)
  ws.columns = [{ header: 'வரிசை எண்', key: 'sl', width: 10 }, { header: 'பதிவு எண் / Reg No (அல்லது கைபேசி எண்)', key: 'reg', width: 32 }, { header: 'சரியாக விடையளித்த வினாக்களின் எண்ணிக்கை / Correct', key: 'c', width: 30 }, { header: 'பெயர் (விருப்பம் – சரிபார்க்க மட்டும்)', key: 'n', width: 28 }];
  const h = ws.getRow(1);
  h.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  h.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B57D0' } }; c.alignment = { wrapText: true, vertical: 'middle' }; });
  h.height = 34;
  for (let i = 1; i <= 300; i++) ws.addRow([i]);
  for (let r = 2; r <= 301; r++) ws.getCell(`C${r}`).dataValidation = { type: 'whole', operator: 'between', formulae: [0, lim.n], showErrorMessage: true, errorTitle: 'தவறு', error: `0 முதல் ${lim.n} வரை` };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const info = wb.addWorksheet('குறிப்பு');
  info.columns = [{ width: 110 }];
  [`தேர்வு: ${t.title} (எண் ${t.id})`, `மொத்த வினாக்கள்: ${lim.n} · சரியான விடைக்கு ${lim.mk} மதிப்பெண்${lim.neg ? ` · தவறான விடைக்கு −${lim.neg}` : ''} · நேரம்: முழு நேரம் (${lim.dur} நிமிடம்)`,
    'ஒரு மாணவருக்கு ஒரு வரி: பதிவு எண் (அல்லது கைபேசி எண்), சரியாக விடையளித்த வினாக்களின் எண்ணிக்கை. மீதமுள்ள வினாக்கள் அனைத்தும் தவறான விடைகளாகக் கணக்கிடப்படும்.',
    `சரியான விடைகள் 0 முதல் ${lim.n} வரை மட்டுமே இருக்கலாம். வரிசை எண் மட்டும் உள்ள (பதிவு எண் இல்லாத) வரிகள் கணக்கில் எடுக்கப்படாது.`,
    'பதிவேற்றியதும் மதிப்பெண் தானாகக் கணக்கிடப்பட்டு தரவரிசையில் சேர்க்கப்படும். அதே மாணவருக்கு மீண்டும் பதிவேற்றினால் புதிய எண்ணிக்கை பதிலாகச் சேமிக்கப்படும்.',
    'இணையவழியில் ஏற்கனவே இத்தேர்வை எழுதியவர்களின் வரிகள் தவிர்க்கப்படும் (இணையவழி மதிப்பெண்ணே கணக்கில் கொள்ளப்படும்).'].forEach((x) => { info.addRow([x]).alignment = { wrapText: true }; });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="paper_test_${t.id}_template.xlsx"` } });
}
