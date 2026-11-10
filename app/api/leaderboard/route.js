import { ensureSchema } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';
import { getExams } from '@/lib/exams';
import { lbRaw, computeView, publicRows, myCard, lbSettings, adminExtras } from '@/lib/lb';
export const dynamic = 'force-dynamic';

/** GET /api/leaderboard?exam=&mode=&date=&week=&month=&subject=&test= → one ranked view (read-only, computed on the server). */
export async function GET(req) {
  await ensureSchema();
  const u = new URL(req.url);
  const p = Object.fromEntries(u.searchParams);
  const [sid, admin, settings] = await Promise.all([studentId(), isAdmin(), lbSettings()]);
  const exams = await getExams(admin && p.all === '1');
  if (!admin && !sid && !settings.guests) return Response.json({ error: 'login', message: 'தரவரிசையைப் பார்க்க உள்நுழையவும்.' }, { status: 401 });
  const ex = exams.find((e) => e.code === p.exam) || exams[0];
  if (!ex) return Response.json({ error: 'noexam' }, { status: 404 });
  const raw = await lbRaw(ex.code);
  const view = computeView(raw, p, settings);
  return Response.json({
    exam: ex.code, mode: view.mode, sel: view.sel, options: view.options, participants: view.participants, hasPrev: view.hasPrev,
    minTests: settings.minTests, display: admin ? 'admin' : settings.display,
    rows: publicRows(view.rows, { sid, admin, settings }),
    me: admin ? null : myCard(view, raw, sid),
    ...(admin ? { extras: adminExtras(view, raw) } : {}),
    at: Date.now(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
