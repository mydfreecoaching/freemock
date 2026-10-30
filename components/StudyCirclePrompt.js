'use client';
import { useState } from 'react';
import StudyCircleFields from './StudyCircleFields';
import Form from './Form';

/** After login: class students fill the Study Circle registration details once (until saved). */
export default function StudyCirclePrompt({ v, signUrl = '', signRequired = true }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>🏫 பயிற்சி வட்டப் பதிவு / Study Circle registration</h2>
        <p className="small" style={{ marginTop: 0 }}>பயிற்சி வகுப்பில் உங்கள் பதிவை நிறைவு செய்ய கீழ்க்காணும் விவரங்களைப் பதிவு செய்யவும்.</p>
        <Form action="/api/study-circle" submit="சேமி / Save" onDone={() => setShow(false)}>
          <StudyCircleFields v={v} signUrl={signUrl} signRequired={signRequired} />
        </Form>
      </div>
    </div>
  );
}
