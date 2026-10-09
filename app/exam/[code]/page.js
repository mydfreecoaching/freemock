import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { testStatus } from '@/lib/util';
import { getExam } from '@/lib/exams';
import { studentTests } from '@/lib/student';
import TestCard from '@/components/TestCard';
export const dynamic = 'force-dynamic';

/** One exam: its ongoing, upcoming and completed tests for the logged-in student. */
export default async function ExamPage({ params }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect(loginUrl(`/exam/${(await params).code}`));
  const ex = await getExam((await params).code);
  if (!ex || !ex.active) redirect('/dashboard');
  const { tests, byTest } = await studentTests(sid);
  const mine = tests.filter((t) => t.kind === ex.code);
  const open = mine.filter((t) => testStatus(t) === 'open').sort((a, b) => new Date(a.end_at) - new Date(b.end_at));
  const upcoming = mine.filter((t) => testStatus(t) === 'upcoming').sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const closed = mine.filter((t) => testStatus(t) === 'closed');
  const done = mine.filter((t) => byTest[t.id]?.submitted_at).length;
  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>{ex.name}</h1>
          <a className="btn alt" href="/dashboard">← முகப்பு</a>
        </div>
        {ex.description && <p className="small" style={{ marginBottom: 0 }}>{ex.description}</p>}
        <div className="row" style={{ marginTop: 10 }}>
          {ex.progress && done > 0 && <a className="btn" href={`/progress?e=${ex.code}`}>📈 என் முன்னேற்றம்</a>}
          {ex.weekly_analysis && <a className="btn alt" href={`/weekly?k=${ex.code}`}>வாராந்திரப் பகுப்பாய்வு</a>}
        </div>
      </div>
      {mine.length === 0 && <div className="card muted">இந்தத் தேர்வுக்கான தேர்வுகள் விரைவில் அறிவிக்கப்படும்.</div>}
      {open.length > 0 && <h2>நடப்புத் தேர்வுகள்</h2>}
      {open.map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} />)}
      {upcoming.length > 0 && <h2>வரவிருக்கும் தேர்வுகள்</h2>}
      {upcoming.map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} />)}
      {closed.length > 0 && <h2>நிறைவடைந்த தேர்வுகள்</h2>}
      {closed.slice(0, 50).map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} />)}
    </>
  );
}
