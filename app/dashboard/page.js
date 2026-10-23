import { PREFIX } from '@/lib/util';
import PushOptIn from '@/components/PushOptIn';
import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { missingFields } from '@/lib/profile';
import { studentWithPhoto, photoUrl } from '@/lib/photo';
import AttendanceCard from '@/components/AttendanceCard';
import ClassInfoPrompt from '@/components/ClassInfoPrompt';
import { hasClassOn, istToday, venueTitle, fmtDay, dayName, attVenues } from '@/lib/attendance';
import G4Prompt from '@/components/G4Prompt';
import G2HallPrompt from '@/components/G2HallPrompt';
import OtherDistrictPrompt from '@/components/OtherDistrictPrompt';
import { G4, g4Asking } from '@/lib/venues';
import { openEnded, fmt, fmtDate, testStatus } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import { studentTests } from '@/lib/student';
import NewTestsPopup from '@/components/NewTestsPopup';
import TestCard from '@/components/TestCard';
import GuidanceWa from '@/components/GuidanceWa';
import { guidanceGroups, venueGroup } from '@/lib/venues';
export const dynamic = 'force-dynamic';

const TABS = [
  ['open', 'நடப்புத் தேர்வுகள்', 'Ongoing'],
  ['upcoming', 'வரவிருப்பவை', 'Upcoming'],
  ['done', 'நான் எழுதியவை', 'Completed'],
  ['closed', 'நிறைவடைந்தவை', 'Finished'],
];

export default async function Dashboard({ searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const me = await studentWithPhoto(sid);
  if (!me) redirect('/api/logout');
  const sp = await searchParams;
  const exams = await getExams(); const EX = examMap(exams);
  const { tests, byTest } = await studentTests(sid);
  const mine = tests.filter((t) => EX[t.kind] && t.nq > 0);
  const replies = await sql`SELECT f.test_id, f.reply, f.replied_at, f.reply_seen, t.title FROM feedback f JOIN tests t ON t.id=f.test_id
    WHERE f.student_id=${sid} AND f.reply IS NOT NULL ORDER BY f.replied_at DESC LIMIT 5`;
  const noFb = await sql`SELECT a.test_id FROM attempts a WHERE a.student_id=${sid} AND a.submitted_at IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM feedback f WHERE f.test_id=a.test_id AND f.student_id=${sid})`;

  const lists = {
    open: mine.filter((t) => testStatus(t) === 'open').sort((a, b) => new Date(a.end_at) - new Date(b.end_at)),
    upcoming: mine.filter((t) => testStatus(t) === 'upcoming').sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    done: mine.filter((t) => byTest[t.id]?.submitted_at).sort((a, b) => new Date(byTest[b.id].submitted_at) - new Date(byTest[a.id].submitted_at)),
    closed: mine.filter((t) => testStatus(t) === 'closed').slice(0, 40),
  };
  const tab = lists[sp?.s] ? sp.s : lists.open.length ? 'open' : lists.done.length ? 'done' : 'upcoming';

  // pop-up: ongoing tests the student has not yet submitted
  const popItems = lists.open.filter((t) => !byTest[t.id]?.submitted_at)
    .map((t) => ({ id: t.id, title: t.title, status: 'open', href: `/test/${t.id}`, label: EX[t.kind].name, when: openEnded(t) ? 'எப்போது வேண்டுமானாலும் எழுதலாம்' : `${fmt(t.end_at)} வரை எழுதலாம்` }));

  // the test to write now: earliest-closing open test not yet submitted, else the next upcoming one
  const todo = lists.open.filter((t) => !byTest[t.id]?.submitted_at);
  const next = todo[0] || null;
  const soon = !next ? lists.upcoming[0] : null;
  const lastT = lists.done[0];
  const lastA = lastT ? byTest[lastT.id] : null;
  const lastMax = lastT ? lastT.nq * Number(lastT.marks_per_q) : 0;
  const unseen = replies.filter((r) => !r.reply_seen).length;
  const today = istToday();
  const attToday = me.coaching_venue && hasClassOn(me.coaching_venue, today) ? today : null;
  const attStatus = attToday ? (await sql`SELECT status FROM class_attendance WHERE student_id=${sid} AND day=${today}`)[0]?.status || null : null;
  // one pop-up at a time (the notification gate is shown above all of them)
  const dc = PREFIX[me.district];
  const needClass = (dc === 'TVR' || dc === 'MYD') && !me.class_info_at && (!me.coaching_venue || me.coaching_venue === 'TVC0');
  const prompt = dc === 'OTH' && !me.district_other ? 'district' : me.g2_applied === true && !me.g2_hall_ticket ? 'hall'
    : needClass && !sp?.new ? 'class' : g4Asking() && me.g4_applied !== true && !sp?.new ? 'g4' : null;
  const notices = [
    me.photo_waived && <>📷 அடுத்த முறை உள்நுழையும்போது <b>பாஸ்போர்ட் புகைப்படம் கட்டாயம்</b> – <a href="/profile">இப்போதே பதிவேற்ற</a></>,
    missingFields(me).length > 0 && <>⚠️ விடுபட்ட விவரங்கள்: <b>{missingFields(me).join(' · ')}</b> – <a href="/profile"><b>நிறைவு செய்ய</b></a></>,
    noFb.length > 0 && <>💬 {noFb.length} தேர்வுக்குக் கருத்து அளிக்கவில்லை – ⭐ ஒரு தட்டலில் அளித்து விடைகளைப் பார்க்க: <a href={`/result/${noFb[0].test_id}#feedback`}><b>இப்போது</b></a></>,
    replies.length > 0 && <>💬 உங்கள் கருத்துக்கு Admin பதில் {unseen ? <span className="pop-new">{unseen} புதியது</span> : null} – <a href={`/result/${replies[0].test_id}#feedback`}><b>பார்க்க</b></a></>,
  ].filter(Boolean);

  return (
    <>
      {/* right after registering with a venue that has a WhatsApp group, show that first – no pop-up on top of it */}
      {!(sp?.new && (guidanceGroups(me.guidance).length || venueGroup(me.coaching_venue))) && <NewTestsPopup items={popItems} force={!!(sp?.login || sp?.new)} />}
      {prompt === 'district' && <OtherDistrictPrompt />}
      {prompt === 'hall' && <G2HallPrompt appNo={me.g2_app_no || ''} />}
      {prompt === 'class' && <ClassInfoPrompt district={me.district} venues={attVenues(PREFIX[me.district])} />}
      {prompt === 'g4' && <G4Prompt force={!!sp?.login} lastDate={G4.lastDate} examDate={G4.examDate} />}
      {sp?.new && <div className="okmsg">பதிவு வெற்றி! உங்கள் பதிவு எண்: <b>{sp.new}</b> — இதைக் குறித்து வைத்துக்கொள்ளவும்.</div>}
      {attToday && <AttendanceCard venue={venueTitle(me.coaching_venue)} day={`${fmtDay(attToday)} (${dayName(attToday)})`} status={attStatus} />}
      <GuidanceWa guidance={me.guidance} venue={me.coaching_venue} fresh={!!sp?.new} />

      <div className="hello row">
        {me.has_photo ? <img className="avatar sm" src={photoUrl(me.id, me.photo_v)} alt="" /> : <a className="avatar sm" href="/profile" style={{ display: 'grid', placeItems: 'center', fontSize: 11, textAlign: 'center' }}>📷</a>}
        <div style={{ minWidth: 0 }}><b>வணக்கம், {me.name}</b><div className="small muted">{me.reg_no} · {me.district_other || me.district} · <a href="/profile">என் விவரங்கள்</a></div></div>
      </div>

      {next ? (
        <a className="card todo" href={`/test/${next.id}`}>
          <span className="todo-k">{byTest[next.id] ? '⏳ தொடர வேண்டிய தேர்வு' : '📝 இப்போது எழுதலாம்'}{todo.length > 1 ? ` · மேலும் ${todo.length - 1}` : ''}</span>
          <b className="todo-t">{next.title}</b>
          <span className="small">{EX[next.kind]?.name} · {next.nq} வினாக்கள் · {next.duration_min} நிமிடம் · {openEnded(next) ? 'எப்போது வேண்டுமானாலும்' : `${fmt(next.end_at)} வரை`}</span>
          <span className="btn todo-b">{byTest[next.id] ? 'தொடர்ந்து எழுது →' : 'எழுது →'}</span>
        </a>
      ) : (
        <div className="card todo none">
          <span className="todo-k">✅ இப்போது எழுத வேண்டிய தேர்வு இல்லை</span>
          {soon ? <span>அடுத்த தேர்வு: <b>{soon.title}</b> – {fmt(soon.start_at)}</span> : <span className="small">புதிய தேர்வு வந்ததும் இங்கே காட்டப்படும்.</span>}
          <a className="btn alt" href="/tests" style={{ alignSelf: 'flex-start' }}>எல்லாத் தேர்வுகளும் →</a>
        </div>
      )}

      {lastT && <div className="card lastline row">
        <span>கடைசித் தேர்வு: <b>{lastT.title}</b> — <b>{Number(lastA.score)} / {lastMax}</b></span>
        <span className="row" style={{ gap: 8 }}><a className="btn alt" href={`/result/${lastT.id}`}>விடைகள்</a><a className="btn tonal" href="/rankings?v=me">📊 என் செயல்திறன்</a></span>
      </div>}

      {notices.length > 0 && <ul className="card notices">{notices.map((n, i) => <li key={i}>{n}</li>)}</ul>}
      <PushOptIn gate />

      <nav className="stabs" aria-label="தேர்வுகள்">
        {TABS.map(([k, ta, en]) => (
          <a key={k} href={`/dashboard?s=${k}`} className={`stab ${k === tab ? 'on' : ''} ${k === 'open' && lists.open.length ? 'live' : ''}`}>
            <b>{lists[k].length}</b><span>{ta}</span><span className="small">{en}</span>
          </a>
        ))}
      </nav>
      {lists[tab].length === 0 && <div className="card muted">{tab === 'open' ? 'இப்போது நடப்புத் தேர்வுகள் இல்லை.' : tab === 'upcoming' ? 'வரவிருக்கும் தேர்வுகள் இல்லை.' : tab === 'done' ? 'நீங்கள் இன்னும் தேர்வு எழுதவில்லை.' : 'நிறைவடைந்த தேர்வுகள் இல்லை.'}</div>}
      {lists[tab].map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} label={EX[t.kind]?.name} />)}
    </>
  );
}
