'use client';
import { useState } from 'react';

const SEC = { 'தமிழ்': 'பொதுத்தமிழ்', GS: 'பொது அறிவு', APT: 'திறனறிவு & காரணவியல்' };
const medal = (r) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r);
/** Interactive public leaderboard: exam dropdown → Latest test / Overall / Most improved / Improvement areas. */
export default function Leaderboard({ exams, data }) {
  const avail = exams.filter((e) => data[e.code]);
  const [code, setCode] = useState(avail[0]?.code || '');
  const [tab, setTab] = useState('latest');
  if (!avail.length) return null;
  const d = data[code];
  const TABS = [['latest', '🏆 சமீபத்திய தேர்வு'], ['overall', '⭐ ஒட்டுமொத்தம்'], ['improved', '📈 அதிக முன்னேற்றம்'], ['areas', '🎯 மேம்படுத்த வேண்டியவை']];
  return (
    <div className="card lb">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>🏅 தரவரிசை / Leaderboard</h2>
        <select value={code} onChange={(e) => setCode(e.target.value)} className="lb-select" aria-label="தேர்வு">
          {avail.map((e) => <option key={e.code} value={e.code}>{e.name}</option>)}
        </select>
      </div>
      <div className="seg" style={{ marginTop: 12 }}>
        {TABS.map(([k, l]) => <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'latest' && <>
        <p className="small muted">{d.latest.title} · எழுதியோர் {d.latest.n} · சராசரி {d.latest.avgPct}%</p>
        <ol className="lb-list">{d.latest.top.map((p, i) => (
          <li key={i}><span className="lb-rank">{medal(p.rank)}</span><span className="lb-name"><b>{p.name}</b><small>{p.district}</small></span>
            <span className="lb-bar"><i style={{ width: `${Math.max(2, p.pct)}%` }} /></span><span className="lb-score">{p.score}<small>/{d.latest.max}</small></span></li>))}
        </ol>
      </>}
      {tab === 'overall' && <>
        <p className="small muted">கடைசி {d.tests} தேர்வுகளின் சராசரி மதிப்பெண் %</p>
        <ol className="lb-list">{d.overall.map((p, i) => (
          <li key={i}><span className="lb-rank">{medal(i + 1)}</span><span className="lb-name"><b>{p.name}</b><small>{p.district} · {p.n} தேர்வுகள்</small></span>
            <span className="lb-bar"><i style={{ width: `${Math.max(2, p.avg)}%` }} /></span><span className="lb-score">{p.avg}%</span></li>))}
        </ol>
      </>}
      {tab === 'improved' && <>
        <p className="small muted">முந்தைய தேர்வை விடக் கடைசித் தேர்வில் அதிகம் முன்னேறியவர்கள்</p>
        {d.improved.length === 0 ? <p className="muted">இரண்டு அல்லது அதற்கு மேற்பட்ட தேர்வுகள் எழுதியவர்கள் இன்னும் இல்லை.</p> :
          <ol className="lb-list">{d.improved.map((p, i) => (
            <li key={i}><span className="lb-rank">{i + 1}</span><span className="lb-name"><b>{p.name}</b><small>{p.district} · {p.from}% → {p.to}%</small></span>
              <span className="lb-gain">▲ {p.gain}%</span></li>))}
          </ol>}
      </>}
      {tab === 'areas' && <>
        <p className="small muted">சமீபத்திய தேர்வில் அனைத்து மாணவர்களின் பகுதி வாரியான சராசரித் துல்லியம் – குறைவானது முதலில்</p>
        {d.sections.map((s, i) => (
          <div key={s.k} className="area"><span>{i === 0 ? '⚠️ ' : ''}{SEC[s.k] || s.k}</span>
            <span className="lb-bar"><i style={{ width: `${s.acc}%`, background: s.acc < 50 ? 'var(--bad)' : s.acc < 70 ? 'var(--warn)' : 'var(--ok)' }} /></span><b>{s.acc}%</b></div>))}
        {d.sections[0] && <p className="small">💡 பெரும்பாலான மாணவர்கள் <b>{SEC[d.sections[0].k] || d.sections[0].k}</b> பகுதியில் அதிக மதிப்பெண் இழக்கின்றனர் – இப்பகுதியில் கூடுதல் பயிற்சி செய்யுங்கள்.</p>}
      </>}
    </div>
  );
}
