'use client';
import { useEffect, useState } from 'react';

const f = (iso) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

/**
 * Dropdown of options → Ongoing / Completed tabs → list of tests.
 * options: [{ value, label, description }], data: { [value]: { ongoing, completed } }
 */
export default function ExamBrowser({ options, data, loggedIn, label = 'கிடைக்கும் தேர்வுகள் / Available exams', placeholder = 'தேர்வைத் தேர்வு செய்யவும் / Select an exam' }) {
  const [sel, setSel] = useState('');
  const [tab, setTab] = useState('ongoing');
  useEffect(() => {
    const read = () => {
      const raw = decodeURIComponent(window.location.hash.slice(1));
      const m = raw.match(/^(.*?)(?::(ongoing|completed))?$/);
      if (m && m[1] && options.some((o) => o.value === m[1])) {
        setSel(m[1]);
        setTab(m[2] || ((data[m[1]]?.ongoing?.length || !data[m[1]]?.completed?.length) ? 'ongoing' : 'completed'));
        if (m[2]) setTimeout(() => document.querySelector('.seg')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    };
    read(); window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [options, data]);
  const pick = (v) => { setSel(v); setTab((data[v]?.ongoing?.length || !data[v]?.completed?.length) ? 'ongoing' : 'completed'); try { history.replaceState(null, '', v ? `#${encodeURIComponent(v)}` : location.pathname); } catch {} };
  const opt = options.find((o) => o.value === sel);
  const d = data[sel] || { ongoing: [], completed: [] };
  const list = d[tab] || [];
  return (
    <div className="browser">
      <div className="card">
        <label htmlFor="exam-pick" style={{ marginTop: 0 }}>{label}</label>
        <select id="exam-pick" value={sel} onChange={(e) => pick(e.target.value)} className="bigselect">
          <option value="">{placeholder}</option>
          {options.map((o) => { const c = data[o.value]; const live = c?.ongoing?.filter((t) => t.open).length || 0;
            return <option key={o.value} value={o.value}>{o.label}{live ? `  •  ${live} நடைபெறுகிறது` : ''}</option>; })}
        </select>
        {opt?.description && <p className="small muted" style={{ marginBottom: 0 }}>{opt.description}</p>}
      </div>
      {sel && <>
        <div className="seg">
          <button type="button" className={tab === 'ongoing' ? 'on' : ''} onClick={() => setTab('ongoing')}>நடப்பு / வரவிருக்கும் <b>{d.ongoing.length}</b></button>
          <button type="button" className={tab === 'completed' ? 'on' : ''} onClick={() => setTab('completed')}>நிறைவடைந்தவை <b>{d.completed.length}</b></button>
        </div>
        {list.length === 0 && <div className="card muted">{tab === 'ongoing' ? 'இப்போது நடப்பு / வரவிருக்கும் தேர்வுகள் இல்லை.' : 'நிறைவடைந்த தேர்வுகள் இல்லை.'}</div>}
        {list.map((t) => (
          <div key={t.id} className="card titem">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{t.title}</b>
              {tab === 'ongoing' ? <span className={`pill ${t.open ? 'open' : 'upcoming'}`}>{t.open ? 'நடைபெறுகிறது' : 'வரவிருக்கிறது'}</span> : <span className="pill closed">நிறைவடைந்தது</span>}
            </div>
            <div className="small muted">{f(t.start)} – {f(t.end)} · {t.nq} வினாக்கள் · {t.mins} நிமிடம்</div>
            {tab === 'ongoing' && t.open && <a className="btn" style={{ marginTop: 8 }} href={`/test/${t.id}`}>{loggedIn ? 'தேர்வை எழுது →' : 'உள்நுழைந்து எழுது →'}</a>}
            {tab === 'completed' && <>
              <div className="small" style={{ marginTop: 4 }}>எழுதியோர் <b>{t.n}</b>{t.top != null && <> · அதிகபட்சம் <b>{t.top}</b> / {t.max} · சராசரி <b>{t.avgPct}%</b></>}</div>
              {t.toppers.length > 0 && <details className="small"><summary>முதல் {t.toppers.length} இடங்கள்</summary>
                <ol className="toplist">{t.toppers.map((p, i) => <li key={i}><b>{p.name}</b> <span className="muted">({p.district})</span> – {p.score}</li>)}</ol>
              </details>}
              {loggedIn && <a className="small" href={`/result/${t.id}`}>என் விடைகள் / பகுப்பாய்வு →</a>}
            </>}
          </div>
        ))}
      </>}
    </div>
  );
}
