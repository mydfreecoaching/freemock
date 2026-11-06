import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { cxFields, saveCx } from '@/lib/centralExams';

/** Student saves SSC / IBPS / RRB coaching willingness and applications. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const f = cxFields(await req.json().catch(() => ({})));
  if (f.error) return Response.json({ error: f.error }, { status: 400 });
  await saveCx(sql, sid, f.values);
  return Response.json({ ok: true });
}
