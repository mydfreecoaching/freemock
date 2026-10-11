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
          <h3>1️⃣ வேறு Tab / App-க்குச் செல்லலாம்</h3>
          <ul><li>தேர்வின் போது வேறு tab, app, அழைப்பு அல்லது WhatsApp-க்குச் சென்றாலும் <b>எந்தப் பாதிப்பும் இல்லை</b> – எச்சரிக்கையோ logout-ஓ இல்லை. விடைகள் தானாகச் சேமிக்கப்படும்; நேரம் ஓடிக்கொண்டிருக்கும்.</li></ul>
          <h3>2️⃣ பாதியில் விட்டுச் சென்ற தேர்வு</h3>
          <ul><li>பாதியில் விட்டுச் சென்று <b>10 நிமிடங்களுக்குள்</b> திரும்பாவிட்டால், அதுவரை அளித்த விடைகளுடன் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.</li></ul>
          <h3>📴 இணைய இணைப்பு துண்டிக்கப்பட்டால்</h3>
          <ul>
            <li>கவலை வேண்டாம் – <b>தொடர்ந்து எழுதுங்கள்</b>. விடைகள் உங்கள் கைபேசியிலேயே சேமிக்கப்படும்; நேரமும் ஓடிக்கொண்டிருக்கும்.</li>
            <li>இணைப்பு இல்லாதபோது சமர்ப்பித்தாலோ நேரம் முடிந்தாலோ, <b>இணைப்பு வந்தவுடன் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்</b>.</li>
            <li>தேர்வுப் பக்கத்தை reload செய்யவோ மூடவோ வேண்டாம். கைபேசிக் கோளாறால் மூடிவிட்டால், இதே கைபேசியில் இதே browser-இல் மீண்டும் இத்தளத்தைத் திறக்கவும் – சேமித்த விடைகள் தானாக அனுப்பப்படும்.</li>
          </ul>
          <h3>✅ அறிவுரை</h3>
          <ul>
            <li>நல்ல இணைய இணைப்பு, போதுமான charge உடன் தொடங்கவும்.</li>
            <li>Notification-களைத் தவிர்க்க <b>Do Not Disturb</b> ஐ இயக்கவும்.</li>
          </ul>
          <p className="small muted">Switching tabs/apps has no effect on the test. A test left midway is auto-submitted after 10 minutes. If the internet drops, keep writing – answers stay on the phone and are submitted automatically when the connection returns.</p>
          <div className="row">
            <button onClick={go} disabled={busy}>{busy ? 'காத்திருக்கவும்…' : 'சரி, தேர்வைத் தொடங்கு / OK, start'}</button>
            <button className="alt" onClick={() => setRules(false)} disabled={busy}>இப்போது வேண்டாம்</button>
          </div>
        </div>
      </div>
    )}
  </>;
}
