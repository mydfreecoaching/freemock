'use client';
import { useState } from 'react';

/** Start → one pop-up: four short rules (+ full rules under "read more") and the syllabus tick → OK starts the test and the timer. */
export default function StartButton({ testId, needAck = false }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [ok, setOk] = useState(!needAck); // syllabus read (ticked inside the pop-up)
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
    <button className="big-btn" onClick={() => setRules(true)} disabled={busy}>தேர்வைத் தொடங்கு / Start</button>
    {rules && (
      <div className="modal" onClick={() => !busy && setRules(false)}>
        <div className="card tabwarn rules" role="alertdialog" aria-modal="true" aria-labelledby="rules-h" onClick={(e) => e.stopPropagation()}>
          <h2 id="rules-h">📢 தேர்வு விதிமுறைகள் / Test rules</h2>
          <p className="small muted" style={{ marginTop: 0 }}>&quot;சரி&quot; அழுத்திய பிறகே தேர்வும் நேரமும் தொடங்கும்.</p>
          <ul className="rule4">
            <li><span>✈️</span><span>வினாக்கள் வந்த பிறகு கைபேசியை <b>Flight mode</b>-இல் வைத்து இடையூறின்றி எழுதலாம்; சமர்ப்பித்ததும் Flight mode-ஐ நிறுத்தவும்.</span></li>
            <li><span>🚫</span><span>வேறு <b>Tab / App</b>-க்கு மாறக்கூடாது – 3 முறைக்கு மேல் logout, 5 முறைக்கு மேல் தானாகச் சமர்ப்பிக்கப்படும்.</span></li>
            <li><span>⏱️</span><span>நேரம் ஓடிக்கொண்டே இருக்கும்; பாதியில் விட்டு <b>10 நிமிடம்</b> திரும்பாவிட்டால் தானாகச் சமர்ப்பிக்கப்படும்.</span></li>
            <li><span>📴</span><span>இணையம் போனாலும் தொடர்ந்து எழுதலாம் – விடைகள் கைபேசியில் சேமிக்கப்படும். பக்கத்தை <b>reload / மூட வேண்டாம்</b>.</span></li>
          </ul>
          <details className="syl"><summary>மேலும் படிக்க / Read full rules</summary>
            <div className="rules-full">
          <div className="flight-tip">
            <b>✈️ இடையூறு இல்லாமல் எழுத – Flight mode பரிந்துரை</b>
            <ol>
              <li>"சரி, தேர்வைத் தொடங்கு" அழுத்தி, <b>வினாக்கள் திரையில் வந்த பிறகு</b> கைபேசியை <b>Flight mode</b>-இல் வைக்கவும். (தொடங்குவதற்கு இணையம் தேவை.)</li>
              <li>அழைப்பு, WhatsApp, notification எதுவும் வராது – இணையம் இல்லாமலே தேர்வை முழுமையாக எழுதலாம்; விடைகள் கைபேசியில் சேமிக்கப்படும்.</li>
              <li>எழுதி முடித்து <b>"சமர்ப்பி"</b> அழுத்தியதும் <b>Flight mode-ஐ நிறுத்தவும்</b> – இணையம் வந்தவுடன் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும். அதுவரை பக்கத்தை மூடவோ reload செய்யவோ வேண்டாம்.</li>
            </ol>
            <div className="small">Tip: after the questions appear, switch on Flight mode to write without calls or notifications. Switch it off after pressing Submit – the answer sheet is sent automatically.</div>
          </div>
          <h3>1️⃣ தேர்வின் போது Tab / App மாற்றக்கூடாது</h3>
          <ul>
            <li>வேறு tab, வேறு app அல்லது வேறு திரைக்கு மாறினால் <b>முதல் முறையே எச்சரிக்கை</b> காட்டப்படும்.</li>
            <li><b>3 முறைக்கு மேல்</b> மாறினால் தானாக <b>Logout</b> ஆகிவிடுவீர்கள். மீண்டும் உள்நுழைந்து தொடரலாம் (நேரம் ஓடிக்கொண்டே இருக்கும்).</li>
            <li><b>5 முறைக்கு மேல்</b> மாறினால் இந்தத் தேர்வைத் தொடர்ந்து எழுத முடியாது — விடைத்தாள் <b>தானாகச் சமர்ப்பிக்கப்படும்</b>.</li>
            <li>⚠️ கைபேசித் திரையை அணைப்பதும் (screen lock), அழைப்பு / WhatsApp பார்க்க வெளியே செல்வதும் மாறியதாகவே கணக்கிடப்படும்.</li>
          </ul>
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
            <li>Notification-களைத் தவிர்க்க வினாக்கள் வந்ததும் <b>Flight mode</b> (அல்லது Do Not Disturb) ஐ இயக்கவும்.</li>
            <li>தேர்வு முடியும் வரை அதே திரையில் இருக்கவும்.</li>
          </ul>
          <p className="small muted">Do not switch tabs/apps: warning from the 1st time; more than 3 = automatic logout; more than 5 = test submitted automatically (screen lock also counts). A test left midway is auto-submitted after 10 minutes. If the internet drops, keep writing – answers stay on the phone and are submitted automatically when the connection returns.</p>
            </div>
          </details>
          {needAck && <label className="ack"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> பாடத்திட்டத்தைப் படித்தேன் / I have read the syllabus</label>}
          <div className="row">
            <button onClick={go} disabled={busy || !ok}>{busy ? 'காத்திருக்கவும்…' : 'சரி, தேர்வைத் தொடங்கு / OK, start'}</button>
            <button className="alt" onClick={() => setRules(false)} disabled={busy}>இப்போது வேண்டாம்</button>
          </div>
        </div>
      </div>
    )}
  </>;
}
