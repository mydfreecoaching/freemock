'use client';
import { useEffect, useState } from 'react';
import { firebaseConfig, VAPID_KEY } from '@/lib/firebaseConfig';

const LS = 'fm_push_token';
async function getFcmToken() {
  const reg = await navigator.serviceWorker.register('/fm-sw.js');
  await navigator.serviceWorker.ready;
  const { initializeApp, getApps } = await import('firebase/app');
  const { getMessaging, getToken } = await import('firebase/messaging');
  const app = getApps()[0] || initializeApp(firebaseConfig);
  return getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
}
async function save(token) {
  let old = null; try { old = localStorage.getItem(LS); } catch {}
  const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, old }) });
  if (r.ok) try { localStorage.setItem(LS, token); } catch {}
  return r.ok;
}

/**
 * Turn on test notifications (Firebase Cloud Messaging).
 * gate: shown as a pop-up above everything until notifications are on (students must turn them on first).
 * When the phone cannot turn them on with one tap (blocked earlier, iPhone outside the home-screen app, in-app
 * browsers), the pop-up explains what to do and lets the student continue for now; it comes back on the next visit.
 */
export default function PushOptIn({ gate = false, hideOn = false }) {
  const [st, setSt] = useState('hidden'); // hidden | ask | on | denied | ios | unsupported | busy | err
  const [later, setLater] = useState(false);
  useEffect(() => {
    if (!VAPID_KEY || typeof window === 'undefined') return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) { setSt(ios && !standalone ? 'ios' : 'unsupported'); return; }
    if (Notification.permission === 'denied') { setSt('denied'); return; }
    if (Notification.permission === 'granted') {
      setSt('on');
      getFcmToken().then((t) => { let old = null; try { old = localStorage.getItem(LS); } catch {} if (t && t !== old) save(t); }).catch(() => {}); // tokens can change – keep it fresh
      return;
    }
    setSt('ask');
  }, []);
  async function turnOn() {
    setSt('busy');
    try {
      const p = await Notification.requestPermission();
      if (p !== 'granted') { setSt(p === 'denied' ? 'denied' : 'ask'); return; }
      const t = await getFcmToken();
      setSt(t && (await save(t)) ? 'on' : 'err');
    } catch { setSt('err'); }
  }
  if (st === 'hidden') return null;
  if (st === 'on') return hideOn ? null : <div className="small muted push-on">🔔 தேர்வு அறிவிப்புகள் இயக்கத்தில் உள்ளன / Notifications on</div>;
  if (gate && !later) {
    const stuck = st === 'denied' || st === 'ios' || st === 'unsupported';
    return (
      <div className="modal pushgate">
        <div className="card" role="dialog" aria-modal="true" aria-labelledby="pg-h">
          <h2 id="pg-h" style={{ marginTop: 0 }}>🔔 முதலில் அறிவிப்புகளை இயக்கவும்</h2>
          <p className="small" style={{ marginTop: 0 }}>புதிய தேர்வுகள், முடிவுகள், பயிற்சி வகுப்பு அறிவிப்புகள் உங்கள் கைபேசிக்கு உடனே வர, அறிவிப்புகளை இயக்கிய பிறகு தொடரவும் / Turn on notifications to continue.</p>
          {(st === 'ask' || st === 'busy' || st === 'err') && <>
            <ol className="small" style={{ paddingLeft: 18 }}><li>கீழே உள்ள பொத்தானை அழுத்தவும்</li><li>வரும் சாளரத்தில் <b>Allow / அனுமதி</b> என்பதைத் தேர்வு செய்யவும்</li></ol>
            <button onClick={turnOn} disabled={st === 'busy'}>{st === 'busy' ? 'காத்திருக்கவும்…' : '🔔 அறிவிப்புகளை இயக்கு / Turn on'}</button>
            {st === 'err' && <div className="small err" style={{ marginTop: 6 }}>இயக்க இயலவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் அழுத்தவும்.</div>}
          </>}
          {st === 'denied' && <div className="small">அறிவிப்புகள் முன்பு <b>Block</b> செய்யப்பட்டுள்ளன. Chrome-இல் முகவரிப் பட்டியின் இடப்புறம் உள்ள 🔒 / ⚙ குறியை அழுத்தி → <b>Permissions / Site settings → Notifications → Allow</b> என மாற்றி, பக்கத்தைப் புதுப்பிக்கவும் (refresh).
            <div className="row" style={{ marginTop: 8 }}><button onClick={() => window.location.reload()}>மாற்றிவிட்டேன் – மீண்டும் சோதி</button></div></div>}
          {st === 'ios' && <div className="small">iPhone: Safari-இல் <b>Share ⬆ → Add to Home Screen</b> செய்து, முகப்புத் திரையில் உள்ள ஐகான் வழியே திறந்து அறிவிப்புகளை இயக்கவும்.</div>}
          {st === 'unsupported' && <div className="small">இந்த browser-இல் அறிவிப்புகள் இயங்காது (WhatsApp / Facebook உள்ளே திறந்திருந்தால்). மேலே ⋮ → <b>Open in Chrome</b> தேர்வு செய்து, Chrome-இல் திறந்து அறிவிப்புகளை இயக்கவும்.</div>}
          {stuck && <p className="small muted" style={{ marginBottom: 0 }}><button className="linkish" onClick={() => setLater(true)}>இப்போதைக்குத் தொடர / Continue for now</button> – அடுத்த முறை மீண்டும் கேட்கப்படும்.</p>}
        </div>
      </div>
    );
  }
  if (gate && (st === 'ios' || st === 'unsupported') && later) return null;
  return (
    <div className="card push-card">
      <div><b>🔔 புதிய தேர்வு, முடிவுகள் பற்றிய அறிவிப்புகளை உங்கள் கைபேசியில் பெறுங்கள்</b>
        <div className="small">Get a notification on this phone when a new test or result is published.</div>
        {st === 'denied' && <div className="small err" style={{ marginTop: 6 }}>அறிவிப்புகள் தடுக்கப்பட்டுள்ளன. Browser-இல் முகவரிப் பட்டியின் 🔒 → Site settings → Notifications → Allow என மாற்றவும்.</div>}
        {st === 'ios' && <div className="small" style={{ marginTop: 6 }}>iPhone: Safari-இல் <b>Share ⬆ → Add to Home Screen</b> செய்து, முகப்புத் திரையில் உள்ள ஐகான் வழியே திறந்து இங்கே "இயக்கு" அழுத்தவும்.</div>}
        {st === 'err' && <div className="small err" style={{ marginTop: 6 }}>இயக்க இயலவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.</div>}
      </div>
      {(st === 'ask' || st === 'err' || st === 'busy') && <button onClick={turnOn} disabled={st === 'busy'}>{st === 'busy' ? 'காத்திருக்கவும்…' : '🔔 அறிவிப்புகளை இயக்கு / Turn on'}</button>}
    </div>
  );
}
