import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';
import { testStatus, secLabel, secSort, catName, fmt, DISTRICT_EN } from '@/lib/util';
import { testAnalysis } from '@/lib/analysis';
import { mmss } from '@/lib/rank';
import CopyButton from '@/components/CopyButton';
export const dynamic = 'force-dynamic';

const LEVEL = { easy: 'எளிது', mod: 'நடுத்தரம்', hard: 'கடினம்' };

export default async function Analysis({ params }) {
  await ensureSchema();
  const sid = await studentId(); const adm = await isAdmin();
  if (!sid && !adm) redirect('/');
  const id = Number((await params).id);
  const A = await testAnalysis(id);
  if (!A) redirect('/dashboard');
  const { test, rows, items, hist, secStats, districts, summary: S, max } = A;
  if (!adm && (!test.published || testStatus(test) !== 'closed')) redirect('/dashboard');
  const me = sid ? rows.find((r) => r.student_id === sid) : null;
  const below = me ? rows.filter((r) => r.score < me.score).length : 0;
  const percentile = me && S.n > 1 ? Math.round((below / (S.n - 1)) * 1000) / 10 : me ? 100 : null;
  const dn = me ? rows.filter((r) => r.district === me.district).length : 0;
  const hmax = Math.max(1, ...hist.map((h) => h.n));
  const myBin = me ? hist.findIndex((h, i) => me.score >= h.from && (me.score < h.to || i === hist.length - 1)) : -1;
  const secs = [...secStats].sort((a, b) => secSort(a.key, b.key));
  const easyMisses = me ? items.filter((it) => it.pct >= 60 && me.answers?.[it.qno] !== it.answer).sort((a, b) => b.pct - a.pct).slice(0, 15) : [];
  const byDistrict = {};
  for (const r of rows) (byDistrict[r.district] ??= []).push(r);
  const distList = Object.entries(byDistrict).sort((a, b) => b[1].length - a[1].length || (DISTRICT_EN[a[0]] || a[0]).localeCompare(DISTRICT_EN[b[0]] || b[0]));
  const back = adm ? `/admin/test/${id}` : `/dashboard?c=${test.category}`;

  const share = [
    `*${test.title}* – முடிவுகள்`,
    `${catName(test.category)} · எழுதியோர்: ${S.n} · சராசரி: ${S.mean}/${max} · அதிகபட்சம்: ${S.top}`,
    '', '*முதல் 10 இடங்கள்:*',
    ...rows.slice(0, 10).map((r) => `${r.rank}. ${r.name} (${r.district}) – ${r.score}`),
    '', '*மாவட்ட முதலிடங்கள்:*',
    ...distList.map(([d, a]) => `${d}: ${a[0].name} – ${a[0].score}`),
  ].join('\n');

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><h1 style={{ margin: 0 }}>{test.title}</h1>
            <div className="small muted">{catName(test.category)} · {fmt(test.start_at)} – {fmt(test.end_at)} · {items.length} வினாக்கள் · {max} மதிப்பெண்</div></div>
          <div className="row noprint"><a className="btn alt" href={`/rank/${id}`}>முழுத் தரவரிசை</a><a className="btn alt" href={back}>திரும்பு</a></div>
        </div>
        <div className="stats" style={{ marginTop: 12 }}>
          <div className="stat"><b>{S.n}</b>எழுதியோர்</div>
          <div className="stat"><b>{S.mean}</b>சராசரி ({S.avgPct}%)</div>
          <div className="stat"><b>{S.median}</b>இடைநிலை (Median)</div>
          <div className="stat"><b>{S.top}</b>அதிகபட்சம்</div>
          <div className="stat"><b>{S.low}</b>குறைந்தபட்சம்</div>
          <div className="stat"><b>{S.avgMins} நி</b>சராசரி நேரம்</div>
        </div>
      </div>

      {me && (
        <div className="card" style={{ borderColor: 'var(--brand)' }}>
          <h2>உங்கள் செயல்திறன்</h2>
          <div className="stats">
            <div className="stat"><b>{me.score} / {max}</b>மதிப்பெண்</div>
            <div className="stat"><b>{me.rank} / {S.n}</b>ஒட்டுமொத்தத் தரம்</div>
            <div className="stat"><b>{me.drank} / {dn}</b>{me.district} தரம்</div>
            <div className="stat"><b>{percentile}</b>Percentile</div>
            <div className="stat"><b>{me.correct}</b>சரி</div>
            <div className="stat"><b>{me.wrong}</b>தவறு</div>
          </div>
          <div className="tablewrap" style={{ marginTop: 12 }}><table>
            <thead><tr><th>பகுதி</th><th className="num">உங்கள் மதிப்பெண்</th><th className="num">சராசரி</th><th className="num">முதலிடம்</th><th className="hide-sm" style={{ width: '35%' }}>நீங்கள் (அடர்) / சராசரி (வெளிர்)</th></tr></thead>
            <tbody>{secs.map((s) => {
              const mine = me.section_scores?.[s.key]?.marks ?? 0;
              return (
                <tr key={s.key}><td>{secLabel(s.key)}</td><td className="num"><b>{mine}</b> / {s.max}</td><td className="num">{s.avg}</td><td className="num">{s.top}</td>
                  <td className="hide-sm"><div className="hbar" title={`நீங்கள் ${mine} · சராசரி ${s.avg}`}><i className="avg" style={{ width: `${Math.max(0, (s.avg / s.max) * 100)}%` }} /><i style={{ width: `${Math.max(0, (mine / s.max) * 100)}%`, height: 5, top: 2.5 }} /></div></td></tr>
              );
            })}</tbody>
          </table></div>
          {easyMisses.length > 0 && (
            <p className="small" style={{ marginTop: 10 }}><b>பெரும்பாலோர் சரியாக எழுதியும் நீங்கள் தவறவிட்டவை:</b>{' '}
              {easyMisses.map((it) => `${it.qno} (${it.pct}%)`).join(', ')} — <a href={`/result/${id}`}>விடைகளைப் பார்</a></p>
          )}
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <h2>மதிப்பெண் பரவல்</h2>
          <div className="bars" role="img" aria-label="மதிப்பெண் பரவல் வரைபடம்">
            {hist.map((h, i) => (
              <div key={i} className={`b ${i === myBin ? 'me' : ''}`} style={{ height: `${(h.n / hmax) * 100}%` }} title={`${h.from}–${h.to}: ${h.n} பேர்${i === myBin ? ' (நீங்கள்)' : ''}`} />
            ))}
          </div>
          <div className="blabels">{hist.map((h, i) => <span key={i}>{Math.round(h.from)}</span>)}</div>
          <div className="tablewrap" style={{ marginTop: 8 }}><table className="small"><tbody>
            <tr><th>மதிப்பெண்</th>{hist.map((h, i) => <td key={i} className="num">{Math.round(h.from)}–{Math.round(h.to)}</td>)}</tr>
            <tr><th>பேர்</th>{hist.map((h, i) => <td key={i} className="num" style={i === myBin ? { fontWeight: 700 } : undefined}>{h.n}</td>)}</tr>
          </tbody></table></div>
          {me && <p className="small muted">வெளிர் நிறப் பட்டை: உங்கள் மதிப்பெண் உள்ள பகுதி.</p>}
        </div>
        <div className="card">
          <h2>பகுதி வாரியான சராசரி</h2>
          <div className="tablewrap"><table>
            <thead><tr><th>பகுதி</th><th className="num">வினாக்கள்</th><th className="num">சராசரி</th><th className="num">முதலிடம்</th><th className="num">துல்லியம்</th></tr></thead>
            <tbody>{secs.map((s) => <tr key={s.key}><td>{secLabel(s.key)}</td><td className="num">{s.total}</td><td className="num">{s.avg} / {s.max}</td><td className="num">{s.top}</td><td className="num">{s.acc}%</td></tr>)}</tbody>
          </table></div>
          <h3 style={{ marginTop: 14 }}>மாவட்ட ஒப்பீடு</h3>
          <div className="tablewrap"><table>
            <thead><tr><th>மாவட்டம்</th><th className="num">எழுதியோர்</th><th className="num">சராசரி</th><th className="num">அதிகபட்சம்</th></tr></thead>
            <tbody>{districts.map((d) => <tr key={d.district}><td>{d.district}</td><td className="num">{d.n}</td><td className="num">{d.avg}</td><td className="num">{d.top}</td></tr>)}</tbody>
          </table></div>
          <p className="small muted">வினாக்கள் கடினத்தன்மை: எளிது {S.easy} · நடுத்தரம் {S.mod} · கடினம் {S.hard}{test.allow_e ? ` · சராசரி E ${S.avgE}` : ''} · சராசரி விடுபட்டவை {S.avgBlank}</p>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>முதல் 10 இடங்கள்</h2>
          <div className="tablewrap"><table>
            <thead><tr><th>தரம்</th><th>பெயர்</th><th>மாவட்டம்</th><th className="num">மதிப்பெண்</th><th className="num">நேரம்</th></tr></thead>
            <tbody>{rows.slice(0, 10).map((r) => <tr key={r.id} style={r.student_id === sid ? { background: 'var(--sel)', fontWeight: 600 } : undefined}><td>{r.rank}</td><td>{r.name}</td><td>{r.district}</td><td className="num">{r.score}</td><td className="num">{mmss(r.secs)}</td></tr>)}</tbody>
          </table></div>
        </div>
        <div className="card">
          <h2>மாவட்ட வாரியாக முதல் 5</h2>
          <div style={{ maxHeight: 460, overflow: 'auto' }}>
          {distList.map(([d, a]) => (
            <div key={d} style={{ marginBottom: 10 }}>
              <h3>{d} <span className="small muted">({a.length} பேர்)</span></h3>
              <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>{a.slice(0, 5).map((r) => <li key={r.id}>{r.name} – <b>{r.score}</b></li>)}</ol>
            </div>
          ))}
          </div>
          {adm && <div className="noprint" style={{ marginTop: 10 }}><CopyButton text={share} label="WhatsApp-க்கு முடிவுச் சுருக்கம் நகலெடு" /></div>}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>வினா வாரியான பகுப்பாய்வு</h2>
          {adm && <a className="btn alt noprint" href={`/api/admin/export?type=items&test=${id}`}>CSV</a>}
        </div>
        <p className="small muted">சரி % = சரியாக விடையளித்தோர் சதவீதம். {adm && 'பகுப்பு (Discrimination) = முதல் 27% − கடைசி 27% சரி விகிதம்; 0.2-க்குக் குறைவு அல்லது எதிர்மறை என்றால் வினா/விடையைச் சரிபார்க்கவும். ⚑ = விடைக்குறிப்பைச் சரிபார்க்கவும் (தவறான விருப்பம் சரியானதை விட அதிகம் தேர்வு செய்யப்பட்டது).'}</p>
        <div className="tablewrap sticky-head" style={{ maxHeight: 640, overflow: 'auto' }}><table className="small">
          <thead><tr><th>வி.எண்</th><th>பகுதி</th><th>விடை</th>{me && <th>உங்கள்</th>}<th className="num">சரி %</th><th>நிலை</th><th className="num">A</th><th className="num">B</th><th className="num">C</th><th className="num">D</th><th className="num">E</th><th className="num">–</th>{adm && <th className="num">பகுப்பு</th>}{adm && <th>வினா</th>}</tr></thead>
          <tbody>{items.map((it) => {
            const mine = me?.answers?.[it.qno];
            return (
              <tr key={it.qno} style={it.flag && adm ? { background: '#fff4f2' } : undefined}>
                <td><b>{it.qno}</b>{adm && it.flag && <> <span className="tag flag" title="விடைக்குறிப்பைச் சரிபார்க்கவும்">⚑</span></>}</td>
                <td>{secLabel(it.section)}</td><td><b>{it.answer}</b></td>
                {me && <td style={{ color: mine === it.answer ? 'var(--ok)' : mine ? 'var(--bad)' : 'var(--muted)', fontWeight: 700 }}>{mine || '–'}</td>}
                <td className="num">{it.pct}</td><td><span className={`tag ${it.level}`}>{LEVEL[it.level]}</span></td>
                {['A', 'B', 'C', 'D', 'E', '-'].map((l) => <td key={l} className="num" style={l === it.answer ? { fontWeight: 700, color: 'var(--ok)' } : undefined}>{it.dist[l] ?? 0}</td>)}
                {adm && <td className="num">{it.disc ?? '–'}</td>}
                {adm && <td className="muted">{it.text}</td>}
              </tr>
            );
          })}</tbody>
        </table></div>
      </div>
    </>
  );
}
