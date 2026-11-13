import { sql } from '@/lib/db';
import { current, cleanAnswers } from '@/lib/attempt';
import { finalize, lateSync, isStale } from '@/lib/scoring';
import { clearLbCache } from '@/lib/lb';

/**
 * Submit. Works also for answers written offline: the browser keeps the answers on the phone and sends them
 * here as soon as the internet is back – even after the time is over or the server has already closed the attempt.
 */
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const id = Number(b.testId);
  const c = await current(id);
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  if (!c.a) return Response.json({ error: 'தேர்வு தொடங்கப்படவில்லை.' }, { status: 400 });
  if (c.a.offline) return Response.json({ ok: true }); // paper-test mark – nothing to submit
  const answers = b.answers && typeof b.answers === 'object' ? cleanAnswers(b.answers) : null;
  const tabs = Math.max(c.a.tab_switches, Math.min(9999, Number(b.tabs) || 0));
  const doneAt = Number(b.doneAt) || null;
  let synced = false;
  // background sync from the phone (page was closed/reloaded): a test still in progress is NOT submitted – answers are only saved
  const syncOnly = b.sync === true && b.final !== true;
  if (!c.a.submitted_at && syncOnly && !isStale(c.a)) {
    if (answers) await sql`UPDATE attempts SET answers=${sql.json(answers)}, tab_switches=${tabs} WHERE id=${c.a.id} AND submitted_at IS NULL`;
    return Response.json({ open: true });
  }
  if (!c.a.submitted_at) {
    if (answers) await sql`UPDATE attempts SET answers=${sql.json(answers)}, tab_switches=${tabs} WHERE id=${c.a.id} AND submitted_at IS NULL`;
    await finalize(c.a.id, syncOnly ? null : 'student', doneAt);
    clearLbCache(); // leaderboard shows the new result on its next refresh
  } else if (answers) {
    synced = await lateSync(c.a, answers, tabs, doneAt);
    if (synced) clearLbCache();
  }
  return Response.json({ redirect: `/result/${id}`, synced });
}
