'use client';
import { useState } from 'react';
import { CLASS_SOURCES } from '@/lib/classSource';

/** "How did you come to know about these free coaching classes?" (multi-select). */
export default function ClassSourceFields({ value = [], other = '' }) {
  const [v, setV] = useState(value || []);
  const toggle = (k) => setV((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]));
  return (
    <div className="g4q">
      <label>📣 இந்தப் பயிற்சி வகுப்புகள் பற்றி உங்களுக்கு எவ்வாறு தெரிய வந்தது? / How did you hear about these classes? <span className="req">*</span></label>
      <p className="small muted" style={{ margin: '0 0 4px' }}>ஒன்றுக்கு மேல் தேர்வு செய்யலாம்.</p>
      <div className="src-list">
        {CLASS_SOURCES.map(([k, l]) => (
          <label key={k} className={`choice ${v.includes(k) ? 'on' : ''}`}><input type="checkbox" name="class_source" value={k} checked={v.includes(k)} onChange={() => toggle(k)} /> {l}</label>
        ))}
      </div>
      {v.includes('OTHER') && <input name="class_source_other" required maxLength={200} defaultValue={other} placeholder="எவ்வாறு தெரிய வந்தது? / Please specify" />}
    </div>
  );
}
