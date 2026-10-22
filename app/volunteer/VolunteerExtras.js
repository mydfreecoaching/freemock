'use client';
import { useState } from 'react';

/** Department (with "other") and subjects (with "other") fields. */
export default function VolunteerExtras({ depts, subjects }) {
  const [dept, setDept] = useState('');
  const [other, setOther] = useState(false);
  return (
    <>
      <label>துறை / Department <span className="req">*</span></label>
      <select name="dept" required value={dept} onChange={(e) => setDept(e.target.value)}>
        <option value="" disabled>தேர்வு செய்யவும்</option>
        {depts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      {dept.startsWith('பிற') && <><label>துறையின் பெயர் / Department name <span className="req">*</span></label><input name="dept_other" required maxLength={120} /></>}
      <label>பாடம் நடத்தக்கூடிய பாடங்கள் / Subjects you can teach <span className="req">*</span></label>
      <div className="checks">{subjects.map((s) => (
        <label key={s} className="choice"><input type="checkbox" name="subjects" value={s} onChange={s.startsWith('பிற') ? (e) => setOther(e.target.checked) : undefined} /> {s}</label>
      ))}</div>
      {other && <><label>பிற பாடம் / Other subject <span className="req">*</span></label><input name="subject_other" required maxLength={200} /></>}
    </>
  );
}
