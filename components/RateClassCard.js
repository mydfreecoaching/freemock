import Form from './Form';
import { CLARITY, t12, dmy } from '@/lib/coaching';

const STARS = ['', 'மோசம்', 'சுமார்', 'நன்று', 'மிக நன்று', 'சிறப்பு'];
/** Dashboard: rate the classes the student attended (one form per faculty session). */
export default function RateClassCard({ sessions }) {
  if (!sessions.length) return null;
  return (
    <div className="card rate-card">
      <h2 style={{ marginTop: 0 }}>🗣️ நீங்கள் கலந்துகொண்ட வகுப்புகள் – பயிற்றுநர் பற்றிய உங்கள் கருத்து</h2>
      <p className="small muted" style={{ marginTop: 0 }}>உங்கள் கருத்து Admin-க்கு மட்டுமே தெரியும்; பயிற்றுநருக்குத் தெரியாது.</p>
      {sessions.map((s) => (
        <details key={s.id} className="sc-edu" open={sessions.length === 1}>
          <summary><b>{s.faculty}</b> – {s.subject} <span className="small muted">· {dmy(s.d)}, {t12(s.t_from)} – {t12(s.t_to)}</span></summary>
          {s.topic && <div className="small muted" style={{ margin: '4px 0' }}>பாடப்பகுதி: {s.topic}</div>}
          <Form action="/api/session-rating" submit="கருத்தை அனுப்பு">
            <input type="hidden" name="session" value={s.id} />
            <fieldset className="cfq"><legend>நடத்திய பாடம் புரியும்படி இருந்ததா? <span className="req">*</span></legend>
              <div className="cf-rate">{[5, 4, 3, 2, 1].map((n) => <label key={n}><input type="radio" name="clarity" value={n} required /><small>{CLARITY[n]}</small></label>)}</div></fieldset>
            <fieldset className="cfq"><legend>பயிற்றுநர் வகுப்பை நடத்திய விதம் <span className="req">*</span></legend>
              <div className="cf-rate">{[1, 2, 3, 4, 5].map((n) => <label key={n}><input type="radio" name="teaching" value={n} required /><span>{'★'.repeat(n)}</span><small>{STARS[n]}</small></label>)}</div></fieldset>
            <label>கருத்து (விருப்பம்)</label>
            <textarea name="comment" rows={2} maxLength={600} placeholder="எ.கா. உதாரணங்களுடன் தெளிவாக விளக்கினார் / இன்னும் மெதுவாக நடத்தலாம்" />
          </Form>
        </details>
      ))}
    </div>
  );
}
