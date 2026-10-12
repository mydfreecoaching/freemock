'use client';
import { useState } from 'react';

const DIFF = [['easy', 'எளிது / Easy'], ['moderate', 'நடுத்தரம் / Moderate'], ['hard', 'கடினம் / Hard']];
const WORD = ['', 'மோசம்', 'சுமார்', 'நன்று', 'மிக நன்று', 'சிறப்பு'];
async function send(body) {
  const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'பிழை');
  return j;
}

/** One tap on a star = feedback given → answers open. */
export default function FeedbackForm({ testId }) {
  const [busy, setBusy] = useState(0); const [err, setErr] = useState('');
  async function rate(n) {
    setBusy(n); setErr('');
    try { await send({ testId, rating: n }); window.location.hash = 'feedback'; window.location.reload(); }
    catch (e) { setErr(e.message); setBusy(0); }
  }
  return (
    <div className="card fbform" id="feedback">
      <h2 style={{ marginBottom: 4 }}>⭐ இத்தேர்வு எப்படி இருந்தது? / How was this test?</h2>
      <p className="small muted" style={{ marginTop: 0 }}>ஒரு நட்சத்திரத்தைத் தட்டினால் போதும் – உடனே விடைகளும் பகுப்பாய்வும் திறக்கும்.</p>
      <div className="stars big" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className={n <= busy ? 'on' : ''} aria-label={`${n} – ${WORD[n]}`} disabled={!!busy} onClick={() => rate(n)}>★</button>)}
        {busy > 0 && <span className="small muted">{WORD[busy]} – காத்திருக்கவும்…</span>}
      </div>
      {err && <div className="err">{err}</div>}
    </div>
  );
}

/** Optional after rating: difficulty + a comment (goes to admin; may be shown on the site after approval). */
export function FeedbackMore({ testId, rating }) {
  const [diff, setDiff] = useState(''); const [c, setC] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await send({ testId, rating, difficulty: diff || undefined, comment: c }); window.location.reload(); }
    catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <details className="syl fb-more">
      <summary>✍️ கருத்தும் எழுத (விருப்பம்) / Add a comment (optional)</summary>
      <form onSubmit={save}>
        <div className="choices" style={{ marginTop: 8 }}>{DIFF.map(([k, l]) => <label key={k} className="choice"><input type="radio" name="difficulty" checked={diff === k} onChange={() => setDiff(k)} /> {l}</label>)}</div>
        <textarea value={c} onChange={(e) => setC(e.target.value)} maxLength={600} placeholder="வினாக்களின் தரம், நேரம், பாடத்திட்டம் பற்றிய உங்கள் கருத்து…" />
        {err && <div className="err">{err}</div>}
        <button disabled={busy || c.trim().length < 2} style={{ marginTop: 8 }}>{busy ? 'அனுப்புகிறது…' : 'அனுப்பு / Send'}</button>
      </form>
    </details>
  );
}
