import Form from './Form';
import { DAY_NAMES } from '@/lib/coaching';

const ORDER = [1, 2, 3, 4, 5, 6, 0];
/** Admin: create / edit a coaching course (name, place, days, allowed time slots, dates). */
export default function CourseForm({ c = null, places = [] }) {
  const slots = [...(c?.slots || []), ...Array(Math.max(0, 6 - (c?.slots?.length || 0))).fill({ from: '', to: '' })];
  const iso = (d) => (d ? new Date(new Date(d).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10) : '');
  return (
    <Form action="/api/admin/coaching" submit={c ? 'மாற்றங்களைச் சேமி' : 'பயிற்சி வகுப்பைச் சேர்'}>
      <input type="hidden" name="action" value="save" />
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid2">
        <div><label>பயிற்சி வகுப்பின் பெயர் <span className="req">*</span></label><input name="name" required maxLength={120} defaultValue={c?.name || ''} placeholder="எ.கா. TNPSC Group 4 – வார இறுதி வகுப்பு" /></div>
        <div><label>மாவட்டம்</label><select name="district" defaultValue={c?.district || 'MYD'}><option value="MYD">மயிலாடுதுறை</option><option value="TVR">திருவாரூர்</option></select></div>
      </div>
      <label>நடைபெறும் இடம் <span className="req">*</span></label>
      <input name="place" required maxLength={200} list={`places-${c?.id || 'new'}`} defaultValue={c?.place || ''} placeholder="எ.கா. மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை" />
      <datalist id={`places-${c?.id || 'new'}`}>{places.map((p) => <option key={p} value={p} />)}</datalist>
      <label>வகுப்பு நடைபெறும் நாட்கள் <span className="req">*</span></label>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {ORDER.map((d) => <label key={d} className="choice"><input type="checkbox" name="days" value={d} defaultChecked={c?.days?.includes(d)} /> {DAY_NAMES[d]}</label>)}
      </div>
      <label>வகுப்பு நேரங்கள் (பயிற்றுநர்கள் இவற்றில் ஒன்றைத் தேர்வு செய்வர்) <span className="req">*</span></label>
      <div className="slot-grid">
        {slots.map((s, i) => (
          <div key={i} className="row" style={{ gap: 6, alignItems: 'center' }}>
            <span className="small muted">{i + 1}.</span>
            <input type="time" name="slot_from" defaultValue={s.from} step={900} />
            <span>–</span>
            <input type="time" name="slot_to" defaultValue={s.to} step={900} />
          </div>
        ))}
      </div>
      <p className="small muted" style={{ margin: '2px 0 6px' }}>எ.கா. 10:00–13:00, 10:30–13:30, 14:00–17:00, 14:30–17:30. ஒன்றோடொன்று மேற்பொருந்தும் நேரங்களில் (எ.கா. 10:00–13:00 & 10:30–13:30) ஒரு நாளில் ஒருவர் மட்டுமே பதிவிட முடியும்.</p>
      <div className="grid2">
        <div><label>தொடங்கும் தேதி <span className="req">*</span></label><input type="date" name="start_date" required defaultValue={iso(c?.start_date)} /></div>
        <div><label>முடியும் தேதி (தெரிந்தால்)</label><input type="date" name="end_date" defaultValue={iso(c?.end_date)} /></div>
      </div>
      <label>குறிப்பு</label><input name="note" maxLength={500} defaultValue={c?.note || ''} />
    </Form>
  );
}
