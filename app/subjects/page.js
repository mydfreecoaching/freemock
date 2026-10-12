import { viewer, testAllowed } from '@/lib/access';
import { ensureSchema } from '@/lib/db';
import { getSubjects } from '@/lib/subjects';
import { browseTests } from '@/lib/browse';
import ExamBrowser from '@/components/ExamBrowser';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Subject-wise Mock Tests – இலவச இணையவழி மாதிரி தேர்வு' };

/** Subject-wise tests: every published test that has a subject set, grouped by subject. */
export default async function Subjects() {
  await ensureSchema();
  const v = await viewer();
  const loggedIn = !v.guest;
  const data = await browseTests((t) => (t.subject && testAllowed(t, v) ? t.subject : null));
  const options = (await getSubjects()).map((s) => ({ value: s.name, label: s.name }));
  return (
    <>
      <section className="pagehead"><h1>பாட வாரியான மாதிரித் தேர்வுகள் / Subject-wise Mock Tests</h1><p>பாடத்தைத் தேர்வு செய்து, அந்தப் பாடத்தின் நடப்பு அல்லது நிறைவடைந்த தேர்வுகளைப் பார்க்கவும்.</p></section>
      <ExamBrowser options={options} data={data} loggedIn={loggedIn} label="பாடங்கள் / Subjects" placeholder="பாடத்தைத் தேர்வு செய்யவும் / Select a subject" />
    </>
  );
}
