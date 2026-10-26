import Form from './Form';

const Q = [['rating', 'வகுப்புகள் ஒட்டுமொத்தமாக / Overall'], ['teaching', 'பாடம் நடத்தும் விதம் / Teaching'], ['facility', 'வகுப்பறை வசதிகள் / Facilities']];
const L = ['', 'மோசம்', 'சுமார்', 'நன்று', 'மிக நன்று', 'சிறப்பு'];

/** Coaching-class feedback form (Contact us / Feedback page). */
export default function ClassFeedbackForm({ venue }) {
  return (
    <div className="card" id="feedback" style={{ maxWidth: 640, margin: '0 auto 12px' }}>
      <h2 style={{ marginTop: 0 }}>🗣️ பயிற்சி வகுப்பு – உங்கள் கருத்து / Class feedback</h2>
      <p className="small muted" style={{ marginTop: 0 }}>மையம்: <b>{venue}</b>. உங்கள் கருத்துகள் வகுப்புகளை மேம்படுத்த உதவும்.</p>
      <Form action="/api/class-feedback" submit="கருத்தை அனுப்பு / Send feedback">
        {Q.map(([k, l]) => (
          <fieldset key={k} className="cfq">
            <legend>{l} <span className="req">*</span></legend>
            <div className="cf-rate">
              {[1, 2, 3, 4, 5].map((n) => <label key={n}><input type="radio" name={k} value={n} required /> <span>{'★'.repeat(n)}</span><small>{L[n]}</small></label>)}
            </div>
          </fieldset>
        ))}
        <label>உங்கள் கருத்து (என்ன பிடித்தது / என்ன குறை) / Your feedback <span className="req">*</span></label>
        <textarea name="comment" required minLength={10} maxLength={1500} rows={4} placeholder="எ.கா. கணிதப் பாடம் தெளிவாக நடத்தப்படுகிறது; ஒலிபெருக்கி சரியாகக் கேட்கவில்லை…" />
        <label>மேம்படுத்த ஆலோசனைகள் / Suggestions</label>
        <textarea name="suggestion" maxLength={1000} rows={3} placeholder="எ.கா. வாரம் ஒரு மாதிரித் தேர்வு, கூடுதல் நடப்பு நிகழ்வுகள் வகுப்பு…" />
      </Form>
    </div>
  );
}
