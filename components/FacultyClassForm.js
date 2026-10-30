'use client';
import { useState } from 'react';
import Form from './Form';

const DN = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
const t12 = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const hrs = (a, b) => { const m = (x) => { const [h, mm] = x.split(':').map(Number); return h * 60 + mm; }; return Math.round(((m(b) - m(a)) / 60) * 100) / 100; };
const dowOf = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();

/** Faculty: record a class taken – course → date (class days only, not future) → admin-defined time slot → subject & topic. */
export default function FacultyClassForm({ courses, subjects, today }) {
  const [cid, setCid] = useState(courses.length === 1 ? String(courses[0].id) : '');
  const [day, setDay] = useState(today);
  const c = courses.find((x) => String(x.id) === cid);
  const okDay = c && c.days.includes(dowOf(day)) && day >= c.start && (!c.end || day <= c.end);
  const [subj, setSubj] = useState('');
  return (
    <Form action="/api/faculty/class" submit="✅ வருகையைப் பதிவு செய்">
      <label>பயிற்சி வகுப்பு / Course <span className="req">*</span></label>
      <select name="course" required value={cid} onChange={(e) => setCid(e.target.value)}>
        <option value="" disabled>தேர்வு செய்யவும்</option>
        {courses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      {c && <p className="small muted" style={{ margin: '2px 0 0' }}>📍 {c.place} · 📅 {c.days.map((d) => DN[d]).join(', ')}</p>}
      <label>வகுப்பு நடத்திய தேதி / Date <span className="req">*</span></label>
      <input type="date" name="day" required value={day} max={today} min={c?.start} onChange={(e) => setDay(e.target.value)} />
      {c && day && !okDay && <div className="err">இந்தத் தேதியில் ({DN[dowOf(day)]}) இந்த வகுப்பு நடைபெறுவதில்லை.</div>}
      <label>வகுப்பு நேரம் / Time <span className="req">*</span></label>
      <select name="slot" required defaultValue="" key={cid}>
        <option value="" disabled>தேர்வு செய்யவும்</option>
        {(c?.slots || []).map((s) => <option key={s.from + s.to} value={`${s.from}-${s.to}`}>{t12(s.from)} – {t12(s.to)} ({hrs(s.from, s.to)} மணி)</option>)}
      </select>
      <label>நடத்திய பாடம் / Subject <span className="req">*</span></label>
      <select name={subj === '__other' ? undefined : 'subject'} required value={subj} onChange={(e) => setSubj(e.target.value)}>
        <option value="" disabled>தேர்வு செய்யவும்</option>
        {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        <option value="__other">பிற / Other</option>
      </select>
      {subj === '__other' && <input name="subject" required maxLength={120} placeholder="பாடத்தின் பெயர்" />}
      <label>நடத்திய பாடப்பகுதி / Topic taught <span className="req">*</span></label>
      <input name="topic" required minLength={3} maxLength={500} placeholder="எ.கா. இந்திய அரசியலமைப்பு – அடிப்படை உரிமைகள் (பகுதி III)" />
    </Form>
  );
}
