'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MODES = [
  ['day', 'தினசரி', 'Daily'], ['week', 'வாராந்திரம்', 'Weekly'], ['month', 'மாதாந்திரம்', 'Monthly'],
  ['overall', 'ஒட்டுமொத்தம்', 'Overall'], ['subject', 'பாட வாரியாக', 'Subject-wise'], ['test', 'தேர்வு வாரியாக', 'Test-wise'],
];
const SEL_KEY = { day: 'date', week: 'week', month: 'month', subject: 'subject', test: 'test' };
const TA_MON = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
const TA_DAY = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
const dmy = (k) => { const [y, m, d] = k.split('-'); return `${d}.${m}.${y}`; };
const fmtDay = (k) => `${dmy(k)} (${TA_DAY[new Date(k + 'T00:00:00Z').getUTCDay()]})`;
const fmtWeek = (k) => { const e = new Date(new Date(k + 'T00:00:00Z').getTime() + 6 * 864e5).toISOString().slice(0, 10); return `${dmy(k).slice(0, 5)} – ${dmy(e)}`; };
const fmtMonth = (k) => { const [y, m] = k.split('-'); return `${TA_MON[Number(m) - 1]} ${y}`; };
const fmtTime = (s) => { if (s == null) return '–'; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
const SORTS = { rank: ['rank', 1], score: ['score', -1], pct: ['pct', -1], acc: ['acc', -1], secs: ['secs', 1] };
const PAGE = 25;

function Change({ c, hasPrev }) {
  if (!hasPrev) return null;
  if (c == null) return <span className="lbx-ch new" title="முந்தைய காலத்தில் இல்லை / New">புதிது</span>;
  if (c > 0) return <span className="lbx-ch up" title={`${c} இடங்கள் முன்னேற்றம்`}>▲{c}</span>;
  if (c < 0) return <span className="lbx-ch down" title={`${-c} இடங்கள் பின்னடைவு`}>▼{-c}</span>;
  return <span className="lbx-ch same" title="மாற்றமில்லை">–</span>;
}

function Spark({ v }) {
  if (!v || v.length < 2) return null;
  const W = 120, H = 34, max = Math.max(100, ...v), min = Math.min(0, ...v);
  const pts = v.map((y, i) => `${(i / (v.length - 1)) * W},${H - ((y - min) / (max - min || 1)) * H}`).join(' ');
  const up = v[v.length - 1] >= v[0];
  return (
    <svg className={`lbx-spark ${up ? 'up' : 'down'}`} viewBox={`-2 -2 ${W + 4} ${H + 4}`} width={W} height={H} role="img" aria-label={`கடைசி ${v.length} தேர்வுகளின் போக்கு: ${v.join('%, ')}%`}>
      <polyline points={pts} fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={W} cy={H - ((v[v.length - 1] - min) / (max - min || 1)) * H} r="3.5" />
    </svg>
  );
}

/**
 * Interactive leaderboard: exam → Daily / Weekly / Monthly / Overall / Subject-wise / Test-wise, with date / week / month /
 * subject / test pickers, podium, search, sort, load more, my rank card. Re-fetches every 30 s (no page reload).
 * All ranks are computed on the server (/api/leaderboard).
 */
export default function LeaderboardPro({ exams, initial, admin = false }) {
  const [code, setCode] = useState(initial?.exam || exams[0]?.code || '');
  const [mode, setMode] = useState(initial?.mode || 'overall');
  const [sel, setSel] = useState({});
  const [data, setData] = useState(initial || null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('rank');
  const [dir, setDir] = useState(1);
  const [shown, setShown] = useState(PAGE);
  const [at, setAt] = useState('');
  const [flash, setFlash] = useState(false);
  const reqId = useRef(0);
  const meRow = useRef(null);

  const query = useCallback((c = code, m = mode, s = sel) => {
    const p = new URLSearchParams({ exam: c, mode: m });
    if (SEL_KEY[m] && s[m] != null) p.set(SEL_KEY[m], s[m]);
    if (admin) p.set('all', '1');
    return p.toString();
  }, [code, mode, sel, admin]);

  const load = useCallback(async (opts = {}) => {
    const id = ++reqId.current;
    if (!opts.quiet) setLoading(true);
    try {
      const r = await fetch(`/api/leaderboard?${query(opts.code, opts.mode, opts.sel)}`, { cache: 'no-store' });
      const j = await r.json();
      if (id !== reqId.current) return;
      if (!r.ok) { setErr(j.message || 'தரவரிசையை ஏற்ற முடியவில்லை.'); return; }
      setErr('');
      setData((old) => {
        if (opts.quiet && old && JSON.stringify(old.rows) !== JSON.stringify(j.rows)) { setFlash(true); setTimeout(() => setFlash(false), 1600); }
        return j;
      });
      setAt(new Date(j.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch { if (id === reqId.current && !opts.quiet) setErr('இணைய இணைப்பைச் சரிபார்க்கவும்.'); }
    finally { if (id === reqId.current) setLoading(false); }
  }, [query]);

  // first paint uses the server-rendered view; afterwards refresh every 30 s while the page is visible
  useEffect(() => { if (!initial) load(); else setAt(new Date(initial.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') load({ quiet: true }); }, 30000);
    const v = () => { if (document.visibilityState === 'visible') load({ quiet: true }); };
    document.addEventListener('visibilitychange', v);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v); };
  }, [load]);

  const change = (patch) => {
    const c = patch.code ?? code, m = patch.mode ?? mode, s = patch.sel ?? sel;
    if (patch.code !== undefined) setCode(c);
    if (patch.mode !== undefined) setMode(m);
    if (patch.sel !== undefined) setSel(s);
    setShown(admin ? shown : PAGE);
    load({ code: c, mode: m, sel: s });
  };

  const rows = data?.rows || [];
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let l = t ? rows.filter((r) => `${r.label} ${r.sub || ''}`.toLowerCase().includes(t)) : rows.slice();
    const [k, d0] = SORTS[sort];
    const d = d0 * dir;
    if (sort !== 'rank' || dir !== 1) l.sort((a, b) => ((a[k] ?? Infinity) - (b[k] ?? Infinity)) * d || a.rank - b.rank);
    return l;
  }, [rows, q, sort, dir]);
  const sortBy = (k) => { if (sort === k) setDir(-dir); else { setSort(k); setDir(1); } };
  const arrow = (k) => (sort === k ? (dir === 1 ? ' ↓' : ' ↑') : '');
  const me = data?.me;
  const meIdx = filtered.findIndex((r) => r.me);
  const goMe = () => { if (meIdx >= shown) setShown(meIdx + 10); setTimeout(() => meRow.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); };
  const podium = rows.slice(0, 3);
  const opts = data?.options || {};
  const s = data?.sel;
  const examName = exams.find((e) => e.code === code)?.name || '';
  const basis = mode === 'test' ? 'இத் தேர்வின் மதிப்பெண் %' : mode === 'subject' ? 'இப் பகுதியில் பெற்ற மதிப்பெண் % (தேர்வுகளின் சராசரி)' : 'எழுதிய தேர்வுகளின் சராசரி மதிப்பெண் %';
  const exportHref = `/api/admin/leaderboard/export?${query(code, mode, { ...sel, [mode]: s })}`;

  return (
    <div className={`card lbx ${flash ? 'lbx-flash' : ''}`} aria-busy={loading}>
      <div className="lbx-head">
        <div>
          <h2>🏅 தரவரிசை <span className="lbx-en">Leaderboard</span></h2>
          <div className="small lbx-live"><span className="live-dot" /> தானாகப் புதுப்பிக்கப்படுகிறது · Live{at && <> · {at}</>}{loading && <> · ஏற்றுகிறது…</>}</div>
        </div>
        {exams.length > 1 && <select className="lb-select" value={code} onChange={(e) => change({ code: e.target.value, sel: {} })} aria-label="தேர்வு / Exam">
          {exams.map((e) => <option key={e.code} value={e.code}>{e.name}</option>)}
        </select>}
      </div>

      <div className="lbx-modes" role="tablist" aria-label="Leaderboard type">
        {MODES.map(([k, ta, en]) => <button key={k} type="button" role="tab" aria-selected={mode === k} className={mode === k ? 'on' : ''} onClick={() => change({ mode: k })}>{ta}<small>{en}</small></button>)}
      </div>

      <div className="lbx-filters">
        {mode === 'day' && <label>தேதி / Date<select value={s || ''} onChange={(e) => change({ sel: { ...sel, day: e.target.value } })} disabled={!opts.day?.length}>
          {(opts.day || []).map((k) => <option key={k} value={k}>{fmtDay(k)}</option>)}</select></label>}
        {mode === 'week' && <label>வாரம் / Week<select value={s || ''} onChange={(e) => change({ sel: { ...sel, week: e.target.value } })} disabled={!opts.week?.length}>
          {(opts.week || []).map((k) => <option key={k} value={k}>{fmtWeek(k)}</option>)}</select></label>}
        {mode === 'month' && <label>மாதம் / Month<select value={s || ''} onChange={(e) => change({ sel: { ...sel, month: e.target.value } })} disabled={!opts.month?.length}>
          {(opts.month || []).map((k) => <option key={k} value={k}>{fmtMonth(k)}</option>)}</select></label>}
        {mode === 'subject' && <label>பாடம் / Subject<select value={s || ''} onChange={(e) => change({ sel: { ...sel, subject: e.target.value } })} disabled={!opts.subject?.length}>
          {(opts.subject || []).map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}</select></label>}
        {mode === 'test' && <label>தேர்வு / Test<select value={s || ''} onChange={(e) => change({ sel: { ...sel, test: e.target.value } })} disabled={!opts.test?.length}>
          {(opts.test || []).map((t) => <option key={t.id} value={t.id}>{t.title} · {dmy(t.at)}</option>)}</select></label>}
        <label className="lbx-search">தேடு / Search<input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(admin ? shown : PAGE); }} placeholder={admin ? 'பெயர் / பதிவு எண் / மாவட்டம்' : data?.display === 'name' ? 'பெயர் / பதிவு எண் / மாவட்டம்' : 'பதிவு எண் / மாவட்டம்'} /></label>
        <label>வரிசைப்படுத்து / Sort<select value={`${sort}:${dir}`} onChange={(e) => { const [k, d] = e.target.value.split(':'); setSort(k); setDir(Number(d)); }}>
          <option value="rank:1">தரம் / Rank</option><option value="score:1">மதிப்பெண் / Score</option><option value="pct:1">சதவீதம் / %</option>
          <option value="acc:1">துல்லியம் / Accuracy</option><option value="secs:1">குறைந்த நேரம் / Time</option></select></label>
        {admin && <label>காட்டு / Show<select value={shown >= 1e6 ? 'all' : shown} onChange={(e) => setShown(e.target.value === 'all' ? 1e9 : Number(e.target.value))}>
          {[10, 25, 50].map((n) => <option key={n} value={n}>முதல் {n} / Top {n}</option>)}<option value="all">அனைவரும் / All</option></select></label>}
      </div>

      {err && <p className="err">{err}</p>}

      {me && <div className="lbx-me">
        <div className="lbx-me-rank">
          {me.rank ? <><small>உங்கள் தரம் / Your rank</small><b>#{me.rank}</b><span>{me.participants} பேரில்</span><Change c={me.change} hasPrev={data.hasPrev} /></>
            : <><small>உங்கள் தரம்</small><b>–</b><span>இப்பிரிவில் நீங்கள் எழுதவில்லை</span></>}
        </div>
        <div className="lbx-me-stats">
          <div><b>{me.score != null ? `${me.score}/${me.max}` : '–'}</b><small>மதிப்பெண் / Score</small></div>
          <div><b>{me.pct != null ? `${me.pct}%` : '–'}</b><small>சராசரி % / Avg</small></div>
          <div><b>{me.acc != null ? `${me.acc}%` : '–'}</b><small>துல்லியம் / Accuracy</small></div>
          <div><b>{me.n || 0}<span className="muted"> / {me.totalTests}</span></b><small>இப்பிரிவில் / மொத்தத் தேர்வுகள்</small></div>
          <div><b>{me.best != null ? `${me.best}/${me.bestMax}` : '–'}</b><small>அதிகபட்சம் / Highest</small></div>
          <div className="lbx-trend"><Spark v={me.trend} /><small>போக்கு / Trend</small></div>
        </div>
        <div className="row lbx-me-act">
          <a className="btn" href={`/rankings?v=me&e=${code}#progress`}>📈 என் செயல்திறன் வரலாறு / View My Performance History</a>
          {me.rank && meIdx >= 0 && <button type="button" className="btn alt" onClick={goMe}>📍 பட்டியலில் என் இடம்</button>}
        </div>
      </div>}

      {!rows.length && !loading && <p className="muted lbx-empty">{opts.test?.length ? 'இப் பிரிவில் இன்னும் முடிவுகள் இல்லை.' : `${examName} – இன்னும் யாரும் தேர்வு எழுதவில்லை.`}{(mode === 'overall' || mode === 'subject' || mode === 'month') && data?.minTests > 1 ? ` (குறைந்தது ${data.minTests} தேர்வுகள் எழுதியவர்கள் மட்டும்)` : ''}</p>}

      {podium.length > 0 && !q && sort === 'rank' && dir === 1 && <div className="lbx-podium" aria-label="முதல் மூன்று இடங்கள் / Top 3">
        {[podium[1], podium[0], podium[2]].map((p, i) => p && (
          <div key={i} className={`lbx-pod p${p.rank <= 3 ? p.rank : 3} ${p.me ? 'me' : ''}`}>
            <div className="lbx-medal">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</div>
            <b className="lbx-pname">{p.label}{p.me && <em> (நீங்கள்)</em>}</b>
            <small>{p.sub}</small>
            <div className="lbx-ppct">{p.pct}%</div>
            <small>{p.score}/{p.max} · துல்லியம் {p.acc}%</small>
            <div className="lbx-step"><span>{p.rank}</span></div>
          </div>
        ))}
      </div>}

      {rows.length > 0 && <>
        <div className="tablewrap"><table className="lbx-table">
          <thead><tr>
            <th className="sortable" onClick={() => sortBy('rank')}>தரம்{arrow('rank')}<small>Rank</small></th>
            <th>மாணவர்<small>Student</small></th>
            <th className="num sortable hide-sm" onClick={() => sortBy('score')}>மதிப்பெண்{arrow('score')}<small>Score</small></th>
            <th className="num sortable" onClick={() => sortBy('pct')}>%{arrow('pct')}<small>Percent</small></th>
            <th className="num sortable hide-sm" onClick={() => sortBy('acc')}>துல்லியம்{arrow('acc')}<small>Accuracy</small></th>
            <th className="num hide-sm">தேர்வுகள்<small>Tests</small></th>
            {rows[0].secs != null && <th className="num sortable hide-sm" onClick={() => sortBy('secs')}>நேரம்{arrow('secs')}<small>Avg time</small></th>}
          </tr></thead>
          <tbody>{filtered.slice(0, shown).map((r) => (
            <tr key={`${r.rank}-${r.label}-${r.sub}`} className={`${r.me ? 'me' : ''} ${r.rank <= 3 ? `lbx-t lbx-t${r.rank}` : ''}`} ref={r.me ? meRow : null}>
              <td className="lbx-rk"><b>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</b><Change c={r.change} hasPrev={data.hasPrev} /></td>
              <td><b>{r.label}</b>{r.me && <em className="lbx-you"> நீங்கள்</em>}<small>{r.sub}</small>
                <small className="show-sm">துல்லியம் {r.acc}% · {r.n} தேர்வு{r.secs != null ? ` · ${fmtTime(r.secs)}` : ''}</small></td>
              <td className="num hide-sm">{r.score}<small>/{r.max}</small></td>
              <td className="num"><b>{r.pct}%</b><small className="show-sm">{r.score}/{r.max}</small><span className="lbx-bar"><i style={{ width: `${Math.max(2, Math.min(100, r.pct))}%` }} /></span></td>
              <td className="num hide-sm">{r.acc}%</td>
              <td className="num hide-sm">{r.n}</td>
              {r.secs != null && <td className="num hide-sm">{fmtTime(r.secs)}</td>}
            </tr>
          ))}</tbody>
        </table></div>
        <div className="row lbx-more">
          <span className="small muted">{Math.min(shown, filtered.length)} / {filtered.length} காட்டப்படுகிறது{q && ` (தேடல்: மொத்தம் ${rows.length})`}</span>
          {filtered.length > shown && <button type="button" className="btn alt" onClick={() => setShown(shown + PAGE)}>மேலும் காட்டு / Load more</button>}
          {admin && <a className="btn tonal" href={exportHref}>⬇ Excel ஏற்றுமதி / Export</a>}
        </div>
      </>}

      <details className="small lbx-how">
        <summary>தரவரிசை எப்படிக் கணக்கிடப்படுகிறது? / How ranks are calculated</summary>
        <p>சமர்ப்பிக்கப்பட்ட, மதிப்பிடப்பட்ட தேர்வுகள் மட்டும் (முடிக்காத / நகல் முயற்சிகள் கணக்கில் இல்லை). அடிப்படை: <b>{basis}</b> – அதிகத் தேர்வுகள் எழுதியதற்காக மட்டும் கூடுதல் இடம் கிடையாது.
          சமமானால்: 1) அதிகத் துல்லியம் (சரி ÷ (சரி + தவறு)) 2) குறைவான தவறுகள் 3) குறைந்த நேரம். நான்கும் சமமானால் ஒரே தரம்.
          தினசரி / வாராந்திர / மாதாந்திரம் = அந்தக் காலத்தில் சமர்ப்பிக்கப்பட்ட தேர்வுகள். ▲▼ = முந்தைய {mode === 'overall' || mode === 'subject' ? 'தேர்வுக்கு முன் இருந்த' : 'காலத்தின்'} தரத்துடன் ஒப்பீடு.</p>
        <p className="muted">Ranked by average percentage per test (test-wise: the test score). Ties: higher accuracy → fewer wrong answers → less time. ▲▼ compare with the previous {mode === 'overall' || mode === 'subject' ? 'ranking before the latest test' : 'period'}.</p>
      </details>

      {admin && data?.extras && <AdminExtras x={data.extras} />}
    </div>
  );
}

function AdminExtras({ x }) {
  return (
    <div className="lbx-admin">
      <h3>மாவட்ட வாரியான செயல்திறன் / District-wise</h3>
      <div className="tablewrap"><table className="small">
        <thead><tr><th>மாவட்டம்</th><th className="num">மாணவர்கள்</th><th className="num">சராசரி %</th><th>மாவட்ட முதலிடம்</th></tr></thead>
        <tbody>{x.districts.map((d) => <tr key={d.district}><td>{d.district}</td><td className="num">{d.n}</td><td className="num">{d.avg}</td><td>#{d.top.rank} {d.top.name} <span className="muted">({d.top.reg_no}, {d.top.pct}%)</span></td></tr>)}</tbody>
      </table></div>
      <div className="grid2">
        {[['📈 முன்னேறி வருபவர்கள் / Improving', x.improving, 'up'], ['📉 பின்தங்கி வருபவர்கள் / Declining', x.declining, 'down']].map(([h, l, c]) => (
          <div key={c}>
            <h3>{h}</h3>
            <p className="small muted">கடைசித் தேர்வு % – அதற்கு முந்தைய தேர்வுகளின் சராசரி % (5 புள்ளிகளுக்கு மேல் மாற்றம்)</p>
            {l.length === 0 ? <p className="muted small">இல்லை.</p> : <div className="tablewrap"><table className="small">
              <thead><tr><th>மாணவர்</th><th className="num">முன்பு</th><th className="num">கடைசி</th><th className="num">மாற்றம்</th></tr></thead>
              <tbody>{l.map((t) => <tr key={t.reg_no}><td>{t.name}<small className="muted"> {t.reg_no} · {t.district} · {t.tests} தேர்வுகள்</small></td><td className="num">{t.before}</td><td className="num">{t.last}</td><td className={`num lbx-${c}`}>{t.delta > 0 ? '▲' : '▼'} {Math.abs(t.delta)}</td></tr>)}</tbody>
            </table></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
