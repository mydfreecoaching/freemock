import Form from './Form';
import { WEEKDAYS, CATEGORIES } from '@/lib/util';

/** Add / edit a coaching class. `c` = existing class or undefined. */
export default function ClassForm({ c }) {
  const days = (c?.days || []).map(Number);
  return (
    <Form action="/api/admin/classes" submit={c ? 'சேமி' : 'வகுப்பைச் சேர்'}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <label>வகுப்பின் பெயர் <span className="req">*</span></label>
      <input name="title" required maxLength={200} defaultValue={c?.title || ''} placeholder="எ.கா. TNPSC தொகுதி 2/2A பயிற்சி வகுப்பு" />
      <label>நடைபெறும் இடம் <span className="req">*</span></label>
      <input name="venue" required maxLength={300} defaultValue={c?.venue || ''} placeholder="எ.கா. மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை" />
      <div className="grid2">
        <div><label>திட்டம் (இருந்தால்)</label><input name="scheme" maxLength={200} defaultValue={c?.scheme || ''} placeholder="எ.கா. பல்கலைக்கழகப் பயிற்சி வகுப்புகள் திட்டம்" /></div>
        <div><label>தேர்வு</label><select name="category" defaultValue={c?.category || 'TNPSC_G2'}>
          <option value="">–</option>{CATEGORIES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
      </div>
      <label>நாட்கள் <span className="req">*</span></label>
      <div className="choices">
        {WEEKDAYS.map((d, i) => <label key={i} className="choice"><input type="checkbox" name="days" value={i} defaultChecked={days.includes(i)} /> {d}</label>)}
      </div>
      <div className="grid2">
        <div><label>தொடக்க நேரம்</label><input type="time" name="start_time" defaultValue={c?.start_time || ''} /></div>
        <div><label>முடிவு நேரம்</label><input type="time" name="end_time" defaultValue={c?.end_time || ''} /></div>
      </div>
      <label>குறிப்பு (மாணவர்களுக்குத் தெரியும்)</label>
      <textarea name="note" rows={2} maxLength={1000} defaultValue={c?.note || ''} placeholder="எ.கா. தினசரி 20 வினாக்கள் கொண்ட மாதிரித் தேர்வு" />
      <div className="grid2">
        <div><label>வரிசை எண்</label><input type="number" name="sort" defaultValue={c?.sort ?? 0} /></div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}><label className="choice"><input type="checkbox" name="active" defaultChecked={c ? !!c.active : true} /> மாணவர்களுக்குக் காட்டு</label></div>
      </div>
    </Form>
  );
}
