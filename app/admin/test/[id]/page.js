import { redirect } from 'next/navigation';
import NotifyBox from '@/components/NotifyBox';
import { mailReady, sentToday, DAILY_LIMIT } from '@/lib/mail';
import { headers } from 'next/headers';
import CopyButton from '@/components/CopyButton';
import { fmt, testStatus } from '@/lib/util';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { ranking, mmss } from '@/lib/rank';
import Form from '@/components/Form';
import TestForm from '@/components/TestForm';
import { getExams } from '@/lib/exams';
import QText from '@/components/QText';
export const dynamic = 'force-dynamic';

export default async function AdminTest({ params, searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const id = Number((await params).id);
  const sp = await searchParams;
  const [t] = await sql`SELECT * FROM tests WHERE id=${id}`;
  if (!t) redirect('/admin');
  const qs = await sql`SELECT * FROM questions WHERE test_id=${id} ORDER BY qno`;
  const rows = await ranking(id);
  const [{ live }] = await sql`SELECT count(*)::int live FROM attempts WHERE test_id=${id} AND submitted_at IS NULL`;
  const by = qs.reduce((m, q) => ((m[q.section] = (m[q.section] || 0) + 1), m), {});
  const keyStr = qs.map((q) => q.answer).join('');
  // item analysis
  const pct = qs.map((q) => {
    const c = rows.filter((r) => r.answers?.[q.qno] === q.answer).length;
    return { qno: q.qno, p: rows.length ? Math.round((c / rows.length) * 100) : null };
  });
  const hardest = pct.filter((x) => x.p != null).sort((a, b) => a.p - b.p).slice(0, 15);
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>{t.title}</h1>
        <div className="row"><a className="btn alt" href={`/admin?e=${t.kind}`}>← Admin</a><a className="btn" href={`/analysis/${id}`}>விரிவான பகுப்பாய்வு</a><a className="btn alt" href={`/rank/${id}`}>தரவரிசை</a><a className="btn" href={`/admin/test/${id}/ranklist`}>📄 தரவரிசை PDF</a></div>
      </div>
      <ShareBox t={t} id={id} host={(await headers()).get('host')} />
      <NotifyBox id={id} ready={mailReady()} closed={testStatus(t) === 'closed'} published={t.published}
        counts={(await sql`SELECT count(DISTINCT lower(email)) FILTER (WHERE email ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' AND NOT email_opt_out)::int "all", count(DISTINCT lower(email)) FILTER (WHERE email_verified AND NOT email_opt_out)::int verified FROM students`)[0]}
        log={(await sql`SELECT kind, recipients, error, to_char(created_at AT TIME ZONE 'Asia/Kolkata','DD.MM HH24:MI') at FROM email_log WHERE test_id=${id} ORDER BY id DESC LIMIT 5`)}
        today={mailReady() ? await sentToday() : 0} limit={DAILY_LIMIT} />
      <div className="grid2">
        <div className="card"><h2>அமைப்புகள்</h2><TestForm t={t} exams={await getExams(true)} /></div>
        <div className="card">
          <h2>வினாக்கள் பதிவேற்றம்</h2>
          <p className="small">தற்போது: <b>{qs.length}</b> வினாக்கள் {Object.entries(by).map(([k, v]) => `· ${k} ${v} `)}</p>
          {!t.syllabus && <div className="err">படி 1: இடப்புறம் பாடத்திட்டத்தை (Syllabus) உள்ளிட்டுச் சேமிக்கவும். படி 2: பிறகு வினாக்களைப் பதிவேற்றவும்.</div>}
          <Form action="/api/admin/upload" submit="பதிவேற்று" confirm={rows.length ? 'ஏற்கனவே விடைத்தாள்கள் உள்ளன. வினாக்களை மாற்றவா?' : undefined}>
            <input type="hidden" name="test_id" value={id} />
            <label>Excel (.xlsx) அல்லது JSON கோப்பு</label>
            <input type="file" name="file" accept=".xlsx,.json" required />
          </Form>
          <p className="small"><a href={`/api/admin/template?test=${id}`}>தற்போதைய வினாக்களை Excel-ஆகப் பதிவிறக்கு</a> · <a href={`/admin/test/${id}?preview=1`}>வினாக்களை முன்னோட்டம் பார்</a></p>
          <h3 style={{ marginTop: 16 }}>விடைக்குறிப்பு திருத்தம் & மறுமதிப்பீடு</h3>
          <div className="small" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{keyStr.replace(/(.{10})/g, '$1 ')}</div>
          <Form action="/api/admin/key" submit="மாற்றி மறுமதிப்பீடு செய்">
            <input type="hidden" name="test_id" value={id} />
            <label>மாற்றங்கள் (எ.கா. 124=A, 198=D) – காலியாக விட்டால் மறுமதிப்பீடு மட்டும்</label>
            <input name="changes" placeholder="124=A, 198=D" />
          </Form>
        </div>
      </div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>முடிவுகள் – சமர்ப்பித்தவை {rows.length} · எழுதிக்கொண்டிருப்போர் {live}</h2>
          <a className="btn alt" href={`/api/admin/export?test=${id}`}>CSV பதிவிறக்கு</a>
        </div>
        <div className="tablewrap" style={{ marginTop: 10, maxHeight: 520, overflow: 'auto' }}><table>
          <thead><tr><th>தரம்</th><th>மா.தரம்</th><th>பதிவு எண்</th><th>பெயர்</th><th>மாவட்டம்</th><th>மதிப்பெண்</th><th>சரி</th><th>தவறு</th><th>E</th><th>விடுபட்டவை</th><th>நேரம்</th><th>Tab மாற்றம்</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{r.rank}</td><td>{r.drank}</td><td>{r.reg_no}</td><td>{r.name}</td><td>{r.district}</td><td><b>{r.score}</b></td><td>{r.correct}</td><td>{r.wrong}</td><td>{r.e_count}</td><td>{r.unanswered}</td><td>{mmss(r.secs)}</td><td style={r.tab_switches > 5 ? { color: 'var(--bad)', fontWeight: 700 } : undefined}>{r.tab_switches}</td></tr>
          ))}</tbody>
        </table></div>
        {hardest.length > 0 && <p className="small" style={{ marginTop: 10 }}><b>அதிகம் தவறிய வினாக்கள் (சரியான %):</b> {hardest.map((h) => `${h.qno} (${h.p}%)`).join(', ')}</p>}
      </div>
      <div className="grid2">
        <div className="card">
          <h2>விடைத்தாளை நீக்கு (மீண்டும் எழுத அனுமதி)</h2>
          <Form action="/api/admin/reset" submit="நீக்கு" confirm="இந்தத் தேர்வரின் விடைகள் நீக்கப்படும். உறுதியா?">
            <input type="hidden" name="test_id" value={id} />
            <label>பதிவு எண்</label><input name="reg_no" required placeholder="MYD2026000001" />
          </Form>
        </div>
        <div className="card">
          <h2>தேர்வை நீக்கு</h2>
          <Form action="/api/admin/delete" submit="நிரந்தரமாக நீக்கு">
            <input type="hidden" name="test_id" value={id} />
            <label>உறுதிப்படுத்த DELETE என்று தட்டச்சு செய்யவும்</label><input name="confirm" />
          </Form>
        </div>
      </div>
      {sp?.preview && (
        <div className="card review">
          <h2>முன்னோட்டம்</h2>
          {qs.map((q) => (
            <div key={q.qno} className="qcard" style={{ marginBottom: 10 }}>
              <span className="qno">{q.qno}</span> <span className="pill">{q.section}</span> <span className="pill open">விடை {q.answer}</span>
              {q.en_q && <div className="lang"><QText text={q.en_q} /></div>}
              {q.en_opts.some(Boolean) && <ol type="A" className="small">{q.en_opts.map((o, k) => <li key={k}>{o}</li>)}</ol>}
              {q.ta_q && <div className="lang"><QText text={q.ta_q} /></div>}
              {q.ta_opts.some(Boolean) && <ol type="A" className="small">{q.ta_opts.map((o, k) => <li key={k}>{o}</li>)}</ol>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** Direct link for students: after login they land on this test. */
function ShareBox({ t, id, host }) {
  const proto = host?.startsWith('localhost') ? 'http' : 'https';
  const url = `${proto}://${host}/test/${id}`;
  const msg = `*${t.title}*\n${fmt(t.start_at)} முதல் ${fmt(t.end_at)} வரை எழுதலாம்.\nஉள்நுழைந்து நேரடியாக இத்தேர்வை எழுத: ${url}\n(புதியவர்கள் இதே link-இல் பதிவு செய்யலாம்)`;
  return (
    <div className="card">
      <h2 style={{ marginBottom: 6 }}>🔗 தேர்வு Link – மாணவர்களுக்குப் பகிர</h2>
      {!t.published && <p className="err small">இத்தேர்வு இன்னும் Published ஆகவில்லை – Publish செய்த பிறகே மாணவர்கள் திறக்க முடியும்.</p>}
      <div className="row"><input readOnly value={url} style={{ flex: 1, minWidth: 220 }} /><CopyButton text={url} label="Link நகலெடு" /><CopyButton text={msg} label="WhatsApp செய்தி நகலெடு" />
        <a className="btn alt" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener">WhatsApp-இல் பகிர்</a></div>
      <p className="small muted" style={{ marginBottom: 0 }}>மாணவர் இந்த link-ஐத் திறந்தால்: உள்நுழையவில்லை எனில் login பக்கம் → உள்நுழைந்ததும் நேரடியாக இத்தேர்வு. புதியவர் பதிவு செய்ததும் நேரடியாக இத்தேர்வு.</p>
    </div>
  );
}
