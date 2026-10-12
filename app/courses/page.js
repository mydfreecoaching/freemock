import { ensureSchema } from '@/lib/db';
import { getExams } from '@/lib/exams';
import { browseTests } from '@/lib/browse';
import { examTabs } from '@/lib/catalog';
import { viewer, testAllowed } from '@/lib/access';
import ExamBrowser from '@/components/ExamBrowser';
import ClassOnly from '@/components/ClassOnly';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Courses – இலவச இணையவழி மாதிரி தேர்வு' };

/** Courses = class tests of coaching classes, each for the districts chosen by the admin. Visitors may browse all; a student sees their district's. */
export default async function Courses() {
  await ensureSchema();
  const v = await viewer();
  if (!v.classOk) return <ClassOnly title="தேர்வுகள் / Courses" />;
  const exams = await getExams();
  const [{ classExams }, data] = await Promise.all([examTabs(exams, v), browseTests((t) => (t.ttype === 'class' && testAllowed(t, v) ? t.kind : null))]);
  const options = classExams.map((e) => ({ value: e.code, label: e.name, description: e.description }));
  return (
    <>
      <section className="pagehead"><h1>தேர்வுகள் / Courses</h1><p>மாவட்ட வாரியாக நடைபெறும் பயிற்சி வகுப்புகளுக்கான வகுப்புத் தேர்வுகள் – அந்தந்த மாவட்டத்தில் பதிவு செய்த மாணவர்களுக்கு மட்டும்.{v.district ? ` (உங்கள் மாவட்டம்: ${v.district})` : ''} அனைவரும் <a href="/full-mocks">முழு மாதிரித் தேர்வுகள்</a>, <a href="/subjects">பாட வாரியான தேர்வுகளை</a> எழுதலாம்.</p></section>
      <ExamBrowser options={options} data={data} loggedIn={!v.guest} />
    </>
  );
}
