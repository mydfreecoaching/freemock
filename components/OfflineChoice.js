'use client';
import { useState } from 'react';

/**
 * Before a class test: "Did you write this on paper at the office, or will you write it online?"
 * Paper → enter only the total mark (verified by the office before it counts). Online → the usual rules + Start (children).
 */
export default function OfflineChoice({ testId, lim, existing, onlineOpen, children }) {
  const [mode, setMode] = useState(existing && existing.status !== 'rejected' ? 'offline' : '');
  const [edit, setEdit] = useState(!existing || existing.status === 'rejected');
  const [score, setScore] = useState(existing?.score ?? '');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');

  async function send(action) {
    setBusy(true); setErr(''); setMsg('');
    const r = await fetch('/api/attempt/offline', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId, score, action }) });
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
        <p>இத்தேர்வை அலுவலகத்தில் நேரடியாக எழுதியதாகப் பதிவு செய்துள்ளீர்கள். நீங்கள் உள்ளிட்ட மொத்த மதிப்பெண்: <b>{existing.score} / {lim.max}</b></p>
        <p className="small">அலுவலகம் உங்கள் விடைத்தாளுடன் சரிபார்த்ததும் இம்மதிப்பெண் தரவரிசைப் பட்டியலில் சேர்க்கப்படும். மீண்டும் இணையவழியில் எழுதத் தேவையில்லை.</p>
        {err && <div className="err">{err}</div>}
        <div className="row">
          <button type="button" className="alt" onClick={() => setEdit(true)} disabled={busy}>✏️ மதிப்பெண்ணைத் திருத்து</button>
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
          <button type="button" onClick={() => setMode('offline')}>🏢 <b>அலுவலகத்தில் நேரடியாக (அச்சுப் பிரதியில்) எழுதினேன்</b><small>மொத்த மதிப்பெண்ணை மட்டும் உள்ளிடவும் · I wrote it on paper at the office</small></button>
          {onlineOpen && <button type="button" onClick={() => setMode('online')}>💻 <b>இணையவழியில் எழுதப் போகிறேன்</b><small>இப்போதே இணையத்தில் எழுதுகிறேன் · I will write it online now</small></button>}
        </div>
        {!onlineOpen && <p className="small muted">இணையவழித் தேர்வு நேரம் முடிந்துவிட்டது; அலுவலகத்தில் நேரடியாக எழுதியவர்கள் மட்டும் மதிப்பெண்ணை உள்ளிடலாம்.</p>}
      </div>}
      {mode === 'offline' && <div className="offbox">
        <h2>🏢 நேரடித் தேர்வு மதிப்பெண் / Paper-test mark</h2>
        <p className="small">அலுவலகத்தில் எழுதிய விடைத்தாளில் பெற்ற <b>மொத்த மதிப்பெண்ணை</b> மட்டும் உள்ளிடவும் ({lim.min < 0 ? `${lim.min} முதல் ` : '0 முதல் '}{lim.max} வரை; {lim.n} வினாக்கள் × {lim.step}). அலுவலகம் விடைத்தாளுடன் சரிபார்த்த பின்பே தரவரிசையில் சேர்க்கப்படும். தவறான மதிப்பெண் நிராகரிக்கப்படும்.</p>
        <label>மொத்த மதிப்பெண் / Total mark <span className="req">*</span></label>
        <input type="number" inputMode="decimal" step="any" min={lim.min} max={lim.max} value={score} onChange={(e) => setScore(e.target.value)} style={{ maxWidth: 180 }} />
        {err && <div className="err">{err}</div>}
        {msg && <div className="okmsg">{msg}</div>}
        <div className="row" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => send('save')} disabled={busy || score === ''}>{busy ? 'காத்திருக்கவும்…' : 'சமர்ப்பி / Submit'}</button>
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
