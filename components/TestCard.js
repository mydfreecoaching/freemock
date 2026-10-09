import { fmt, testStatus } from '@/lib/util';

const STATUS = { open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'நிறைவடைந்தது' };
export default function TestCard({ t, a, label }) {
  const st = testStatus(t);
  const max = t.nq * Number(t.marks_per_q);
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{t.title}</h3>
        <span className={`pill ${st}`}>{STATUS[st]}</span>
      </div>
      {label && <div className="small" style={{ color: 'var(--brand2)', fontWeight: 600 }}>{label}</div>}
      <div className="small muted">{fmt(t.start_at)} முதல் {fmt(t.end_at)} வரை · {t.nq} வினாக்கள் · {t.duration_min} நிமிடம்</div>
      {t.syllabus && <details className="syl"><summary>பாடத்திட்டம் / Syllabus</summary><div className="syllabus">{t.syllabus}</div></details>}
      <div className="row" style={{ marginTop: 10 }}>
        {st === 'open' && !a && <a className="btn" href={`/test/${t.id}`}>தேர்வைத் தொடங்கு</a>}
        {st === 'open' && a && !a.submitted_at && <a className="btn" href={`/test/${t.id}`}>தேர்வைத் தொடர்</a>}
        {a?.submitted_at && <span className="okmsg" style={{ margin: 0 }}>மதிப்பெண் {Number(a.score)} / {max}</span>}
        {a?.submitted_at && <a className="btn alt" href={`/result/${t.id}`}>விடைகள் & தவறுகள்</a>}
        {a?.submitted_at && <a className="btn alt" href={`/analysis/${t.id}`}>பகுப்பாய்வு</a>}
        {st === 'closed' && !a && <><a className="btn alt" href={`/analysis/${t.id}`}>தரவரிசை</a><span className="small muted">நீங்கள் எழுதவில்லை.</span></>}
      </div>
    </div>
  );
}
