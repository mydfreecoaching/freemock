'use client';
import { useState } from 'react';
import ClassSourceFields from './ClassSourceFields';
import Form from './Form';

/** After login: class students registered before this question was added are asked once (until saved). */
export default function ClassSourcePrompt({ venue }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>🏫 இலவசப் பயிற்சி வகுப்புகள்</h2>
        <p className="small" style={{ marginTop: 0 }}>நீங்கள் பயிற்சி வகுப்பில் சேர்ந்துள்ளீர்கள்: <b>{venue}</b>.</p>
        <Form action="/api/classsource" submit="சேமி / Save" onDone={() => setShow(false)}>
          <ClassSourceFields />
        </Form>
      </div>
    </div>
  );
}
