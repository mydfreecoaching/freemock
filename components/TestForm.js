import Form from './Form';
import { toISTInput } from '@/lib/util';

export default function TestForm({ t }) {
  return (
    <Form action="/api/admin/test" submit={t ? 'சேமி' : 'தேர்வை உருவாக்கு'}>
      {t && <input type="hidden" name="id" value={t.id} />}
      <label>தலைப்பு</label>
      <input name="title" required defaultValue={t?.title || 'TNPSC GROUP 2/2A – FREE FULL MOCK TEST '} />
      <div className="grid2">
        <div><label>தொடக்கம் (IST)</label><input type="datetime-local" name="start_at" required defaultValue={t ? toISTInput(t.start_at) : ''} /></div>
        <div><label>முடிவு (IST) – இதற்குப் பின் யாரும் எழுத இயலாது</label><input type="datetime-local" name="end_at" required defaultValue={t ? toISTInput(t.end_at) : ''} /></div>
      </div>
      <div className="grid2">
        <div><label>கால அளவு (நிமிடம்)</label><input type="number" name="duration_min" min="1" defaultValue={t?.duration_min ?? 180} /></div>
        <div><label>ஒரு வினாவுக்கு மதிப்பெண்</label><input type="number" step="0.25" name="marks_per_q" defaultValue={t ? Number(t.marks_per_q) : 1.5} /></div>
      </div>
      <div className="grid2">
        <div><label>விடுபட்டால் குறைப்பு</label><input type="number" step="0.5" min="0" name="unanswered_penalty" defaultValue={t ? Number(t.unanswered_penalty) : 2} /></div>
        <div><label>குறைப்பு முறை</label><select name="penalty_mode" defaultValue={t?.penalty_mode ?? 1}><option value="1">ஒரு முறை மட்டும் (விடுபட்ட வினா இருந்தால்)</option><option value="2">ஒவ்வொரு விடுபட்ட வினாவுக்கும்</option></select></div>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="published" defaultChecked={!!t?.published} style={{ width: 'auto' }} /> தேர்வர்களுக்குக் காட்டு (Published)</label>
    </Form>
  );
}
