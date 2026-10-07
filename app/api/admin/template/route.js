import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { templateWorkbook } from '@/lib/questions';
export async function GET(req) {
  const g = await guard(); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get('test'));
  const qs = id ? await sql`SELECT * FROM questions WHERE test_id=${id} ORDER BY qno` : [];
  const buf = await templateWorkbook(qs);
  return new Response(buf, { headers: {
    'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'content-disposition': `attachment; filename="${id ? `test_${id}_questions` : 'question_upload_template'}.xlsx"` } });
}
