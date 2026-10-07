'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import QText from '@/components/QText';

const letters = (q) => (Number(q.nopts) === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']);
const pad = (n) => String(n).padStart(2, '0');

export default function Exam({ test, questions, saved, tabs: tabs0, deadline, serverNow }) {
  const key = `exam-${test.id}`;
  const [answers, setAnswers] = useState(() => ({ ...saved }));
  const saveTimer = useRef(null);
  const dirty = useRef(false);
  useEffect(() => {
    try {
      const loc = JSON.parse(localStorage.getItem(key) || '{}');
      const extra = Object.entries(loc).filter(([k]) => !saved[k]);
      if (extra.length) { setAnswers((a) => ({ ...Object.fromEntries(extra), ...a })); dirty.current = true; }
    } catch {}
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
  const ansRef = useRef(answers);
  const done = useRef(false);
  ansRef.current = answers;

  const save = useCallback(async (beacon = false) => {
    if (done.current) return;
    const body = JSON.stringify({ testId: test.id, answers: ansRef.current, tabs: tabs.current });
    if (beacon && navigator.sendBeacon) { navigator.sendBeacon('/api/attempt/save', new Blob([body], { type: 'application/json' })); return; }
    dirty.current = false; setStatus('சேமிக்கிறது…');
    try {
      const r = await fetch('/api/attempt/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { done.current = true; window.location.href = `/result/${test.id}`; return; }
      if (!r.ok) throw new Error(j.error);
      setStatus('சேமிக்கப்பட்டது ✓');
    } catch { dirty.current = true; setStatus('சேமிக்க இயலவில்லை – இணைப்பைச் சரிபார்க்கவும்'); }
  }, [test.id]);

  const submit = useCallback(async () => {
    if (done.current) return;
    setBusy(true);
    try {
      const r = await fetch('/api/attempt/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId: test.id, answers: ansRef.current, tabs: tabs.current }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error);
      done.current = true;
      try { localStorage.removeItem(key); } catch {}
      window.location.href = j.redirect || `/result/${test.id}`;
    } catch (e) { setBusy(false); alert('சமர்ப்பிக்க இயலவில்லை: ' + (e.message || 'இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்')); }
  }, [test.id, key]);

  // timer
  useEffect(() => {
    const t = setInterval(() => {
      const l = deadline - (Date.now() + offset.current);
      setLeft(l);
      if (l <= 0 && !done.current) { clearInterval(t); submit(); }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, submit]);
  // autosave every 20 s when changed
  useEffect(() => { const t = setInterval(() => { if (dirty.current) save(); }, 20000); return () => clearInterval(t); }, [save]);
  // tab switches + save on hide
  useEffect(() => {
    const v = () => { if (document.visibilityState === 'hidden') { tabs.current += 1; save(true); } };
    document.addEventListener('visibilitychange', v);
    const stop = (e) => e.preventDefault();
    document.addEventListener('copy', stop); document.addEventListener('contextmenu', stop);
    const unload = (e) => { if (!done.current) { save(true); e.preventDefault(); e.returnValue = ''; } };
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
      <div className="legend"><span><i style={{ background: '#1e7a3c' }} />விடை</span>{test.allowE && <span><i style={{ background: '#8a8a8a' }} />E</span>}<span><i style={{ background: '#eee' }} />இல்லை</span><span><i style={{ outline: '2px solid #a86b00' }} />மீண்டும் பார்</span></div>
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
        <div><b>{test.title}</b><div className="small" style={{ opacity: .85 }}>{status}</div></div>
        <div className="row">
          {bilingual && <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: 'auto', padding: '4px 8px' }} aria-label="மொழி">
            <option value="both">தமிழ் + English</option><option value="ta">தமிழ்</option><option value="en">English</option>
          </select>}
          <span className={`timer ${secs < 600 ? 'low' : ''}`}>⏱ {time}</span>
        </div>
      </div>
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
      {confirm && (
        <div className="modal" onClick={() => !busy && setConfirm(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h2>விடைத்தாளைச் சமர்ப்பிக்கவா?</h2>
            <p>விடையளித்தவை: <b>{counts.ans}</b> · E: <b>{counts.e}</b> · எதுவும் தேர்வு செய்யாதவை: <b style={{ color: counts.un ? '#b3261e' : undefined }}>{counts.un}</b></p>
            {counts.un > 0 && test.penalty && <p className="err small">எதுவும் தேர்வு செய்யாத வினாக்கள் உள்ளன – மதிப்பெண் குறைக்கப்படும்.{test.allowE ? ' விடை தெரியாவிடில் E தேர்வு செய்யவும்.' : ''}</p>}
            <p className="small muted">சமர்ப்பித்த பின் மாற்ற இயலாது.</p>
            <div className="row"><button className="danger" onClick={submit} disabled={busy}>{busy ? 'சமர்ப்பிக்கிறது…' : 'ஆம், சமர்ப்பி'}</button><button className="alt" onClick={() => setConfirm(false)} disabled={busy}>இல்லை</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
