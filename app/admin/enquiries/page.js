import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

export default async function Enquiries() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const list = await sql`SELECT e.*, s.reg_no FROM enquiries e LEFT JOIN students s ON s.id=e.student_id ORDER BY (e.status='new') DESC, e.created_at DESC LIMIT 300`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>கோரிக்கைகள் / Enquiries</h1><a className="btn alt" href="/admin">← Admin</a></div>
      <p className="small muted">உள்நுழைந்து அனுப்பிய மாணவர்களுக்கு (பதிவு எண் உள்ளவர்கள்) பதில் Contact பக்கத்திலும் அறிவிப்பாகவும் செல்லும். மற்றவர்களுக்கு கைபேசி / WhatsApp மூலம் பதில் அளிக்கவும்.</p>
      {list.length === 0 && <div className="card muted">இல்லை.</div>}
      {list.map((e) => (
        <div key={e.id} className="card enq-admin" style={e.status === 'new' ? { borderLeft: '4px solid var(--brand)' } : { opacity: 0.85 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>{e.name}</b> · <a href={`https://wa.me/91${e.mobile}`}>{e.mobile}</a>{e.district ? ` · ${e.district}` : ''}{e.reg_no ? <span className="pill" style={{ marginLeft: 6 }}>{e.reg_no}</span> : <span className="pill" style={{ marginLeft: 6 }}>உள்நுழையாதவர்</span>}</div>
            <span className="small muted">{fmt(e.created_at)}</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', margin: '6px 0' }}>{e.message || <span className="muted">(விவரம் இல்லை)</span>}</div>
          {e.reply && <div className="enq-reply"><b>💬 அனுப்பிய பதில்</b> <span className="small muted">{fmt(e.replied_at)} · {e.reply_seen ? 'மாணவர் பார்த்தார் ✓' : 'இன்னும் பார்க்கவில்லை'}</span><div style={{ whiteSpace: 'pre-wrap' }}>{e.reply}</div></div>}
          <details open={e.status === 'new'}>
            <summary className="small">{e.reply ? 'பதிலைத் திருத்து' : 'பதில் அளி / Reply'}</summary>
            <Form action="/api/admin/enquiries" submit={e.student_id ? 'பதில் அனுப்பு' : 'பதிலைச் சேமி'}>
              <input type="hidden" name="id" value={e.id} />
              <textarea name="reply" required rows={3} maxLength={2000} defaultValue={e.reply || ''} placeholder="பதில் / Reply" />
            </Form>
            {e.status === 'new' && <Form action="/api/admin/enquiries" submit="பதில் இல்லாமல் முடிந்தது எனக் குறி" className="inline-form"><input type="hidden" name="id" value={e.id} /></Form>}
          </details>
        </div>
      ))}
    </>
  );
}
