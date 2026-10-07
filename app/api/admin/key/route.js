import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { rescoreAll } from '@/lib/scoring';

/** Body: { test_id, changes: "12=B, 45=C" } -> update keys and rescore everyone. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.test_id);
  const pairs = String(b.changes || '').split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
  const done = [];
  for (const p of pairs) {
    const m = p.match(/^(\d+)\s*[=:\-]\s*([A-Da-d])$/);
    if (!m) return Response.json({ error: `புரியவில்லை: "${p}" (எ.கா. 12=B)` }, { status: 400 });
    const r = await sql`UPDATE questions SET answer=${m[2].toUpperCase()} WHERE test_id=${id} AND qno=${Number(m[1])} RETURNING qno`;
    if (!r.length) return Response.json({ error: `வினா ${m[1]} இல்லை` }, { status: 400 });
    done.push(`${m[1]}=${m[2].toUpperCase()}`);
  }
  const n = await rescoreAll(id);
  return Response.json({ message: `${done.length ? done.join(', ') + ' மாற்றப்பட்டது. ' : ''}${n} விடைத்தாள்கள் மறுமதிப்பீடு செய்யப்பட்டன.`, reload: true });
}
