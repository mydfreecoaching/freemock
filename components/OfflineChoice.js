'use client';
import { useState } from 'react';

/**
 * Before a class test: "Did you write this on paper at the office, or will you write it online?"
 * Paper → enter correct / wrong answers and time taken; the mark is calculated (verified by the office before it counts).
 * Online → the usual rules + Start (children).
 */
export default function OfflineChoice({ testId, lim, existing, onlineOpen, children }) {
  const [mode, setMode] = useState(existing && existing.status !== 'rejected' ? 'offline' : '');
  const [edit, setEdit] = useState(!existing || existing.status === 'rejected');
  const [v, setV] = useState({ correct: existing?.correct ?? '', wrong: existing?.wrong ?? '', minutes: existing?.minutes ?? '' });
  const num = (x) => (x === '' || x == null ? null : Number(x));
  const c = num(v.correct), w = num(v.wrong);
  const calc = c != null && w != null && c >= 0 && w >= 0 && c + w <= lim.n ? Math.round((c * lim.mk - w * lim.neg) * 100) / 100 : null;
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');

  async function send(action) {
    setBusy(true); setErr(''); setMsg('');
    const r = await fetch('/api/attempt/offline', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId, ...v, action }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    if (j.message) setMsg(j.message);
    setTimeout(() => window.location.reload(), j.message ? 1200 : 0);
  }

  if (existing?.status === 'pending' && !edit) {
    return (
      <div className="offbox pending">
        <h2>📝 நேரடித் தேர்வு – சரிபார்ப்பில்</h2>
        <p>இத்தேர்வை அலுவலகத்தில் நேரடியாக எழுதியதாகப் பதிவு செய்துள்ளீர்கள்: சரி <b>{existing.correct}</b> · தவறு <b>{existing.wrong}</b> · நேரம் <b>{existing.minutes} நிமிடம்</b> → மதிப்பெண் <b>{existing.score} / {lim.max}</b></p>
        <p className="small">அலுவலகம் உங்கள் விடைத்தாளுடன் சரிபார்த்ததும் இம்மதிப்பெண் தரவரிசைப் பட்டியலில் சேர்க்கப்படும். மீண்டும் இணையவழியில் எழுதத் தேவையில்லை.</p>
        {err && <div className="err">{err}</div>}
        <div className="row">
          <button type="button" className="alt" onClick={() => setEdit(true)} disabled={busy}>✏️ விவரங்களைத் திருத்து</button>
          {onlineOpen && <button type="button" className="alt" disabled={busy} onClick={() => confirm('நேரடித் தேர்வுப் பதிவை நீக்கி இணையவழியில் எழுதவா?') && send('cancel')}>நீக்கிவிட்டு இணையவழியில் எழுது</button>}
        </div>
      </div>
    );
  }

  return (
    <>
      {existing?.status === 'rejected' && <div className="err">❌ நீங்கள் உள்ளிட்ட மதிப்பெண் ({existing.score}) அலுவலகத்தால் நிராகரிக்கப்பட்டது{existing.note ? `: ${existing.note}` : ''}. சரியான மதிப்பெண்ணை மீண்டும் உள்ளிடவும் அல்லது இணையவழியில் எழுதவும்.</div>}
      {!mode && <div className="offbox">
        <h2>இத்தேர்வை எப்படி எழுதுகிறீர்கள்? / How are you writing this test?</h2>
        <div className="offpick">
          <button type="button" onClick={() => setMode('offline')}>🏢 <b>அலுவலகத்தில் நேரடியாக (அச்சுப் பிரதியில்) எழுதினேன்</b><small>சரி, தவறு எண்ணிக்கை & எடுத்த நேரத்தை உள்ளிடவும் · I wrote it on paper at the office</small></button>
          {onlineOpen && <button type="button" onClick={() => setMode('online')}>💻 <b>இணையவழியில் எழுதப் போகிறேன்</b><small>இப்போதே இணையத்தில் எழுதுகிறேன் · I will write it online now</small></button>}
        </div>
        {!onlineOpen && <p className="small muted">இணையவழித் தேர்வு நேரம் முடிந்துவிட்டது; அலுவலகத்தில் நேரடியாக எழுதியவர்கள் மட்டும் மதிப்பெண்ணை உள்ளிடலாம்.</p>}
      </div>}
      {mode === 'offline' && <div className="offbox">
        <h2>🏢 நேரடித் தேர்வு விவரம் / Paper-test details</h2>
        <p className="small">அலுவலகத்தில் எழுதிய விடைத்தாளைத் திருத்திய பின் கிடைத்த விவரங்களை உள்ளிடவும் ({lim.n} வினாக்கள்; சரியான விடைக்கு {lim.mk} மதிப்பெண்{lim.neg ? `, தவறான விடைக்கு −${lim.neg}` : ''}). மதிப்பெண் தானாகக் கணக்கிடப்படும். அலுவலகம் விடைத்தாளுடன் சரிபார்த்த பின்பே தரவரிசையில் சேர்க்கப்படும்; தவறான விவரம் நிராகரிக்கப்படும்.</p>
        <div className="offgrid">
          <label>✅ சரியான விடைகள் / Correct<input type="number" inputMode="numeric" min={0} max={lim.n} step={1} value={v.correct} onChange={(e) => setV({ ...v, correct: e.target.value })} /></label>
          <label>❌ தவறான விடைகள் / Wrong<input type="number" inputMode="numeric" min={0} max={lim.n} step={1} value={v.wrong} onChange={(e) => setV({ ...v, wrong: e.target.value })} /></label>
          <label>⏱️ எடுத்த நேரம் (நிமிடம்) / Time taken (min)<input type="number" inputMode="numeric" min={1} max={lim.dur} step={1} value={v.minutes} onChange={(e) => setV({ ...v, minutes: e.target.value })} /></label>
        </div>
        <p className="offcalc">{calc != null ? <>விடையளிக்காதவை: {lim.n - c - w} · கணக்கிட்ட மதிப்பெண்: <b>{calc} / {lim.max}</b></> : c != null && w != null && c + w > lim.n ? <span className="bad">சரி + தவறு மொத்த வினாக்களை ({lim.n}) விட அதிகம்</span> : <span className="muted">சரி, தவறு எண்ணிக்கையை உள்ளிட்டால் மதிப்பெண் தெரியும்</span>}</p>
        {err && <div className="err">{err}</div>}
        {msg && <div className="okmsg">{msg}</div>}
        <div className="row" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => send('save')} disabled={busy || calc == null || v.minutes === ''}>{busy ? 'காத்திருக்கவும்…' : 'சமர்ப்பி / Submit'}</button>
          {existing?.status === 'pending' ? <button type="button" className="alt" onClick={() => setEdit(false)} disabled={busy}>ரத்து</button>
            : <button type="button" className="alt" onClick={() => { setMode(''); setErr(''); }} disabled={busy}>← திரும்பு</button>}
        </div>
      </div>}
      {mode === 'online' && <>
        <button type="button" className="linkish small" onClick={() => setMode('')}>← அலுவலகத்தில் நேரடியாக எழுதினேன் என்பதைத் தேர்வு செய்ய</button>
        {children}
      </>}
    </>
  );
}
