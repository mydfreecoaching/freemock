'use client';
import { useState } from 'react';
import StudyFields from './StudyFields';
import Form from './Form';

/** After login: students registered before this question was added are asked once (shown until saved). */
export default function StudyPrompt() {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>📚 உங்கள் படிப்பு பற்றி</h2>
        <p className="small" style={{ marginTop: 0 }}>உங்களுக்கு ஏற்ற வழிகாட்டுதல் வழங்க, கீழ்க்காணும் விவரங்களைப் பதிவு செய்யவும் / Please tell us how you prepare.</p>
        <Form action="/api/study" submit="சேமி / Save" onDone={() => setShow(false)}>
          <StudyFields />
        </Form>
      </div>
    </div>
  );
}
