'use client';
import { useRef, useState } from 'react';
import Form from './Form';
import { toISTInput, SUBJECTS, openEnded, DISTRICT_LIST, DISTRICT_FIRST_COUNT } from '@/lib/util';

const TYPES = [['class', 'வகுப்புத் தேர்வு', 'Class test – Courses tab · தேர்வு செய்யும் மாவட்ட மாணவர்களுக்கு மட்டும்'], ['full', 'முழு மாதிரித் தேர்வு', 'Full mock – Full Mocks tab · அனைவருக்கும்'], ['subject', 'பாட வாரியான தேர்வு', 'Subject-wise – Subject-wise tab · அனைவருக்கும்']];
const typeOf = (kind) => (kind === 'full' ? 'full' : kind === 'subject' ? 'subject' : 'class');

const mins = (n) => Math.max(1, Math.ceil(n * 0.9));
/** Test settings form. `t` = existing test (edit) or undefined (new). `exams` = available exams. */
export default function TestForm({ subjects = null, t, exams = [], defaults = {}, action = '/api/admin/test', submit, hidden = {} }) {
  const [noEnd, setNoEnd] = useState(() => !(t || defaults)?.end_at || openEnded(t || defaults));
  const ref = useRef(null);
  const v = { ...defaults, ...(t || {}) };
  const byCode = Object.fromEntries(exams.map((e) => [e.code, e]));
  const [code, setCode] = useState(v.kind && byCode[v.kind] ? v.kind : exams[0]?.code || '');
  const ex = byCode[code];
  const [ttype, setTtype] = useState(v.ttype || typeOf(code));
  const [dists, setDists] = useState(() => new Set(v.districts || []));
  const toggleD = (d) => setDists((s) => { const n = new Set(s); if (n.has(d)) n.delete(d); else n.add(d); return n; });
  const p = ex ? { marks_per_q: Number(ex.marks_per_q), negative_mark: Number(ex.negative_mark), unanswered_penalty: Number(ex.unanswered_penalty), allow_e: !!ex.allow_e } : {};
  function applyPreset(e) {
    setCode(e.target.value);
    if (!t) setTtype(typeOf(e.target.value));
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
      <label>தேர்வு வகை / Test type <span className="req">*</span></label>
      <div className="typepick" role="radiogroup">
        {TYPES.map(([k, ta, en]) => (
          <label key={k} className={`typeopt ${ttype === k ? 'on' : ''}`}>
            <input type="radio" name="ttype" value={k} checked={ttype === k} onChange={() => setTtype(k)} />
            <span><b>{ta}</b><small>{en}</small></span>
          </label>
        ))}
      </div>
      {ttype === 'class' && (
        <div className="distpick">
          <label style={{ marginTop: 4 }}>எந்த மாவட்ட மாணவர்களுக்கு? / District(s) <span className="req">*</span> <span className="small muted">– தேர்வு செய்த மாவட்ட மாணவர்கள் மட்டுமே Courses-இல் இத்தேர்வைப் பார்த்து எழுத முடியும்</span></label>
          <div className="choices">
            {DISTRICT_LIST.slice(0, DISTRICT_FIRST_COUNT).map(([ta, en]) => (
              <label key={ta} className="choice"><input type="checkbox" name="districts" value={ta} checked={dists.has(ta)} onChange={() => toggleD(ta)} /> {ta} <span className="muted small">({en})</span></label>
            ))}
          </div>
          <details className="syl" open={[...dists].some((d) => DISTRICT_LIST.findIndex((x) => x[0] === d) >= DISTRICT_FIRST_COUNT)}>
            <summary>மற்ற மாவட்டங்கள் / Other districts</summary>
            <div className="choices">
              {DISTRICT_LIST.slice(DISTRICT_FIRST_COUNT).filter((d) => d[2] !== 'OTH').map(([ta, en]) => (
                <label key={ta} className="choice"><input type="checkbox" name="districts" value={ta} checked={dists.has(ta)} onChange={() => toggleD(ta)} /> {ta} <span className="muted small">({en})</span></label>
              ))}
            </div>
          </details>
          {dists.size === 0 && <div className="small" style={{ color: 'var(--bad)' }}>குறைந்தது ஒரு மாவட்டத்தைத் தேர்வு செய்யவும் / Select at least one district.</div>}
        </div>
      )}
      <label>பாடம் / Subject {code === 'subject' || ttype === 'subject' ? <span className="req">*</span> : <span className="small muted">(பாட வாரியான தேர்வுக்குக் கட்டாயம்; மற்றவற்றுக்கு விருப்பம்)</span>}</label>
      {(() => {
        // subjects come from Admin → Subjects; an older free-text subject stays selectable
        const list = subjects || SUBJECTS;
        const opts = v.subject && !list.includes(v.subject) ? [...list, v.subject] : list;
        const need = code === 'subject' || ttype === 'subject';
        return <>
          <select name="subject" required={need} defaultValue={v.subject || ''}>
            <option value="">{need ? 'பாடத்தைத் தேர்வு செய்யவும் / Select a subject' : '— பாடம் இல்லை / No subject —'}</option>
            {opts.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <div className="small muted" style={{ margin: '2px 0 6px' }}>பட்டியலில் இல்லாத பாடத்தைச் சேர்க்க: <a href="/admin/subjects" target="_blank" rel="noopener">Admin → பாடங்கள்</a> (சேர்த்த பின் இப்பக்கத்தை refresh செய்யவும்)</div>
        </>;
      })()}
      <p className="small muted" style={{ margin: '2px 0 6px' }}>தேர்வு நேரம் வினா எண்ணிக்கைக்கு ஏற்ப தானாக அமையும் (ஒரு வினாவுக்கு 0.9 நிமிடம்: 200 → 180, 100 → 90, 20 → 18).</p>
      <label>தலைப்பு</label>
      <input name="title" required defaultValue={v.title || ''} placeholder="எ.கா. TNPSC GROUP 2/2A – FREE FULL MOCK TEST 3 / Daily Test 07.10.2026" />
      <label>பாடத்திட்டம் / Syllabus <span className="req">*</span> <span className="small muted">(தேர்வர்கள் தேர்வு தொடங்கும் முன் இதைப் படித்து "சரி" கொடுப்பார்கள்)</span></label>
      <textarea name="syllabus" required rows={6} maxLength={5000} defaultValue={v.syllabus || ''} placeholder={'எ.கா.\nபொதுத்தமிழ்: இலக்கணம் – எழுத்து, சொல்; திருக்குறள் 1–50\nபொது அறிவு: இந்திய அரசியலமைப்பு – அடிப்படை உரிமைகள்\nதிறனறிவு: சதவீதம், விகிதம்'} />
      <div className="grid2">
        <div><label>தொடக்கம் (IST)</label><input type="datetime-local" name="start_at" required defaultValue={v.start_at ? toISTInput(v.start_at) : ''} /></div>
        <div>
          <label className="choice" style={{ marginTop: 0 }}><input type="checkbox" name="no_end" checked={noEnd} onChange={(e) => setNoEnd(e.target.checked)} /> <b>கடைசி தேதி இல்லை</b> – எப்போது வேண்டுமானாலும் எழுதலாம்</label>
          {!noEnd && <><label>முடிவு (IST) – இதற்குப் பின் யாரும் எழுத இயலாது</label><input type="datetime-local" name="end_at" required defaultValue={v.end_at && !openEnded(v) ? toISTInput(v.end_at) : ''} /></>}
        </div>
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
