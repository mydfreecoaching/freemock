import { guard } from '@/lib/adminGuard';
import { sql } from '@/lib/db';
import { rescoreAll } from '@/lib/scoring';
import { lbSettings, saveLbSettings, clearLbCache } from '@/lib/lb';

/** Admin: leaderboard privacy / visibility settings, and recalculation. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  if (b.action === 'recalc') {
    if (!b.exam) return Response.json({ error: 'தேர்வைத் தேர்வு செய்யவும்.' }, { status: 400 });
    // re-score every submitted attempt from the current answer keys, then rebuild the rankings
    const tests = await sql`SELECT id FROM tests WHERE published AND start_at <= now() AND (${b.exam || ''} = '' OR kind=${b.exam || ''})`;
    let n = 0;
    for (const t of tests) n += await rescoreAll(t.id);
    clearLbCache();
    return Response.json({ message: `${tests.length} தேர்வுகளின் ${n} விடைத்தாள்கள் மீண்டும் மதிப்பிடப்பட்டு தரவரிசை புதுப்பிக்கப்பட்டது.`, reload: true });
  }
  if (b.action === 'refresh') { clearLbCache(); return Response.json({ message: 'தரவரிசை புதுப்பிக்கப்பட்டது.', reload: true }); }
  const cur = await lbSettings();
  const display = ['reg', 'masked', 'name'].includes(b.display) ? b.display : cur.display;
  await saveLbSettings({
    display,
    guests: b.guests === 'yes',
    showTime: b.showTime === 'yes',
    minTests: Math.min(20, Math.max(1, Number(b.minTests) || 1)),
  });
  clearLbCache();
  return Response.json({ message: 'அமைப்புகள் சேமிக்கப்பட்டன.', reload: true });
}
