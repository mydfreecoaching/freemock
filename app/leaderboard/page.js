import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { getExams } from '@/lib/exams';
import { leaderboards } from '@/lib/leaderboard';
import Leaderboard from '@/components/Leaderboard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'தரவரிசை / Leaderboard – இலவச இணையவழி மாதிரி தேர்வு' };

/** Public leaderboard (no login needed): combined ranking of every exam, live while a test is running. */
export default async function LeaderboardPage() {
  await ensureSchema();
  if (await isAdmin()) redirect('/admin');
  const exams = await getExams();
  const LB = await leaderboards(exams);
  const withData = exams.filter((e) => LB[e.code]);
  return (
    <>
      <Leaderboard exams={exams.map((e) => ({ code: e.code, name: e.name }))} data={LB} />
      {withData.length > 0 && <div className="card">
        <h2 style={{ marginTop: 0 }}>முழுத் தரவரிசைப் பட்டியல்கள் / Full rank lists</h2>
        <div className="row">{withData.map((e) => <a key={e.code} className="btn alt" href={`/combined/${e.code}`}>{LB[e.code].combined?.running ? '🔴 ' : ''}{e.name}</a>)}</div>
      </div>}
      {withData.length === 0 && <div className="card muted">இன்னும் தரவரிசை இல்லை.</div>}
    </>
  );
}
