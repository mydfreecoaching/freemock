import Form from '@/components/Form';
import { DISTRICT_LIST } from '@/lib/util';
import { ensureSchema, sql } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { isClassStudent } from '@/lib/access';
import { VENUE_LABEL } from '@/lib/venues';
import ClassFeedbackForm from '@/components/ClassFeedbackForm';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact us – இலவச இணையவழி மாதிரி தேர்வு' };

export default async function Contact() {
  await ensureSchema();
  const sid = await studentId();
  const [me] = sid ? await sql`SELECT name, mobile, district, coaching_venue FROM students WHERE id=${sid}` : [];
  const mine = sid ? await sql`SELECT id, message, reply, replied_at, reply_seen, created_at FROM enquiries WHERE student_id=${sid} ORDER BY created_at DESC LIMIT 20` : [];
  if (mine.some((e) => e.reply && !e.reply_seen)) await sql`UPDATE enquiries SET reply_seen=true WHERE student_id=${sid} AND reply IS NOT NULL AND NOT reply_seen`;
  const cls = isClassStudent(me);
  const myFb = cls ? await sql`SELECT id, created_at, rating, teaching, facility, comment, suggestion, reply, replied_at, reply_seen FROM class_feedback WHERE student_id=${sid} ORDER BY created_at DESC LIMIT 10` : [];
  if (myFb.some((f) => f.reply && !f.reply_seen)) await sql`UPDATE class_feedback SET reply_seen=true WHERE student_id=${sid} AND reply IS NOT NULL AND NOT reply_seen`;
  const districts = DISTRICT_LIST.filter(([ta], i, a) => a.findIndex((x) => x[0] === ta) === i);
  return (
    <>
      <section className="pagehead"><h1>{cls ? 'தொடர்பு / கருத்து – Contact us / Feedback' : 'தொடர்புக்கு / Contact us'}</h1><p>{cls ? 'பயிற்சி வகுப்புகள் பற்றிய உங்கள் கருத்தைக் கீழே பதிவு செய்யவும். பதிவு, தேர்வு தொடர்பான சந்தேகங்களுக்குக் "கோரிக்கை அனுப்ப" படிவத்தைப் பயன்படுத்தவும்.' : 'பதிவு, தேர்வு தொடர்பான சந்தேகங்களுக்குக் கீழே உள்ள படிவம் மூலம் கோரிக்கை அனுப்பவும்.'}</p></section>
      {cls && <ClassFeedbackForm venue={VENUE_LABEL(me.coaching_venue)} />}
      {myFb.length > 0 && (
        <div className="card" id="myfb" style={{ maxWidth: 640, margin: '0 auto 12px' }}>
          <h2 style={{ marginTop: 0 }}>🗂️ நான் அனுப்பிய வகுப்புக் கருத்துகள் / My class feedback</h2>
          {myFb.map((f) => (
            <div key={f.id} className="enq">
              <div className="small muted">{fmt(f.created_at)} · ஒட்டுமொத்தம் {'★'.repeat(f.rating)} · பாடம் {'★'.repeat(f.teaching)} · வசதிகள் {'★'.repeat(f.facility)}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{f.comment}</div>
              {f.suggestion && <div className="small" style={{ whiteSpace: 'pre-wrap' }}><b>ஆலோசனை:</b> {f.suggestion}</div>}
              {f.reply
                ? <div className="enq-reply"><b>💬 பதில் / Reply</b>{!f.reply_seen && <> <span className="pop-new">புதியது</span></>}<div style={{ whiteSpace: 'pre-wrap' }}>{f.reply}</div><div className="small muted">{fmt(f.replied_at)}</div></div>
                : <div className="small muted">⏳ பதிலுக்காகக் காத்திருக்கிறது / Awaiting reply</div>}
            </div>
          ))}
        </div>
      )}
      {mine.length > 0 && (
        <div className="card" id="mine" style={{ maxWidth: 640, margin: '0 auto 12px' }}>
          <h2 style={{ marginTop: 0 }}>📨 என் கோரிக்கைகள் / My enquiries</h2>
          {mine.map((e) => (
            <div key={e.id} className="enq">
              <div className="small muted">{fmt(e.created_at)}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{e.message}</div>
              {e.reply
                ? <div className="enq-reply"><b>💬 பதில் / Reply</b>{!e.reply_seen && <> <span className="pop-new">புதியது</span></>}<div style={{ whiteSpace: 'pre-wrap' }}>{e.reply}</div><div className="small muted">{fmt(e.replied_at)}</div></div>
                : <div className="small muted">⏳ பதிலுக்காகக் காத்திருக்கிறது / Awaiting reply</div>}
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2>✉️ கோரிக்கை அனுப்ப / Send an enquiry</h2>
        {!sid && <p className="small muted" style={{ marginTop: 0 }}>பதில் இணையதளத்திலேயே வேண்டுமென்றால் <a href="/login?next=/contact">உள்நுழைந்து</a> அனுப்பவும்.</p>}
        <Form action="/api/enquiry" submit="அனுப்பு / Send">
          <input name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
          <div className="grid2">
            <div><label>பெயர் / Name <span className="req">*</span></label><input name="name" required maxLength={80} defaultValue={me?.name || ''} /></div>
            <div><label>கைபேசி / Mobile <span className="req">*</span></label><input name="mobile" type="tel" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} defaultValue={me?.mobile || ''} /></div>
          </div>
          <label>மாவட்டம் / District</label>
          <select name="district" defaultValue={me?.district || ''}><option value="">–</option>{districts.map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}</select>
          <label>உங்கள் கோரிக்கை – விவரமாக / Your request in detail <span className="req">*</span></label>
          <textarea name="message" required minLength={10} maxLength={1000} rows={5} placeholder="எ.கா. பதிவு எண் மறந்துவிட்டது / தேர்வு 8-இல் வினா 25-இன் விடை சரியா? / புகைப்படம் பதிவேற்ற இயலவில்லை" />
        </Form>
      </div>
    </>
  );
}
