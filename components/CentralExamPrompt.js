'use client';
import { useState } from 'react';
import CentralExamFields from './CentralExamFields';
import Form from './Form';

/** After login: asked once (until saved) – SSC / IBPS / RRB coaching willingness and applications. */
export default function CentralExamPrompt({ v, district }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>📢 SSC / வங்கி / ரயில்வே தேர்வுகளுக்கு இலவசப் பயிற்சி</h2>
        <Form action="/api/central-exams" submit="சேமி / Save" onDone={() => setShow(false)}>
          <CentralExamFields v={v} district={district} />
        </Form>
      </div>
    </div>
  );
}
