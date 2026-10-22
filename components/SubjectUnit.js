'use client';
import { useState } from 'react';
import { isTamilSubject, TAMIL_UNITS } from '@/lib/util';

/** Subject select; for General Tamil also the unit (அலகு 1–7), shown right below. */
export default function SubjectUnit({ options, value = '', unit = null, required = false, placeholder }) {
  const [sub, setSub] = useState(value || '');
  return <>
    <select name="subject" required={required} value={sub} onChange={(e) => setSub(e.target.value)}>
      <option value="">{placeholder || (required ? 'பாடத்தைத் தேர்வு செய்யவும் / Select a subject' : '— பாடம் இல்லை / No subject —')}</option>
      {options.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
    {isTamilSubject(sub) && <>
      <label>பொதுத்தமிழ் – அலகு / Unit <span className="req">*</span></label>
      <select name="unit" required defaultValue={unit || ''}>
        <option value="" disabled>அலகைத் தேர்வு செய்யவும் / Select unit</option>
        {TAMIL_UNITS.map((u) => <option key={u} value={u}>அலகு {u} / Unit {u}</option>)}
      </select>
    </>}
  </>;
}
