import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import { viewer, testAllowed } from '@/lib/access';
import LeaderboardPage from '@/app/leaderboard/page';
import Progress from '@/app/progress/page';
import MyPerformance from '@/components/MyPerformance';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'தரவரிசை / Rankings – இலவச இணையவழி மாதிரி தேர்வு' };

const TABS = [['combined', 'ஒருங்கிணைந்த', 'Overall'], ['test', 'தேர்வு வாரியாக', 'Per test'], ['me', 'என் முன்னேற்றம்', 'My progress']];

/** One Rankings page: overall (combined) leaderboard · per-test rank lists · my progress. */
export default async function Rankings({ searchParams }) {
  await ensureSchema();
  if (await isAdmin()) redirect('/admin');
  const sp = await searchParams;
  const v = await viewer();
  const tab = TABS.some(([k]) => k === sp?.v) ? sp.v : 'combined';
  let body;
  if (tab === 'combined') body = await LeaderboardPage();
  else if (tab === 'test') {
    const EX = examMap(await getExams(true));
    const rows = await sql`SELECT t.id, t.title, t.kind, t.ttype, t.districts, t.start_at, t.end_at,
        (SELECT count(*) FROM attempts a WHERE a.test_id=t.id AND a.submitted_at IS NOT NULL)::int n
      FROM tests t WHERE t.published AND t.start_at <= now() ORDER BY t.start_at DESC LIMIT 80`;
    const mine = v.sid ? Object.fromEntries((await sql`SELECT test_id FROM attempts WHERE student_id=${v.sid} AND submitted_at IS NOT NULL`).map((r) => [r.test_id, 1])) : {};
    const list = rows.filter((t) => t.n > 0 && testAllowed(t, v, !!mine[t.id]));
    body = (
      <div className="card">
        {list.length === 0 && <p className="muted">இன்னும் தரவரிசை இல்லை.</p>}
        <ul className="ranklist">{list.map((t) => (
          <li key={t.id}><a href={`/rank/${t.id}`}>
            <span><b>{t.title}</b><small>{EX[t.kind]?.name} · {fmt(t.start_at)}{mine[t.id] ? ' · ✔ நீங்கள் எழுதியது' : ''}</small></span>
            <span className="pill">{t.n} பேர் →</span>
          </a></li>
        ))}</ul>
      </div>
    );
  } else if (!v.sid) {
    body = <div className="card"><p>உங்கள் முன்னேற்றத்தைப் பார்க்க உள்நுழையவும்.</p><a className="btn" href="/login?next=/rankings?v=me">உள்நுழை / Login</a></div>;
  } else {
    body = <>
      <MyPerformance sid={v.sid} />
      {await Progress({ searchParams: Promise.resolve({ e: sp?.e }), embedded: true })}
    </>;
  }
  return (
    <>
      <div className="card tests-head">
        <h1 style={{ margin: 0 }}>🏆 தரவரிசை / Rankings</h1>
        <nav className="tabs chips" aria-label="தரவரிசை வகை">
          {TABS.map(([k, ta, en]) => <a key={k} className={`tab ${k === tab ? 'on' : ''}`} href={`/rankings?v=${k}`}>{ta}<span className="small muted hide-sm"> · {en}</span></a>)}
        </nav>
      </div>
      {body}
    </>
  );
}
