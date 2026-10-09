import { sql, ensureSchema } from '@/lib/db';
import { studentId, logoutAll } from '@/lib/auth';
import { finalize, isStale } from '@/lib/scoring';

/** Automatic logout after 5 minutes of inactivity on student pages. Never while a test is being written. */
export async function POST() {
  await ensureSchema();
  const sid = await studentId();
  if (sid) {
    const open = await sql`SELECT * FROM attempts WHERE student_id=${sid} AND submitted_at IS NULL`;
    // a test is still being written in another tab/device (heartbeat within 2 minutes) → stay logged in
    if (open.some((a) => !isStale(a) && new Date(a.last_seen || a.started_at).getTime() > Date.now() - 120000)) return Response.json({ skip: true });
    for (const a of open) if (isStale(a)) await finalize(a.id);
  }
  await logoutAll();
  return Response.json({ ok: true });
}
