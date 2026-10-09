'use client';
/** Dropdown that opens /admin?e=<code> for the chosen exam. */
export default function ExamSelect({ exams, value }) {
  return (
    <select className="bigselect" value={value} onChange={(e) => { window.location.href = `/admin?e=${encodeURIComponent(e.target.value)}#tests`; }} aria-label="கிடைக்கும் தேர்வுகள்">
      {exams.map((e) => <option key={e.code} value={e.code}>{e.name}{e.count ? ` – ${e.count} தேர்வுகள்` : ''}{e.open ? ` • ${e.open} நடப்பில்` : ''}{e.active ? '' : ' (மறைக்கப்பட்டது)'}</option>)}
    </select>
  );
}
