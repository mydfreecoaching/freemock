'use client';
import { useState } from 'react';
import { STUDY_PLACES, STUDY_EXAMS } from '@/lib/study';

/** "Where do you study for competitive exams?" + "How are you preparing (incl. earlier experience)?" */
export default function StudyFields({ place = '', note = '', exams = [], examOther = '' }) {
  const [p, setP] = useState(place || '');
  const [ex, setEx] = useState(exams || []);
  const toggle = (k) => setEx((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]));
  const summary = ex.length ? ex.map((k) => (k === 'OTHER' ? 'பிற' : k.replace('_', ' '))).join(', ') : 'தேர்வு செய்யவும் (ஒன்றுக்கு மேல் தேர்வு செய்யலாம்)';
  return (
    <div className="g4q">
      <label>🎯 என்னென்ன போட்டித் தேர்வுகளுக்குப் படிக்கிறீர்கள்? / Exams you are preparing for <span className="req">*</span></label>
      <details className="msel">
        <summary>{summary}</summary>
        <div className="msel-list">
          {STUDY_EXAMS.map(([k, l]) => (
            <label key={k} className="chk"><input type="checkbox" name="study_exams" value={k} checked={ex.includes(k)} onChange={() => toggle(k)} /> {l}</label>
          ))}
        </div>
      </details>
      {ex.includes('OTHER') && <input name="study_exam_other" required maxLength={200} defaultValue={examOther} placeholder="பிற தேர்வுகளின் பெயர் / Name of other exams" />}
      <label>📚 போட்டித் தேர்வுகளுக்கு எங்கு அமர்ந்து படிக்கிறீர்கள்? / Where do you study? <span className="req">*</span></label>
      <select name="study_place" required value={p} onChange={(e) => setP(e.target.value)}>
        <option value="" disabled>தேர்வு செய்யவும்</option>
        {STUDY_PLACES.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      {p && <>
        <label>எவ்வாறு படித்துக்கொண்டிருக்கிறீர்கள்? (முந்தைய அனுபவங்கள் உட்பட) / How are you preparing, incl. earlier experience <span className="req">*</span></label>
        <textarea name="study_note" required minLength={10} maxLength={1000} rows={4} defaultValue={note}
          placeholder="எ.கா. தினமும் 4 மணி நேரம் நூலகத்தில் பாடநூல்கள் படிக்கிறேன்; 2024 குரூப் 4 எழுதி 150 மதிப்பெண் பெற்றேன்; இணையவழி வகுப்புகள் பார்க்கிறேன்…" />
      </>}
    </div>
  );
}
