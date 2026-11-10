import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin, studentId } from '@/lib/auth';
import { initialBoard } from '@/lib/lb';
import LeaderboardPro from '@/components/LeaderboardPro';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'தரவரிசை / Leaderboard – இலவச இணையவழி மாதிரி தேர்வு' };

/** Interactive leaderboard (also the first tab of /rankings). First view rendered on the server, then live from /api/leaderboard. */
export default async function LeaderboardPage() {
  await ensureSchema();
  if (await isAdmin()) redirect('/admin/leaderboard');
  const b = await initialBoard(await studentId());
  if (b?.locked) return <div className="card"><h2 style={{ marginTop: 0 }}>🏅 தரவரிசை / Leaderboard</h2><p>தரவரிசையைப் பார்க்க <a href="/login?next=/rankings"><b>உள்நுழையவும் / Login</b></a>.</p></div>;
  if (!b) return <div className="card muted">இன்னும் தரவரிசை இல்லை.</div>;
  return (
    <>
      <LeaderboardPro exams={b.exams} initial={b.initial} />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>மொத்த மதிப்பெண் தரவரிசைப் பட்டியல்கள் / Total-marks rank lists</h2>
        <p className="small muted">ஒவ்வொரு தேர்வின் அனைத்து மதிப்பெண்களின் கூட்டுத்தொகை அடிப்படையிலான முழுப் பட்டியல்.</p>
        <div className="row">{b.exams.map((e) => <a key={e.code} className="btn alt" href={`/combined/${e.code}`}>{e.name}</a>)}</div>
      </div>
    </>
  );
}
