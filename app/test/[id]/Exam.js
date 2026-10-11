'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import QText from '@/components/QText';

const letters = (q) => (Number(q.nopts) === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']);
const pad = (n) => String(n).padStart(2, '0');

/** practice = { id } → a practice retake: separate API, own result page, no tab-switch penalties, never ranked. */
export default function Exam({ test, questions, saved, tabs: tabs0, deadline, serverNow, practice = null }) {
  const key = practice ? `practice-${practice.id}` : `exam-${test.id}`;
  const api = practice ? '/api/practice' : '/api/attempt';
  const resultUrl = practice ? `/practice/result/${practice.id}` : `/result/${test.id}`;
  const resumeUrl = practice ? `/practice/${test.id}` : `/test/${test.id}`;
  // Offline support: every answer, the tab count and a pending submit are kept on the phone (localStorage),
  // so the test continues without internet and is submitted automatically as soon as the connection is back.
  const mkey = `${key}-m`;
  const meta = () => { try { return JSON.parse(localStorage.getItem(mkey) || '{}'); } catch { return {}; } };
  const setMeta = (m) => { try { localStorage.setItem(mkey, JSON.stringify({ ...meta(), ...m })); } catch {} };
  const [answers, setAnswers] = useState(() => ({ ...saved }));
  const saveTimer = useRef(null);
  const dirty = useRef(false);
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const sending = useRef(false);
  const retry = useRef(null);
  const submitRef = useRef(() => {});
  useEffect(() => {
    try {
      // answers on this phone are the newest (they may not have reached the server yet)
      const loc = JSON.parse(localStorage.getItem(key) || '{}');
      if (Object.entries(loc).some(([k, v]) => saved[k] !== v)) { setAnswers((a) => ({ ...a, ...loc })); dirty.current = true; }
    } catch {}
    const m = meta();
    if (m.tabs > tabs.current) tabs.current = m.tabs;
    if (m.pending) setTimeout(() => submitRef.current(), 300);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [review, setReview] = useState(() => new Set());
  const [i, setI] = useState(0);
  const [lang, setLang] = useState('both');
  const [left, setLeft] = useState(deadline - serverNow);
  const [status, setStatus] = useState('சேமிக்கப்பட்டது');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPal, setShowPal] = useState(false);
  const offset = useRef(serverNow - Date.now());
  const tabs = useRef(tabs0 || 0);
  const leaving = useRef(false);      // page reload / navigation is not a tab switch
  const ansRef = useRef(answers);
  const done = useRef(false);
  ansRef.current = answers;

  const save = useCallback(async (beacon = false) => {
    if (done.current || pendingRef.current) return;
    const body = JSON.stringify({ testId: test.id, practiceId: practice?.id, answers: ansRef.current, tabs: tabs.current });
    if (beacon && navigator.sendBeacon) { navigator.sendBeacon(`${api}/save`, new Blob([body], { type: 'application/json' })); return; }
    dirty.current = false; setStatus('சேமிக்கிறது…');
    try {
      const r = await fetch(`${api}/save`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      const j = await r.json().catch(() => ({}));
      setOffline(false);
      // the server already closed the attempt (time over / no contact) → send the answers on this phone with the submit
      if (r.status === 409) { submitRef.current(); return false; }
      if (r.status === 401) { done.current = true; window.location.href = `/login?next=${encodeURIComponent(resumeUrl)}`; return false; }
      if (!r.ok) throw new Error(j.error);
      setStatus('சேமிக்கப்பட்டது ✓');
      return true;
    } catch { dirty.current = true; setOffline(true); setStatus('📴 இணைப்பு இல்லை – விடைகள் கைபேசியில் சேமிக்கப்படுகின்றன'); return true; }
  }, [test.id, api, resultUrl, resumeUrl, practice?.id]);

  const submit = useCallback(async () => {
    if (done.current || sending.current) return;
    sending.current = true; pendingRef.current = true; setBusy(true); setConfirm(false);
    clearTimeout(retry.current);
    const doneAt = meta().doneAt || Math.min(deadline, Date.now() + offset.current);
    setMeta({ pending: true, doneAt, tabs: tabs.current });
    try { localStorage.setItem(key, JSON.stringify(ansRef.current)); } catch {}
    try {
      const r = await fetch(`${api}/submit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId: test.id, practiceId: practice?.id, answers: ansRef.current, tabs: tabs.current, doneAt }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { done.current = true; window.location.href = `/login?next=${encodeURIComponent(resumeUrl)}`; return; } // answers stay on the phone; sent after login
      if (r.status >= 400 && r.status < 500) { done.current = true; try { localStorage.removeItem(key); localStorage.removeItem(mkey); } catch {} alert(j.error || 'பிழை'); window.location.href = resultUrl; return; }
      if (!r.ok) throw new Error(j.error);
      done.current = true;
      try { localStorage.removeItem(key); localStorage.removeItem(mkey); } catch {}
      window.location.href = j.redirect || resultUrl;
    } catch {
      // no internet: keep everything on the phone and keep trying – submitted automatically when the connection is back
      sending.current = false; setOffline(true); setPending(true);
      retry.current = setTimeout(() => submitRef.current(), 5000);
    }
  }, [test.id, key, mkey, api, resultUrl, resumeUrl, practice?.id, deadline]); // eslint-disable-line react-hooks/exhaustive-deps
  submitRef.current = submit;
  // connection back → send at once
  useEffect(() => {
    const on = () => { setOffline(false); if (pendingRef.current) submitRef.current(); else save(); };
    const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) setOffline(true);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [save]);

  // timer
  useEffect(() => {
    const t = setInterval(() => {
      const l = deadline - (Date.now() + offset.current);
      setLeft(l);
      if (l <= 0 && !done.current) { clearInterval(t); submit(); }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, submit]);
  // autosave every 20 s when changed; heartbeat every 60 s so the server knows the student is still writing
  useEffect(() => {
    let beat = Date.now();
    const t = setInterval(() => { if (dirty.current || Date.now() - beat >= 60000) { beat = Date.now(); save(); } }, 20000);
    return () => clearInterval(t);
  }, [save]);
  // tell the idle-logout watcher (in every open tab) that a test is being written
  useEffect(() => {
    const mark = () => { try { localStorage.setItem('fm_exam', String(Date.now())); } catch {} };
    mark(); window.__fmExam = true;
    const t = setInterval(mark, 15000);
    const hide = () => { try { localStorage.removeItem('fm_exam'); } catch {} };
    window.addEventListener('pagehide', hide);
    return () => { clearInterval(t); window.removeEventListener('pagehide', hide); window.__fmExam = false; hide(); };
  }, []);
  // leaving the page (other tab / app / screen lock): just save the answers – switching has no effect on the test
  useEffect(() => {
    const v = () => {
      if (done.current) return;
      if (document.visibilityState === 'hidden') {
        if (!practice && !leaving.current) { tabs.current += 1; setMeta({ tabs: tabs.current }); }
        save(true);
      } else save();
    };
    document.addEventListener('visibilitychange', v);
    const stop = (e) => e.preventDefault();
    document.addEventListener('copy', stop); document.addEventListener('contextmenu', stop);
    const unload = (e) => { if (!done.current) { leaving.current = true; setTimeout(() => { leaving.current = false; }, 4000); save(true); e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => { document.removeEventListener('visibilitychange', v); document.removeEventListener('copy', stop); document.removeEventListener('contextmenu', stop); window.removeEventListener('beforeunload', unload); };
  }, [save]);

  function pick(qno, v) {
    setAnswers((a) => {
      const n = { ...a };
      if (v === null) delete n[qno]; else n[qno] = v;
      try { localStorage.setItem(key, JSON.stringify(n)); } catch {}
      return n;
    });
    dirty.current = true; setStatus('சேமிக்க வேண்டியவை உள்ளன');
    clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => save(), 2500);
  }

  const q = questions[i];
  const bilingual = useMemo(() => questions.some((x) => x.en_q) && questions.some((x) => x.ta_q), [questions]);
  const counts = useMemo(() => {
    let ans = 0, e = 0;
    for (const qq of questions) { const v = answers[qq.qno]; if (v === 'E' && Number(qq.nopts) !== 5) e++; else if (v) ans++; }
    return { ans, e, un: questions.length - ans - e };
  }, [answers, questions]);
  const secs = Math.max(0, Math.floor(left / 1000));
  const time = `${Math.floor(secs / 3600)}:${pad(Math.floor(secs / 60) % 60)}:${pad(secs % 60)}`;
  const go = (n) => { setI(Math.max(0, Math.min(questions.length - 1, n))); setShowPal(false); window.scrollTo({ top: 0 }); };
  const hasEn = q.en_q || q.en_opts?.some(Boolean);
  const hasTa = q.ta_q || q.ta_opts?.some(Boolean);
  const showEn = hasEn && (lang !== 'ta' || !hasTa);
  const showTa = hasTa && (lang !== 'en' || !hasEn);

  const Palette = (
    <div className="palette">
      <div className="small"><b>{counts.ans}</b> விடையளித்தவை · <b>{counts.e}</b> E · <b>{counts.un}</b> விடுபட்டவை</div>
      <div className="legend"><span><i style={{ background: 'var(--ok)' }} />விடை</span>{test.allowE && <span><i style={{ background: '#8a8a8a' }} />E</span>}<span><i style={{ background: 'var(--chip)' }} />இல்லை</span><span><i style={{ outline: '2px solid #a86b00' }} />மீண்டும் பார்</span></div>
      <div className="pgrid">
        {questions.map((qq, k) => {
          const v = answers[qq.qno];
          return <button key={qq.qno} className={`pb ${v === 'E' && Number(qq.nopts) !== 5 ? 'e' : v ? 'ans' : ''} ${review.has(qq.qno) ? 'rev' : ''} ${k === i ? 'cur' : ''}`} onClick={() => go(k)}>{qq.qno}</button>;
        })}
      </div>
      <div style={{ marginTop: 12 }}><button className="danger" style={{ width: '100%' }} onClick={() => setConfirm(true)}>விடைத்தாளைச் சமர்ப்பி</button></div>
    </div>
  );

  return (
    <div onCopy={(e) => e.preventDefault()}>
      <div className="bar">
        <div><b>{practice && '🔁 பயிற்சி · '}{test.title}</b><div className="small" style={{ opacity: .85 }}>{status}</div></div>
        <div className="row">
          {bilingual && <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: 'auto', padding: '4px 8px' }} aria-label="மொழி">
            <option value="both">தமிழ் + English</option><option value="ta">தமிழ்</option><option value="en">English</option>
          </select>}
          <span className={`timer ${secs < 600 ? 'low' : ''}`}>⏱ {time}</span>
        </div>
      </div>
      {offline && !pending && <div className="offline-bar" role="status">📴 <b>இணைய இணைப்பு இல்லை – கவலை வேண்டாம், தொடர்ந்து எழுதுங்கள்.</b> உங்கள் விடைகள் இந்தக் கைபேசியிலேயே சேமிக்கப்படுகின்றன; இணைப்பு வந்தவுடன் தானாக அனுப்பப்படும். இந்தப் பக்கத்தை reload செய்யவோ மூடவோ வேண்டாம்.<div className="small">No internet – keep writing. Answers are kept on this phone and sent automatically when the connection returns.</div></div>}
      <div className="exam" style={{ marginTop: 12 }}>
        <div>
          <div className="qcard">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="qno">வினா {q.qno} / {questions.length}</span>
              <label className="small" style={{ margin: 0, fontWeight: 400 }}>
                <input type="checkbox" style={{ width: 'auto', marginRight: 6 }} checked={review.has(q.qno)}
                  onChange={() => setReview((r) => { const n = new Set(r); n.has(q.qno) ? n.delete(q.qno) : n.add(q.qno); return n; })} />
                மீண்டும் பார்க்க
              </label>
            </div>
            {showEn && <div className="lang"><QText text={q.en_q} /></div>}
            {showTa && <div className="lang"><QText text={q.ta_q} /></div>}
            <div className="opts">
              {letters(q).map((l, k) => {
                const en = showEn ? q.en_opts?.[k] : '', ta = showTa ? q.ta_opts?.[k] : '';
                return (
                  <button key={l} className={`opt ${answers[q.qno] === l ? 'on' : ''}`} onClick={() => pick(q.qno, l)}>
                    <span className="l">{l}</span>
                    <span className="t">{en && <span>{en}</span>}{ta && ta !== en && <span>{ta}</span>}</span>
                  </button>
                );
              })}
              {test.allowE && Number(q.nopts) !== 5 && (
                <button className={`opt e ${answers[q.qno] === 'E' ? 'on' : ''}`} onClick={() => pick(q.qno, 'E')}>
                  <span className="l">E</span><span className="t"><span>விடை தெரியவில்லை</span><span>Answer not known</span></span>
                </button>
              )}
            </div>
            <div className="nav">
              <button className="alt" onClick={() => go(i - 1)} disabled={i === 0}>← முந்தைய</button>
              {answers[q.qno] && <button className="alt" onClick={() => pick(q.qno, null)}>விடையை நீக்கு</button>}
              <button onClick={() => go(i + 1)} disabled={i === questions.length - 1}>அடுத்த →</button>
            </div>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="alt" onClick={() => setShowPal((s) => !s)}>வினா எண் பட்டியல்</button>
            <button className="alt" onClick={() => save()}>இப்போது சேமி</button>
          </div>
          {showPal && <div style={{ marginTop: 10 }} className="mobile-pal">{Palette}</div>}
        </div>
        <div className="desk-pal">{Palette}</div>
      </div>
      {pending && (
        <div className="modal">
          <div className="card tabwarn" role="alertdialog" aria-modal="true">
            <h2>📤 சமர்ப்பிக்கக் காத்திருக்கிறது…</h2>
            <p><b>இணைய இணைப்பு இல்லை.</b> உங்கள் விடைத்தாள் ({counts.ans + counts.e} விடைகள்) இந்தக் கைபேசியில் பாதுகாப்பாக உள்ளது. <b>இணைப்பு வந்தவுடன் தானாகச் சமர்ப்பிக்கப்படும்</b> – எதுவும் செய்ய வேண்டாம்.</p>
            <p className="small">Mobile data / Wi-Fi-ஐ இயக்கவும். இந்தப் பக்கத்தை மூட வேண்டாம். தவறுதலாக மூடிவிட்டால், இதே கைபேசியில் இதே browser-இல் இணையத்துடன் இத்தளத்தைத் திறந்தவுடன் தானாக அனுப்பப்படும் (3 நாட்களுக்குள்).</p>
            <p className="small muted">Waiting for internet – your answer sheet will be submitted automatically as soon as the connection is back.</p>
            <div className="row"><button onClick={() => submitRef.current()}>இப்போதே மீண்டும் முயற்சி / Retry now</button></div>
          </div>
        </div>
      )}
      {confirm && (
        <div className="modal" onClick={() => !busy && setConfirm(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h2>விடைத்தாளைச் சமர்ப்பிக்கவா?</h2>
            <p>விடையளித்தவை: <b>{counts.ans}</b> · E: <b>{counts.e}</b> · எதுவும் தேர்வு செய்யாதவை: <b style={{ color: counts.un ? 'var(--bad)' : undefined }}>{counts.un}</b></p>
            {counts.un > 0 && test.penalty && <p className="err small">எதுவும் தேர்வு செய்யாத வினாக்கள் உள்ளன – மதிப்பெண் குறைக்கப்படும்.{test.allowE ? ' விடை தெரியாவிடில் E தேர்வு செய்யவும்.' : ''}</p>}
            <p className="small muted">சமர்ப்பித்த பின் மாற்ற இயலாது.</p>
            <div className="row"><button className="danger" onClick={submit} disabled={busy}>{busy ? 'சமர்ப்பிக்கிறது…' : 'ஆம், சமர்ப்பி'}</button><button className="alt" onClick={() => setConfirm(false)} disabled={busy}>இல்லை</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
