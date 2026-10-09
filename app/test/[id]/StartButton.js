'use client';
import { useState } from 'react';

/** Start: syllabus acknowledgement (if any) → test rules pop-up → OK starts the test and the timer. */
export default function StartButton({ testId, needAck = false }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [ok, setOk] = useState(!needAck);
  const [rules, setRules] = useState(false);
  async function go() {
    if (!ok) return;
    setBusy(true); setErr('');
    const r = await fetch('/api/attempt/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId, ack: ok, rules: true }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || 'பிழை'); setBusy(false); setRules(false); if (j.redirect) window.location.href = j.redirect; return; }
    window.location.reload();
  }
  return <>
    {err && <div className="err">{err}</div>}
    {needAck && <label className="ack"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> மேலே உள்ள பாடத்திட்டத்தைப் படித்தேன் – சரி / I have read the syllabus – OK</label>}
    <button onClick={() => ok && setRules(true)} disabled={busy || !ok}>தேர்வைத் தொடங்கு / Start</button>
    {rules && (
      <div className="modal" onClick={() => !busy && setRules(false)}>
        <div className="card tabwarn rules" role="alertdialog" aria-modal="true" aria-labelledby="rules-h" onClick={(e) => e.stopPropagation()}>
          <h2 id="rules-h">📢 தேர்வு விதிமுறைகள் / Test rules</h2>
          <p className="small muted" style={{ marginTop: 0 }}>கவனமாகப் படிக்கவும். &quot;சரி&quot; அழுத்திய பிறகே தேர்வும் நேரமும் தொடங்கும்.</p>
          <h3>1️⃣ தேர்வின் போது Tab / App மாற்றக்கூடாது</h3>
          <ul>
            <li>வேறு tab, வேறு app அல்லது வேறு திரைக்கு மாறினால் <b>முதல் முறையே எச்சரிக்கை</b> காட்டப்படும்.</li>
            <li><b>3 முறைக்கு மேல்</b> மாறினால் தானாக <b>Logout</b> ஆகிவிடுவீர்கள். மீண்டும் உள்நுழைந்து தொடரலாம் (நேரம் ஓடிக்கொண்டே இருக்கும்).</li>
            <li><b>5 முறைக்கு மேல்</b> மாறினால் இந்தத் தேர்வைத் தொடர்ந்து எழுத முடியாது — விடைத்தாள் <b>தானாகச் சமர்ப்பிக்கப்படும்</b>.</li>
            <li>⚠️ கைபேசித் திரையை அணைப்பதும் (screen lock), அழைப்பு / WhatsApp பார்க்க வெளியே செல்வதும் மாறியதாகவே கணக்கிடப்படும்.</li>
          </ul>
          <h3>2️⃣ பாதியில் விட்டுச் சென்ற தேர்வு</h3>
          <ul><li>பாதியில் விட்டுச் சென்று <b>10 நிமிடங்களுக்குள்</b> திரும்பாவிட்டால், அதுவரை அளித்த விடைகளுடன் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.</li></ul>
          <h3>✅ அறிவுரை</h3>
          <ul>
            <li>நல்ல இணைய இணைப்பு, போதுமான charge உடன் தொடங்கவும்.</li>
            <li>Notification-களைத் தவிர்க்க <b>Do Not Disturb</b> ஐ இயக்கவும்.</li>
            <li>தேர்வு முடியும் வரை அதே திரையில் இருக்கவும்.</li>
          </ul>
          <p className="small muted">Do not switch tabs/apps: warning from the 1st time; more than 3 = automatic logout; more than 5 = test submitted automatically (screen lock also counts). A test left midway is auto-submitted after 10 minutes.</p>
          <div className="row">
            <button onClick={go} disabled={busy}>{busy ? 'காத்திருக்கவும்…' : 'சரி, தேர்வைத் தொடங்கு / OK, start'}</button>
            <button className="alt" onClick={() => setRules(false)} disabled={busy}>இப்போது வேண்டாம்</button>
          </div>
        </div>
      </div>
    )}
  </>;
}
