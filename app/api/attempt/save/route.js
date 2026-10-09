import { sql } from '@/lib/db';
import { current, cleanAnswers } from '@/lib/attempt';
import { isStale, finalize } from '@/lib/scoring';

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const c = await current(Number(b.testId));
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  if (!c.a) return Response.json({ error: 'தேர்வு தொடங்கப்படவில்லை.' }, { status: 400 });
  if (isStale(c.a)) { await finalize(c.a.id); return Response.json({ error: 'விடைத்தாள் தானாகச் சமர்ப்பிக்கப்பட்டது.', submitted: true }, { status: 409 }); }
  if (c.a.submitted_at) return Response.json({ error: 'ஏற்கனவே சமர்ப்பிக்கப்பட்டது.', submitted: true }, { status: 409 });
  if (Date.now() > new Date(c.a.deadline).getTime() + 60000) return Response.json({ error: 'நேரம் முடிந்தது.', expired: true }, { status: 409 });
  const answers = cleanAnswers(b.answers);
  const tabs = Math.max(c.a.tab_switches, Math.min(9999, Number(b.tabs) || 0));
  await sql`UPDATE attempts SET answers=${sql.json(answers)}, tab_switches=${tabs}, last_seen=now() WHERE id=${c.a.id} AND submitted_at IS NULL`;
  return Response.json({ ok: true, saved: Object.keys(answers).length });
}
