import { ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { venueFromToken } from '@/lib/attQr';
import { recordScan } from '@/lib/attScan';

/** QR scan at the venue: { tok, action: 'in' | 'out' }. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const v = venueFromToken(String(b.tok || ''));
  if (!v) return Response.json({ error: 'QR தவறானது.' }, { status: 400 });
  const r = await recordScan(sid, v.code, b.action);
  if (r.error) return Response.json({ error: r.error }, { status: 400 });
  return Response.json(r);
}
