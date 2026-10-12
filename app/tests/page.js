import { ensureSchema } from '@/lib/db';
import { getExams } from '@/lib/exams';
import { getSubjects } from '@/lib/subjects';
import { browseTests } from '@/lib/browse';
import { examTabs } from '@/lib/catalog';
import { viewer, testAllowed } from '@/lib/access';
import ExamBrowser from '@/components/ExamBrowser';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'தேர்வுகள் / Tests – இலவச இணையவழி மாதிரி தேர்வு' };

const TABS = [
  ['class', 'வகுப்புத் தேர்வுகள்', 'Class tests'],
  ['full', 'முழு மாதிரித் தேர்வுகள்', 'Full mocks'],
  ['subject', 'பாட வாரியான', 'Subject-wise'],
];

/** One Tests page: class tests (by district) · full mocks · subject-wise, switched with chips. */
export default async function Tests({ searchParams }) {
  await ensureSchema();
  const v = await viewer();
  const tabs = TABS.filter(([k]) => k !== 'class' || v.classOk);
  const want = (await searchParams)?.t;
  const t = tabs.some(([k]) => k === want) ? want : tabs[0][0];
  const exams = await getExams();
  let options, data, label, placeholder, note;
  if (t === 'subject') {
    data = await browseTests((x) => (x.subject && testAllowed(x, v) ? x.subject : null));
    options = (await getSubjects()).map((s) => ({ value: s.name, label: s.name }));
    label = 'பாடங்கள் / Subjects'; placeholder = 'பாடத்தைத் தேர்வு செய்யவும் / Select a subject';
  } else {
    const tabsE = await examTabs(exams, v);
    const list = t === 'class' ? tabsE.classExams : tabsE.fullExams;
    data = await browseTests((x) => (x.ttype === t && testAllowed(x, v) ? x.kind : null));
    options = list.map((e) => ({ value: e.code, label: e.name, description: e.description }));
    if (t === 'class') note = v.guest ? 'மாவட்ட வாரியான பயிற்சி வகுப்புகளுக்கான தேர்வுகள் – அந்த மாவட்ட மாணவர்கள் உள்நுழைந்து எழுதலாம்.' : `உங்கள் மாவட்டப் (${v.district}) பயிற்சி வகுப்புகளுக்கான தேர்வுகள்.`;
    if (t === 'full') note = 'அனைத்து மாவட்ட மாணவர்களும் இலவசமாக எழுதலாம்.';
  }
  return (
    <>
      <div className="card tests-head">
        <h1 style={{ margin: 0 }}>தேர்வுகள் / Tests</h1>
        <nav className="tabs chips" aria-label="வகை">
          {tabs.map(([k, ta, en]) => <a key={k} className={`tab ${k === t ? 'on' : ''}`} href={`/tests?t=${k}`}>{ta}<span className="small muted hide-sm"> · {en}</span></a>)}
        </nav>
        {note && <p className="small muted" style={{ margin: 0 }}>{note}</p>}
      </div>
      <ExamBrowser key={t} options={options} data={data} loggedIn={!v.guest} label={label} placeholder={placeholder} />
    </>
  );
}
