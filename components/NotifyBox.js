import Form from './Form';

/** Admin test page: email students about this test (new test / results). */
export default function NotifyBox({ id, ready, closed, published, counts, log, today, limit }) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>📧 மின்னஞ்சல் அறிவிப்பு / Email notification</h2>
      {!ready ? <p className="small err">மின்னஞ்சல் அனுப்பும் வசதி இன்னும் அமைக்கப்படவில்லை. Vercel-இல் MAIL_USER (Gmail முகவரி), MAIL_PASS (Gmail App Password) சேர்க்கவும்.</p> : <>
        <p className="small">மின்னஞ்சல் உள்ளவர்கள்: <b>{counts.all}</b> · Google சரிபார்த்தவர்கள்: <b>{counts.verified}</b> · இன்று அனுப்பியவை: <b>{today}</b> / {limit}</p>
        {!published ? <p className="small muted">தேர்வை வெளியிட்ட பின் அறிவிப்பு அனுப்பலாம்.</p> : (
          <Form action="/api/admin/notify" submit="📧 அனுப்பு / Send" confirm="மாணவர்களுக்கு மின்னஞ்சல் அனுப்பவா?">
            <input type="hidden" name="testId" value={id} />
            <div className="choices">
              <label className="choice"><input type="radio" name="kind" value="new" defaultChecked={!closed} required /> புதிய தேர்வு அறிவிப்பு</label>
              <label className="choice"><input type="radio" name="kind" value="result" defaultChecked={closed} disabled={!closed} /> முடிவுகள் வெளியீடு {closed ? '' : '(தேர்வு நிறைவடைந்த பின்)'}</label>
            </div>
            <div className="choices">
              <label className="choice"><input type="radio" name="to" value="all" defaultChecked /> மின்னஞ்சல் உள்ள அனைவருக்கும் ({counts.all})</label>
              <label className="choice"><input type="radio" name="to" value="verified" /> Google சரிபார்த்தவர்களுக்கு மட்டும் ({counts.verified})</label>
            </div>
          </Form>
        )}
      </>}
      {log.length > 0 && <div className="small muted" style={{ marginTop: 8 }}>அனுப்பியவை: {log.map((l) => `${l.at} – ${l.kind === 'new' ? 'புதிய தேர்வு' : 'முடிவுகள்'} – ${l.error ? '✘ ' + l.error : l.recipients + ' பேர்'}`).join(' · ')}</div>}
    </div>
  );
}
