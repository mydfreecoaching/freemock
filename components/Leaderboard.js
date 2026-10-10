'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SEC = { 'தமிழ்': 'பொதுத்தமிழ்', GS: 'பொது அறிவு', APT: 'திறனறிவு & காரணவியல்' };
const medal = (r) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r);
/** Interactive public leaderboard: exam dropdown → Latest test / Overall / Most improved / Improvement areas. */
export default function Leaderboard({ exams, data }) {
  const avail = exams.filter((e) => data[e.code]);
  const first = avail.find((e) => data[e.code]?.live?.length) || avail[0];
  const [code, setCode] = useState(first?.code || '');
  const [tab, setTab] = useState(data[first?.code]?.combined ? 'combined' : data[first?.code]?.live?.length ? 'live' : 'latest');
  const router = useRouter();
  const anyLive = avail.some((e) => data[e.code]?.live?.length || data[e.code]?.combined?.running);
  const [at, setAt] = useState('');
  // live ranking: refresh every minute while tests are running
  useEffect(() => {
    setAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    if (!anyLive) return;
    const t = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(t);
  }, [anyLive, router, data]);
  if (!avail.length) return null;
  const d = data[code];
  // every exam: one combined ranking instead of separate per-test rankings
  const TABS = d.combined ? [['combined', '🏆 ஒருங்கிணைந்த தரவரிசை'], ...(d.sections ? [['improved', '📈 அதிக முன்னேற்றம்'], ['areas', '🎯 மேம்படுத்த வேண்டியவை']] : [])]
    : [...(d.live?.length ? [['live', '🔴 நேரலை / Live']] : []),
      ...(d.latest ? [['latest', '🏆 சமீபத்திய தேர்வு'], ['overall', '⭐ ஒட்டுமொத்தம்'], ['improved', '📈 அதிக முன்னேற்றம்'], ['areas', '🎯 மேம்படுத்த வேண்டியவை']] : [])];
  const cur = TABS.some(([k]) => k === tab) ? tab : TABS[0][0];
  return (
    <div className="card lb">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>🏅 தரவரிசை / Leaderboard</h2>
        <select value={code} onChange={(e) => { setCode(e.target.value); setTab(data[e.target.value]?.combined ? 'combined' : data[e.target.value]?.live?.length ? 'live' : 'latest'); }} className="lb-select" aria-label="தேர்வு">
          {avail.map((e) => <option key={e.code} value={e.code}>{e.name}</option>)}
        </select>
      </div>
      <div className="seg" style={{ marginTop: 12 }}>
        {TABS.map(([k, l]) => <button key={k} type="button" className={cur === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {cur === 'live' && d.live.map((L) => (
        <div key={L.id} className="lb-live">
          <p className="small"><span className="live-dot" /> <b>{L.title}</b> — நடைபெறுகிறது (முடிவு: {new Date(L.ends).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})<br />
            <span className="muted">இதுவரை எழுதியோர் {L.n} · சராசரி {L.avgPct}% · மாணவர்கள் எழுத எழுத தரவரிசை மாறும் · புதுப்பிப்பு {at}</span></p>
          <ol className="lb-list">{L.top.map((p, i) => (
            <li key={i}><span className="lb-rank">{medal(p.rank)}</span><span className="lb-name"><b>{p.name}</b><small>{p.district}</small></span>
              <span className="lb-bar"><i style={{ width: `${Math.max(2, p.pct)}%` }} /></span><span className="lb-score">{p.score}<small>/{L.max}</small></span></li>))}
          </ol>
          <p className="small"><a href={`/rank/${L.id}`}>முழு நேரலைத் தரவரிசை →</a></p>
        </div>
      ))}
      {cur === 'latest' && <>
        <p className="small muted">{d.latest.title} · எழுதியோர் {d.latest.n} · சராசரி {d.latest.avgPct}%</p>
        <ol className="lb-list">{d.latest.top.map((p, i) => (
          <li key={i}><span className="lb-rank">{medal(p.rank)}</span><span className="lb-name"><b>{p.name}</b><small>{p.district}</small></span>
            <span className="lb-bar"><i style={{ width: `${Math.max(2, p.pct)}%` }} /></span><span className="lb-score">{p.score}<small>/{d.latest.max}</small></span></li>))}
        </ol>
      </>}
      {cur === 'combined' && <>
        <p className="small muted">{d.combined.done > 0 ? <>நிறைவடைந்த <b>{d.combined.done}</b> தேர்வுகளையும் எழுதியவர்களில்</> : 'எழுதியவர்களில்'} முதல் 10 இடங்கள் – மொத்த மதிப்பெண் அடிப்படையில் · தகுதியானோர் {d.combined.n}
          {d.combined.running > 0 && <><br /><span className="live-dot" /> தேர்வு நடைபெறுகிறது – மாணவர்கள் எழுத எழுத மதிப்பெண் சேர்ந்து தரவரிசை மாறும் · புதுப்பிப்பு {at}</>}</p>
        {d.combined.top.length === 0 ? <p className="muted">தகுதியானவர்கள் இன்னும் இல்லை.</p> : (
          <div className="tablewrap"><table className="lb-table">
            <thead><tr><th>#</th><th>பெயர் / மாவட்டம்</th>{d.combined.tests.map((t) => <th key={t.n} className="num" title={t.title}>தேர்வு {t.n}{t.open && <small>🔴 நேரலை</small>}</th>)}<th className="num">மொத்தம்<small>/{d.combined.grand}</small></th></tr></thead>
            <tbody>{d.combined.top.map((p, i) => (
              <tr key={i}><td className="lb-rank">{medal(p.rank)}</td><td><b>{p.name}</b><small>{p.district}</small></td>
                {p.marks.map((m, k) => <td key={k} className="num">{m ?? '–'}</td>)}<td className="num"><b>{p.total}</b></td></tr>))}
            </tbody>
          </table></div>
        )}
        <p className="small"><a href={`/combined/${code}`}>முழு ஒருங்கிணைந்த தரவரிசை →</a></p>
      </>}
      {cur === 'overall' && <>
        <p className="small muted">கடைசி {d.tests} தேர்வுகளின் சராசரி மதிப்பெண் %</p>
        <ol className="lb-list">{d.overall.map((p, i) => (
          <li key={i}><span className="lb-rank">{medal(i + 1)}</span><span className="lb-name"><b>{p.name}</b><small>{p.district} · {p.n} தேர்வுகள்</small></span>
            <span className="lb-bar"><i style={{ width: `${Math.max(2, p.avg)}%` }} /></span><span className="lb-score">{p.avg}%</span></li>))}
        </ol>
      </>}
      {cur === 'improved' && <>
        <p className="small muted">முந்தைய தேர்வை விடக் கடைசித் தேர்வில் அதிகம் முன்னேறியவர்கள்</p>
        {d.improved.length === 0 ? <p className="muted">இரண்டு அல்லது அதற்கு மேற்பட்ட தேர்வுகள் எழுதியவர்கள் இன்னும் இல்லை.</p> :
          <ol className="lb-list">{d.improved.map((p, i) => (
            <li key={i}><span className="lb-rank">{i + 1}</span><span className="lb-name"><b>{p.name}</b><small>{p.district} · {p.from}% → {p.to}%</small></span>
              <span className="lb-gain">▲ {p.gain}%</span></li>))}
          </ol>}
      </>}
      {cur === 'areas' && <>
        <p className="small muted">சமீபத்திய தேர்வில் அனைத்து மாணவர்களின் பகுதி வாரியான சராசரித் துல்லியம் – குறைவானது முதலில்</p>
        {d.sections.map((s, i) => (
          <div key={s.k} className="area"><span>{i === 0 ? '⚠️ ' : ''}{SEC[s.k] || s.k}</span>
            <span className="lb-bar"><i style={{ width: `${s.acc}%`, background: s.acc < 50 ? 'var(--bad)' : s.acc < 70 ? 'var(--warn)' : 'var(--ok)' }} /></span><b>{s.acc}%</b></div>))}
        {d.sections[0] && <p className="small">💡 பெரும்பாலான மாணவர்கள் <b>{SEC[d.sections[0].k] || d.sections[0].k}</b> பகுதியில் அதிக மதிப்பெண் இழக்கின்றனர் – இப்பகுதியில் கூடுதல் பயிற்சி செய்யுங்கள்.</p>}
      </>}
    </div>
  );
}
