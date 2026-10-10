import Form from './Form';

/** Add / edit an available exam. */
export default function ExamForm({ e }) {
  const chk = (k, d) => (e ? !!e[k] : d);
  return (
    <Form action="/api/admin/exams" submit={e ? 'சேமி' : 'தேர்வைச் சேர்'}>
      {e && <input type="hidden" name="id" value={e.id} />}
      <label>தேர்வின் பெயர் <span className="req">*</span></label>
      <input name="name" required maxLength={150} defaultValue={e?.name || ''} placeholder="எ.கா. TNPSC Group 4 Weekly Test" />
      <label>விளக்கம் / Explanation (மாணவர்களுக்குத் தெரியும்)</label>
      <textarea name="description" rows={3} maxLength={2000} defaultValue={e?.description || ''} placeholder="எ.கா. எந்த வகுப்பு, எத்தனை வினாக்கள், எப்போது நடக்கும்" />
      <label>WhatsApp குழு இணைப்பு (தேர்வு முடிந்ததும் கருத்துப் பக்கத்தில் காட்டப்படும்; காலி = காட்டாது)</label>
      <input name="whatsapp_link" type="url" maxLength={300} defaultValue={e?.whatsapp_link || ''} placeholder="https://chat.whatsapp.com/…" />
      <div className="grid2">
        <div><label>வினாக்கள் (நிலையான எண்ணிக்கை; காலி = எந்த எண்ணிக்கையும்)</label><input type="number" min="1" name="qcount" defaultValue={e?.qcount ?? ''} /></div>
        <div><label>வரிசை எண்</label><input type="number" name="sort" defaultValue={e?.sort ?? 10} /></div>
      </div>
      <div className="grid2">
        <div><label>சரியான விடைக்கு மதிப்பெண்</label><input type="number" step="0.01" name="marks_per_q" defaultValue={e ? Number(e.marks_per_q) : 1.5} /></div>
        <div><label>தவறான விடைக்குக் குறைப்பு</label><input type="number" step="0.01" min="0" name="negative_mark" defaultValue={e ? Number(e.negative_mark) : 0} /></div>
      </div>
      <div className="grid2">
        <div><label>விடுபட்டால் குறைப்பு</label><input type="number" step="0.5" min="0" name="unanswered_penalty" defaultValue={e ? Number(e.unanswered_penalty) : 2} /></div>
        <div className="choices" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <label className="choice"><input type="checkbox" name="allow_e" defaultChecked={chk('allow_e', true)} /> E – "விடை தெரியவில்லை"</label>
        </div>
      </div>
      <div className="choices" style={{ marginTop: 8 }}>
        <label className="choice"><input type="checkbox" name="weekly_analysis" defaultChecked={chk('weekly_analysis', false)} /> வாராந்திரப் பகுப்பாய்வு (தினசரித் தேர்வுகளுக்கு)</label>
        <label className="choice"><input type="checkbox" name="progress" defaultChecked={chk('progress', false)} /> மாணவர் முன்னேற்ற வரைபடம்</label>
        <label className="choice"><input type="checkbox" name="active" defaultChecked={chk('active', true)} /> மாணவர்களுக்குக் காட்டு</label>
      </div>
    </Form>
  );
}
