import { studentId } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getExams } from '@/lib/exams';
import { browseTests } from '@/lib/browse';
import ExamBrowser from '@/components/ExamBrowser';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Courses – இலவச இணையவழி மாதிரி தேர்வு' };

export default async function Courses() {
  await ensureSchema();
  const loggedIn = !!(await studentId());
  const [exams, data] = await Promise.all([getExams(), browseTests((t) => t.kind)]);
  const options = exams.map((e) => ({ value: e.code, label: e.name, description: e.description }));
  return (
    <>
      <section className="pagehead"><h1>தேர்வுகள் / Courses</h1><p>தேர்வைத் தேர்வு செய்து, நடப்பு அல்லது நிறைவடைந்த தேர்வுகளைப் பார்க்கவும்.</p></section>
      <ExamBrowser options={options} data={data} loggedIn={loggedIn} />
    </>
  );
}
