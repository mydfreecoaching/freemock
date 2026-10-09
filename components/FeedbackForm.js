'use client';
import { useState } from 'react';
import Form from './Form';

const DIFF = [['easy', 'எளிது / Easy'], ['moderate', 'நடுத்தரம் / Moderate'], ['hard', 'கடினம் / Hard']];
/** Star rating + difficulty + comment, shown after submitting a test. */
export default function FeedbackForm({ testId }) {
  const [r, setR] = useState(0);
  return (
    <div className="card fbform" id="feedback">
      <h2 style={{ marginBottom: 4 }}>💬 இத்தேர்வு பற்றிய உங்கள் கருத்து / Your feedback</h2>
      <p className="small muted" style={{ marginTop: 0 }}>கருத்து அளித்த பிறகு விடைகள், தவறுகள், பகுப்பாய்வு காட்டப்படும்.</p>
      <Form action="/api/feedback" submit="கருத்தை அனுப்பு / Submit feedback">
        <input type="hidden" name="testId" value={testId} />
        <input type="hidden" name="rating" value={r || ''} readOnly />
        <label>மதிப்பீடு / Rating <span className="req">*</span></label>
        <div className="stars" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className={n <= r ? 'on' : ''} aria-label={`${n}`} onClick={() => setR(n)}>★</button>)}
          <span className="small muted">{['', 'மோசம்', 'சுமார்', 'நன்று', 'மிக நன்று', 'சிறப்பு'][r]}</span>
        </div>
        <label>கடினத்தன்மை / Difficulty <span className="req">*</span></label>
        <div className="choices">{DIFF.map(([k, l]) => <label key={k} className="choice"><input type="radio" name="difficulty" value={k} required /> {l}</label>)}</div>
        <label>உங்கள் கருத்து / Comment <span className="req">*</span></label>
        <textarea name="comment" required minLength={5} maxLength={600} placeholder="வினாக்களின் தரம், நேரம், பாடத்திட்டம், தளம் பற்றிய உங்கள் கருத்து…" />
      </Form>
    </div>
  );
}
