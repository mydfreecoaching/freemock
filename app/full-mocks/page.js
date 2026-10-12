import { ensureSchema } from '@/lib/db';
import { getExams } from '@/lib/exams';
import { browseTests } from '@/lib/browse';
import { examTabs } from '@/lib/catalog';
import { viewer } from '@/lib/access';
import ExamBrowser from '@/components/ExamBrowser';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Full Mock Tests – இலவச இணையவழி மாதிரி தேர்வு' };

/** Full mock tests – open to every registered student. */
export default async function FullMocks() {
  await ensureSchema();
  const v = await viewer();
  const exams = await getExams();
  const [{ fullExams }, data] = await Promise.all([examTabs(exams), browseTests((t) => (t.ttype === 'full' ? t.kind : null))]);
  const options = fullExams.map((e) => ({ value: e.code, label: e.name, description: e.description }));
  return (
    <>
      <section className="pagehead"><h1>முழு மாதிரித் தேர்வுகள் / Full Mock Tests</h1><p>அனைத்து மாவட்ட மாணவர்களும் இலவசமாக எழுதலாம். தேர்வைத் தேர்வு செய்து நடப்பு அல்லது நிறைவடைந்த தேர்வுகளைப் பார்க்கவும்.</p></section>
      <ExamBrowser options={options} data={data} loggedIn={!v.guest} />
    </>
  );
}
