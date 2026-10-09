'use client';
import { useRef, useState } from 'react';
import Form from './Form';
import { toISTInput, SUBJECTS } from '@/lib/util';

const mins = (n) => Math.max(1, Math.ceil(n * 0.9));
/** Test settings form. `t` = existing test (edit) or undefined (new). `exams` = available exams. */
export default function TestForm({ t, exams = [], defaults = {}, action = '/api/admin/test', submit, hidden = {} }) {
  const ref = useRef(null);
  const v = { ...defaults, ...(t || {}) };
  const byCode = Object.fromEntries(exams.map((e) => [e.code, e]));
  const [code, setCode] = useState(v.kind && byCode[v.kind] ? v.kind : exams[0]?.code || '');
  const ex = byCode[code];
  const p = ex ? { marks_per_q: Number(ex.marks_per_q), negative_mark: Number(ex.negative_mark), unanswered_penalty: Number(ex.unanswered_penalty), allow_e: !!ex.allow_e } : {};
  function applyPreset(e) {
    setCode(e.target.value);
    const f = ref.current?.closest('form'); const x = byCode[e.target.value];
    if (!f || !x) return;
    f.marks_per_q.value = Number(x.marks_per_q); f.negative_mark.value = Number(x.negative_mark);
    f.unanswered_penalty.value = Number(x.unanswered_penalty); f.allow_e.checked = !!x.allow_e;
    if (!t && x.qcount) f.duration_min.value = mins(x.qcount);
  }
  return (
    <Form action={action} submit={submit || (t ? 'சேமி' : 'தேர்வை உருவாக்கு')}>
      <span ref={ref} />
      {t && <input type="hidden" name="id" value={t.id} />}
      {Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />)}
      <label>கிடைக்கும் தேர்வுகள் / Available exams <span className="req">*</span></label>
      <select name="kind" required value={code} onChange={applyPreset}>
        {exams.map((e) => <option key={e.code} value={e.code}>{e.name}{e.qcount ? ` – ${e.qcount} வினாக்கள்` : ''}{e.active ? '' : ' (மறைக்கப்பட்டது)'}</option>)}
      </select>
      {ex?.description && <p className="small muted" style={{ margin: '4px 0 6px' }}>{ex.description}</p>}
      <label>பாடம் / Subject {code === 'subject' ? <span className="req">*</span> : <span className="small muted">(Subject-wise Mock Test-க்குக் கட்டாயம்; மற்றவற்றுக்கு விருப்பம்)</span>}</label>
      <input name="subject" list="subject-list" required={code === 'subject'} maxLength={120} defaultValue={v.subject || ''} placeholder="பட்டியலிலிருந்து தேர்வு செய்யவும் அல்லது எழுதவும்" />
      <datalist id="subject-list">{SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
      <p className="small muted" style={{ margin: '2px 0 6px' }}>தேர்வு நேரம் வினா எண்ணிக்கைக்கு ஏற்ப தானாக அமையும் (ஒரு வினாவுக்கு 0.9 நிமிடம்: 200 → 180, 100 → 90, 20 → 18).</p>
      <label>தலைப்பு</label>
      <input name="title" required defaultValue={v.title || ''} placeholder="எ.கா. TNPSC GROUP 2/2A – FREE FULL MOCK TEST 3 / Daily Test 07.10.2026" />
      <label>பாடத்திட்டம் / Syllabus <span className="req">*</span> <span className="small muted">(தேர்வர்கள் தேர்வு தொடங்கும் முன் இதைப் படித்து "சரி" கொடுப்பார்கள்)</span></label>
      <textarea name="syllabus" required rows={6} maxLength={5000} defaultValue={v.syllabus || ''} placeholder={'எ.கா.\nபொதுத்தமிழ்: இலக்கணம் – எழுத்து, சொல்; திருக்குறள் 1–50\nபொது அறிவு: இந்திய அரசியலமைப்பு – அடிப்படை உரிமைகள்\nதிறனறிவு: சதவீதம், விகிதம்'} />
      <div className="grid2">
        <div><label>தொடக்கம் (IST)</label><input type="datetime-local" name="start_at" required defaultValue={v.start_at ? toISTInput(v.start_at) : ''} /></div>
        <div><label>முடிவு (IST) – இதற்குப் பின் யாரும் எழுத இயலாது</label><input type="datetime-local" name="end_at" required defaultValue={v.end_at ? toISTInput(v.end_at) : ''} /></div>
      </div>
      <div className="grid2">
        <div><label>கால அளவு (நிமிடம்)</label><input type="number" name="duration_min" min="1" defaultValue={v.duration_min ?? (ex?.qcount ? mins(ex.qcount) : 180)} /></div>
        <div><label>சரியான விடைக்கு மதிப்பெண்</label><input type="number" step="0.01" name="marks_per_q" defaultValue={v.marks_per_q != null ? Number(v.marks_per_q) : p.marks_per_q} /></div>
      </div>
      <div className="grid2">
        <div><label>தவறான விடைக்குக் குறைப்பு (Negative)</label><input type="number" step="0.01" min="0" name="negative_mark" defaultValue={v.negative_mark != null ? Number(v.negative_mark) : p.negative_mark} /></div>
        <div><label>விடுபட்டால் குறைப்பு (TNPSC)</label><input type="number" step="0.5" min="0" name="unanswered_penalty" defaultValue={v.unanswered_penalty != null ? Number(v.unanswered_penalty) : p.unanswered_penalty} /></div>
      </div>
      <div className="grid2">
        <div><label>குறைப்பு முறை</label><select name="penalty_mode" defaultValue={v.penalty_mode ?? 1}><option value="1">ஒரு முறை மட்டும் (விடுபட்ட வினா இருந்தால்)</option><option value="2">ஒவ்வொரு விடுபட்ட வினாவுக்கும்</option></select></div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0 }}><input type="checkbox" name="allow_e" defaultChecked={v.allow_e != null ? !!v.allow_e : !!p.allow_e} style={{ width: 'auto' }} /> E – "விடை தெரியவில்லை" விருப்பம் (TNPSC)</label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0 }}><input type="checkbox" name="published" defaultChecked={!!v.published} style={{ width: 'auto' }} /> தேர்வர்களுக்குக் காட்டு (Published)</label>
        </div>
      </div>
    </Form>
  );
}
