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

/** Dashboard card: let the student turn on test notifications (Firebase Cloud Messaging). */
export default function PushOptIn() {
  const [st, setSt] = useState('hidden'); // hidden | ask | on | denied | ios | busy | err
  useEffect(() => {
    if (!VAPID_KEY || typeof window === 'undefined') return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) { if (ios && !standalone) setSt('ios'); return; }
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
  if (st === 'on') return <div className="small muted push-on">🔔 தேர்வு அறிவிப்புகள் இயக்கத்தில் உள்ளன / Notifications on</div>;
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
