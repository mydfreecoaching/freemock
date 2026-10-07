'use client';
import { useRef } from 'react';
import Form from './Form';
import { toISTInput, CATEGORIES, CAT, KINDS } from '@/lib/util';

/** Test settings form. `t` = existing test (edit) or undefined (new). `defaults` = prefill for new tests. */
export default function TestForm({ t, defaults = {}, action = '/api/admin/test', submit, hidden = {} }) {
  const ref = useRef(null);
  const v = { ...defaults, ...(t || {}) };
  const cat = v.category || 'TNPSC_G2';
  const p = CAT[cat]?.preset || {};
  const kind = v.kind || 'full';
  function applyPreset(e) {
    const f = ref.current?.closest('form');
    const pr = CAT[e.target.value]?.preset;
    if (!f || !pr) return;
    f.marks_per_q.value = pr.marks_per_q;
    f.negative_mark.value = pr.negative_mark;
    f.unanswered_penalty.value = pr.unanswered_penalty;
    f.allow_e.checked = pr.allow_e;
  }
  function applyKind(e) {
    const f = ref.current?.closest('form');
    if (f && !t) f.duration_min.value = e.target.value === 'daily' ? 20 : 180;
  }
  return (
    <Form action={action} submit={submit || (t ? 'சேமி' : 'தேர்வை உருவாக்கு')}>
      <span ref={ref} />
      {t && <input type="hidden" name="id" value={t.id} />}
      {Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />)}
      <div className="grid2">
        <div><label>தேர்வுப் பிரிவு / Exam</label>
          <select name="category" defaultValue={cat} onChange={applyPreset}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><label>வகை / Type</label>
          <select name="kind" defaultValue={kind} onChange={applyKind}>
            {Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select></div>
      </div>
      <label>தலைப்பு</label>
      <input name="title" required defaultValue={v.title || ''} placeholder="எ.கா. TNPSC GROUP 2/2A – FREE FULL MOCK TEST 3 / Daily Test 07.10.2026" />
      <div className="grid2">
        <div><label>தொடக்கம் (IST)</label><input type="datetime-local" name="start_at" required defaultValue={v.start_at ? toISTInput(v.start_at) : ''} /></div>
        <div><label>முடிவு (IST) – இதற்குப் பின் யாரும் எழுத இயலாது</label><input type="datetime-local" name="end_at" required defaultValue={v.end_at ? toISTInput(v.end_at) : ''} /></div>
      </div>
      <div className="grid2">
        <div><label>கால அளவு (நிமிடம்)</label><input type="number" name="duration_min" min="1" defaultValue={v.duration_min ?? (kind === 'daily' ? 20 : 180)} /></div>
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
