import { redirect } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { DISTRICT_EN } from '@/lib/util';
import { photoUrl } from '@/lib/photo';
import { EDU_LEVELS } from '@/lib/studyCircle';
import { scFilters, scStudents } from '@/lib/studyCircleList';
import PrintNow from '@/components/PrintNow';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Study Circle Registration Forms' };

const pick = (opts, val) => opts.map(([k, l], i) => <span key={k}>{i > 0 && '/'}<span className={k === val ? 'sel' : ''}>{l}</span></span>);
const GENDER = [['M', 'Male'], ['F', 'Female'], ['O', 'Transgender']];
const COMM = [['OC', 'OC'], ['BC', 'BC'], ['BCM', 'BCM'], ['MBC', 'MBC'], ['SC', 'SC'], ['SCA', 'SCA'], ['ST', 'ST']];
const commKey = (c) => (String(c || '').startsWith('MBC') ? 'MBC' : c);
function age(dob) {
  if (!dob) return '';
  const b = new Date(dob), n = new Date(Date.now() + 5.5 * 3600e3);
  let a = n.getUTCFullYear() - b.getUTCFullYear();
  if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) a--;
  return a;
}
const dmy = (dob) => { if (!dob) return ''; const d = new Date(dob); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; };
const V = ({ children }) => <span className="v">{children || ' '}</span>;

function FormPage({ s, course }) {
  const edu = EDU_LEVELS.filter(([k]) => s.edu?.[k]);
  const dist = (DISTRICT_EN[s.district] || '').toUpperCase();
  return (
    <section className="scf">
      <header className="scf-head">
        <img src="/tn-emblem.png" alt="" className="scf-logo" />
        <div className="scf-title">
          <b>DEPARTMENT OF EMPLOYMENT AND TRAINING</b>
          <b>DISTRICT EMPLOYMENT AND CAREER GUIDANCE CENTRE, {dist}</b>
          <div>Study Circle Registration Number: <V>{s.reg_no}</V></div>
          <div>Course Name: <V>{course}</V></div>
        </div>
      </header>
      <div className="scf-top">
        <table className="scf-rows"><tbody>
          <tr><td>1.</td><td>FULL NAME</td><td>: <V>{s.name}</V></td></tr>
          <tr><td>2.</td><td>FATHER / GUARDIAN NAME</td><td>: <V>{s.father_name}</V></td></tr>
          <tr><td>3.</td><td>MOTHER NAME</td><td>: <V>{s.mother_name}</V></td></tr>
          <tr><td>4.</td><td>GENDER</td><td>: {pick(GENDER, s.gender)}</td></tr>
          <tr><td>5.</td><td>DATE OF BIRTH (dd/mm/yyyy)</td><td className="nw">: <V>{dmy(s.dob)}</V> &nbsp; <b>AGE</b> <span className="v sm">{age(s.dob)}</span></td></tr>
          <tr><td>6.</td><td>AADHAR NUMBER</td><td>: <span className="v blank">&nbsp;</span></td></tr>
          <tr><td>7.</td><td>COMMUNITY</td><td>: {pick(COMM, commKey(s.community))}</td></tr>
          <tr><td>8.</td><td>eMail ID</td><td>: <V>{s.email}</V></td></tr>
          <tr><td>9.</td><td>MOBILE NUMBER</td><td>: <V>{s.mobile}</V></td></tr>
        </tbody></table>
        <div className="scf-photo">{s.has_photo ? <img src={photoUrl(s.id, s.photo_v)} alt="" /> : <span>PASSPORT SIZE PHOTO</span>}</div>
      </div>
      <table className="scf-rows"><tbody>
        <tr><td>10.</td><td>FULL ADDRESS</td><td>: <V>{s.address}</V></td></tr>
        <tr><td>11.</td><td>DISTRICT &amp; PINCODE</td><td>: <V>{DISTRICT_EN[s.district]}</V> &amp; <V>{s.pincode}</V></td></tr>
        <tr><td>12.</td><td>ARE YOU DIFFERENTLY ABLED</td><td>: {pick([['Y', 'YES'], ['N', 'NO']], s.disabled === true ? 'Y' : s.disabled === false ? 'N' : '')}</td></tr>
        {s.disabled && <tr><td></td><td>TYPE OF DISABILITY &amp; PERCENTAGE</td><td>: <V>{s.disability}</V></td></tr>}
        <tr><td>13.</td><td colSpan={2}><u>EDUCATIONAL DETAILS</u></td></tr>
      </tbody></table>
      <table className="scf-edu">
        <thead><tr><th>SL NO</th><th>QUALIFICATION</th><th>COURSE / SUBJECT</th><th>YEAR OF PASSING</th><th>MEDIUM</th><th>PERCENTAGE</th></tr></thead>
        <tbody>{(edu.length ? edu : [['', '']]).map(([k, l], i) => { const e = s.edu?.[k] || {}; return (
          <tr key={k || i}><td>{String.fromCharCode(65 + i)}.</td><td>{l}</td><td>{e.course || ''}</td><td>{e.year || ''}</td><td>{e.medium || ''}</td><td>{e.pct ? `${e.pct}%` : ''}</td></tr>
        ); })}</tbody>
      </table>
      <table className="scf-rows"><tbody>
        <tr><td>14.</td><td>PREVIOUS EXAM EXPERIENCE (EXAM NAME &amp; REGISTRATION NUMBER)</td><td>: <V>{s.prev_exams}</V></td></tr>
        <tr><td>15.</td><td>MEDIUM: {pick([['TAMIL', 'TAMIL'], ['ENGLISH', 'ENGLISH']], s.train_medium)}</td><td>MODE OF TRAINING: {pick([['OFFLINE', 'OFFLINE'], ['ONLINE', 'ONLINE']], s.train_mode)}</td></tr>
      </tbody></table>
      <footer className="scf-foot"><span>Date: <V>{s.reg_date}</V></span><span className="scf-signbox">{s.sign && <img className="scf-sign" src={s.sign} alt="" />}Signature of the Candidate</span></footer>
    </section>
  );
}

export default async function PrintStudyCircle({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const f = scFilters((k) => sp?.[k] || '');
  const ids = String(sp?.ids || '').split(',').map(Number).filter(Boolean);
  let list = await scStudents(ids.length ? { ...f, from: '', to: '', v: '', d: '', done: false } : f);
  if (ids.length) list = list.filter((s) => ids.includes(s.id));
  // signatures embedded in the page, so the forms still print after the stored copies are deleted
  const signs = list.length ? await sql`SELECT student_id, sign FROM student_signs WHERE student_id = ANY(${list.map((s) => s.id)})` : [];
  const sg = Object.fromEntries(signs.map((r) => [r.student_id, `data:image/png;base64,${Buffer.from(r.sign).toString('base64')}`]));
  list = list.map((s) => ({ ...s, sign: sg[s.id] || null }));
  const printedBefore = list.filter((s) => s.sc_printed_at && !s.sign).length;
  return (
    <div className="scf-print">
      <div className="noprint card row" style={{ justifyContent: 'space-between' }}>
        <span>{list.length} படிவங்கள் · கையொப்பம் உள்ளவை: {signs.length} · அச்சுப் பெட்டியில் "Save as PDF" தேர்வு செய்தால் PDF ஆகக் கிடைக்கும் (A4).
          {printedBefore > 0 && <><br /><b>{printedBefore} பேரின் படிவம் ஏற்கனவே அச்சிடப்பட்டதால் கையொப்பம் நீக்கப்பட்டுள்ளது.</b></>}</span>
        <PrintNow ids={list.filter((s) => s.sign).map((s) => s.id)} signs={signs.length} />
      </div>
      {list.map((s) => <FormPage key={s.id} s={s} course={f.course} />)}
    </div>
  );
}
