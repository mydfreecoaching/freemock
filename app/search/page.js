import { viewer, testAllowed } from '@/lib/access';
import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';
import { getExams, examMap } from '@/lib/exams';
import TestCard from '@/components/TestCard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'தேர்வுகளைத் தேடு / Search tests' };

/** Students: search every test (running or past) by title, subject, exam name or syllabus. */
export default async function Search({ searchParams }) {
  await ensureSchema();
  if (await isAdmin()) redirect('/admin');
  const sid = await studentId();
  const q = String((await searchParams)?.q || '').trim().slice(0, 80);
  if (!sid) redirect(loginUrl(`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`));
  const EX = examMap(await getExams(true));
  let tests = [], byTest = {};
  if (q.length >= 2) {
    const like = `%${q.replace(/[%_\\]/g, (c) => '\\' + c)}%`;
    tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq FROM tests t LEFT JOIN exams e ON e.code=t.kind
      WHERE t.published AND (t.title ILIKE ${like} OR t.subject ILIKE ${like} OR e.name ILIKE ${like} OR t.syllabus ILIKE ${like})
      ORDER BY t.start_at DESC LIMIT 60`;
    tests = tests.filter((t) => t.nq > 0);
    const atts = tests.length ? await sql`SELECT * FROM attempts WHERE student_id=${sid} AND test_id = ANY(${tests.map((t) => t.id)})` : [];
    byTest = Object.fromEntries(atts.map((a) => [a.test_id, a]));
    const v = await viewer();
    tests = tests.filter((t) => testAllowed(t, v, !!byTest[t.id]));
  }
  return (
    <>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>🔍 தேர்வுகளைத் தேடு / Search tests</h1>
        <form method="get" className="row searchrow">
          <input name="q" defaultValue={q} autoFocus minLength={2} placeholder="பாடம், தலைப்பு அல்லது சொல் – எ.கா. அரசியலமைப்பு, Polity, Full Mock, திருக்குறள்" />
          <button>தேடு / Search</button>
        </form>
        <p className="small muted" style={{ marginBottom: 0 }}>நடைபெறும் மற்றும் முன்பு நடந்த அனைத்துத் தேர்வுகளிலும் தேடலாம். நீங்கள் எழுதாத தேர்வுகளை இப்போதும் எழுதலாம்.</p>
      </div>
      {q.length >= 2 && <p className="small"><b>{tests.length}</b> தேர்வுகள் கிடைத்தன – "{q}"</p>}
      {q.length >= 2 && tests.length === 0 && <div className="card muted">இந்தச் சொல்லுடன் தேர்வுகள் இல்லை. வேறு சொல்லில் தேடவும் (எ.கா. பாடத்தின் பெயர்).</div>}
      {tests.map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} label={EX[t.kind]?.name + (t.subject ? ` · ${t.subject}` : '')} />)}
    </>
  );
}
