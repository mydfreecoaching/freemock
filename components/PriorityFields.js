'use client';
import { useState } from 'react';
import { PRIORITIES } from '@/lib/util';

/** Priority category — mandatory: one or more categories, or "None" (exclusive). */
export default function PriorityFields({ value = [], other = '' }) {
  const [sel, setSel] = useState(value);
  const toggle = (k, on) => setSel((s) => (k === 'NONE' ? (on ? ['NONE'] : []) : on ? [...s.filter((x) => x !== 'NONE'), k] : s.filter((x) => x !== k)));
  return (
    <>
      <label>முன்னுரிமைப் பிரிவு / Priority <span className="req">*</span></label>
      <p className="small muted" style={{ margin: '0 0 4px' }}>பொருந்தும் பிரிவைத் தேர்வு செய்யவும்; எதுவும் இல்லையெனில் &quot;இல்லை / None&quot; என்பதைத் தேர்வு செய்யவும்.</p>
      <div className="choices">
        {PRIORITIES.map(([k, l]) => (
          <label key={k} className="choice"><input type="checkbox" name="priority" value={k} checked={sel.includes(k)} onChange={(e) => toggle(k, e.target.checked)} required={sel.length === 0 && k === 'NONE'} /> {l}</label>
        ))}
      </div>
      {sel.includes('OTHER') && <input name="priority_other" required maxLength={80} defaultValue={other} placeholder='"பிற" முன்னுரிமையைத் தட்டச்சு செய்யவும் / Specify' />}
    </>
  );
}
