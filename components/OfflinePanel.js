import { sql } from '@/lib/db';
import Form from '@/components/Form';
import { offlineList, offlineCounts, STATUS_LABEL, verifyAllPending } from '@/lib/offline';
import { placeName } from '@/lib/venueWriters';

const dmyT = (d) => new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

/**
 * Admin: paper-test (office) marks – counts, place-wise online vs office writers, filters, verify / correct / reject / delete,
 * add a mark directly. `test` = one test (shown inside the test page) or null (all tests, with a test filter).
 */
export default async function OfflinePanel({ test = null, sp = {}, path, tests = [] }) {
  const f = { test: test?.id || Number(sp.ot) || 0, status: ['pending', 'verified', 'rejected'].includes(sp.os) ? sp.os : '', district: String(sp.od || ''), venue: String(sp.ov || ''), q: String(sp.oq || '').trim().slice(0, 40), from: /^\d{4}-\d{2}-\d{2}$/.test(sp.from || '') ? sp.from : '', to: /^\d{4}-\d{2}-\d{2}$/.test(sp.to || '') ? sp.to : '' };
  const list = await offlineList(f);
  if (test) await verifyAllPending();
  const c = test ? await offlineCounts(test.id) : null;
  // place-wise: writers online vs at the office (verified) for this test
  const places = test ? await sql`SELECT s.district, s.coaching_venue v,
      count(*) FILTER (WHERE NOT a.offline)::int online, count(*) FILTER (WHERE a.offline)::int offline
    FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.test_id=${test.id} AND a.submitted_at IS NOT NULL
    GROUP BY 1, 2 ORDER BY 1, 4 DESC, 3 DESC` : [];
  const districts = [...new Set((await sql`SELECT DISTINCT s.district FROM offline_scores o JOIN students s ON s.id=o.student_id ORDER BY 1`).map((r) => r.district))];
  const venues = [...new Set((await sql`SELECT DISTINCT s.coaching_venue v FROM offline_scores o JOIN students s ON s.id=o.student_id WHERE s.coaching_venue IS NOT NULL ${f.district ? sql`AND s.district=${f.district}` : sql``}`).map((r) => r.v))];
  const shown = { pending: list.filter((r) => r.status === 'pending').length, verified: list.filter((r) => r.status === 'verified').length, rejected: list.filter((r) => r.status === 'rejected').length };

  return (
    <div className="card" id="offline">
      <h2 style={{ marginTop: 0 }}>📝 அலுவலகத்தில் நேரடியாக எழுதியவர்கள் / Paper tests at the office</h2>
      {c && <section className="statband vw-stats" style={{ marginBottom: 12 }}>
        <div><b>{c.online}</b><span>இணையவழியில் எழுதியவர்கள்</span></div>
        <div><b>{c.verified}</b><span>நேரடியாக எழுதியவர்கள்</span></div>
        <div><b>{c.online + c.verified}</b><span>மொத்தம் தரவரிசையில்</span></div>
      </section>}
      {places.length > 0 && <details className="small" open={!!places.find((p) => p.offline)}>
        <summary><b>இட வாரியாக – இணையவழி / நேரடி</b></summary>
        <div className="tablewrap"><table className="small">
          <thead><tr><th>மாவட்டம்</th><th>இடம்</th><th className="num">இணையவழி</th><th className="num">நேரடி</th><th className="num">மொத்தம்</th></tr></thead>
          <tbody>{places.map((p) => <tr key={`${p.district}|${p.v}`}><td>{p.district}</td><td>{placeName(p.v) || <span className="muted">குறிப்பிடவில்லை</span>}</td><td className="num">{p.online}</td><td className="num"><b>{p.offline}</b></td><td className="num">{p.online + p.offline}</td></tr>)}</tbody>
        </table></div>
      </details>}

      <form method="get" action={`${path}#offline`} className="grid3" style={{ marginTop: 10 }}>
        {!test && <div><label>தேர்வு</label><select name="ot" defaultValue={f.test || ''}><option value="">அனைத்தும்</option>{tests.map((t) => <option key={t.id} value={t.id}>{t.unit ? `அலகு ${t.unit} · ` : ''}{t.title}</option>)}</select></div>}
        <div><label>நிலை / Status</label><select name="os" defaultValue={f.status}><option value="">அனைத்தும்</option>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label>மாவட்டம்</label><select name="od" defaultValue={f.district}><option value="">அனைத்தும்</option>{districts.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div><label>இடம்</label><select name="ov" defaultValue={f.venue}><option value="">அனைத்தும்</option>{venues.map((v) => <option key={v} value={v}>{placeName(v)}</option>)}</select></div>
        <div><label>தேதி முதல்</label><input type="date" name="from" defaultValue={f.from} /></div>
        <div><label>தேதி வரை</label><input type="date" name="to" defaultValue={f.to} /></div>
        <div><label>பதிவு எண் / பெயர் / கைபேசி</label><input name="oq" defaultValue={f.q} /></div>
        <div style={{ alignSelf: 'end' }}><button type="submit">வடிகட்டு / Filter</button> <a className="btn alt" href={`${path}#offline`}>மீட்டமை</a></div>
      </form>

      <p className="small" style={{ margin: '10px 0' }}>வடிகட்டலில்: <b>{list.length}</b> பேர் · சரிபார்த்தது {shown.verified} · சரிபார்ப்பில் {shown.pending} · நிராகரித்தது {shown.rejected}</p>
      {test && c.pending > 0 && <Form action="/api/admin/offline" submit={`✔ சரிபார்ப்பிலுள்ள ${c.pending} மதிப்பெண்களையும் சரிபார்`} confirm="விடைத்தாள்களுடன் ஒப்பிட்டுவிட்டீர்களா? அனைத்து நிலுவை மதிப்பெண்களும் தரவரிசையில் சேர்க்கப்படும்." className="inline-form">
        <input type="hidden" name="action" value="verifyAll" /><input type="hidden" name="test_id" value={test.id} /></Form>}

      {list.length > 0 && <div className="tablewrap" style={{ maxHeight: 640, overflow: 'auto', marginTop: 8 }}><table className="small offtable">
        <thead><tr>{!test && <th>தேர்வு</th>}<th>மாணவர்</th><th>மாவட்டம் / இடம்</th><th className="num">சரி / தவறு</th><th className="num">மதிப்பெண்</th><th>நிலை</th><th>உள்ளிட்டது</th><th>செயல்</th></tr></thead>
        <tbody>{list.map((r) => (
          <tr key={r.id} className={`off-${r.status}`}>
            {!test && <td><a href={`/admin/test/${r.test_id}#offline`}>{r.unit ? `அலகு ${r.unit} · ` : ''}{r.title}</a></td>}
            <td><b>{r.name}</b><br /><span className="muted">{r.reg_no} · {r.mobile}</span></td>
            <td>{r.district}<br /><span className="muted">{placeName(r.coaching_venue) || '—'}</span></td>
            <td className="num">{r.correct ?? '–'} / {r.wrong ?? '–'}</td>
            <td className="num"><b>{Number(r.score)}</b><span className="muted">/{Number(r.max)}</span></td>
            <td><span className={`pill ${r.status === 'verified' ? 'open' : r.status === 'rejected' ? 'closed' : 'upcoming'}`}>{STATUS_LABEL[r.status]}</span>{r.by_admin && <div className="muted">அலுவலகம் உள்ளிட்டது</div>}{r.note && <div className="muted">{r.note}</div>}</td>
            <td className="muted">{dmyT(r.created_at)}</td>
            <td className="offact">
              <Form action="/api/admin/offline" submit={r.status === 'verified' ? 'திருத்து' : '✔ சரி'} className="inline-form">
                <input type="hidden" name="action" value="verify" /><input type="hidden" name="id" value={r.id} />
                <input name="correct" type="number" min={0} step={1} defaultValue={r.correct ?? ''} aria-label="சரி" title="சரி" placeholder="சரி" />
                <input name="wrong" type="number" min={0} step={1} defaultValue={r.wrong ?? ''} aria-label="தவறு" title="தவறு" placeholder="தவறு" />
              </Form>
              {r.status !== 'rejected' && <Form action="/api/admin/offline" submit="✖ நிராகரி" className="inline-form">
                <input type="hidden" name="action" value="reject" /><input type="hidden" name="id" value={r.id} />
                <input name="note" placeholder="காரணம் (விருப்பம்)" aria-label="காரணம்" />
              </Form>}
              <Form action="/api/admin/offline" submit="🗑" confirm="இப்பதிவை நீக்கவா? (மாணவர் இணையவழியில் எழுதலாம்)" className="inline-form">
                <input type="hidden" name="action" value="delete" /><input type="hidden" name="id" value={r.id} />
              </Form>
            </td>
          </tr>))}</tbody>
      </table></div>}
      {list.length === 0 && <p className="muted small">இந்த வடிகட்டலில் பதிவுகள் இல்லை.</p>}

      {test && <details style={{ marginTop: 12 }}>
        <summary><b>➕ அலுவலகமே விவரத்தை உள்ளிட / Add a paper result</b></summary>
        <Form action="/api/admin/offline" submit="சேர் (உடனே தரவரிசையில்)">
          <input type="hidden" name="action" value="add" /><input type="hidden" name="test_id" value={test.id} />
          <div className="grid3">
            <div><label>பதிவு எண் / கைபேசி எண்</label><input name="reg_no" required placeholder="MYD2026000001" /></div>
            <div><label>சரியான விடைகள்</label><input name="correct" type="number" min={0} step={1} required /></div>
            <div><label>தவறான விடைகள்</label><input name="wrong" type="number" min={0} step={1} required /></div>
          </div>
        </Form>
      </details>}
      <p className="small muted" style={{ marginBottom: 0 }}>மயிலாடுதுறை, திருவாரூர் மாணவர்கள் வகுப்புத் தேர்வைத் தொடங்கும் முன் "அலுவலகத்தில் நேரடியாக எழுதினேன்" என்று தேர்வு செய்து சரி, தவறு விடைகளின் எண்ணிக்கையை உள்ளிடுவர் (நேரம் = தேர்வுக்கான முழு நேரம்); மதிப்பெண் தேர்வின் மதிப்பீட்டு முறைப்படி தானாகக் கணக்கிடப்படும். உள்ளிட்டவுடன் <b>நேரடியாகத் தரவரிசை</b>, Leaderboard, அறிக்கைகளில் சேரும். தேவைப்பட்டால் இங்கே எண்ணிக்கையைத் திருத்தலாம் ("திருத்து"), நிராகரிக்கலாம் அல்லது நீக்கலாம். நிராகரித்தால் மாணவர் மீண்டும் உள்ளிடலாம் அல்லது இணையவழியில் எழுதலாம்.</p>
    </div>
  );
}
