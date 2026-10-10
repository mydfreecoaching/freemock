import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmtDate } from '@/lib/util';
import { profileComplete } from '@/lib/profile';
import Form from '@/components/Form';
import StudentFields from '@/components/StudentFields';
import PhotoInput from '@/components/PhotoInput';
import { studentWithPhoto, photoUrl } from '@/lib/photo';
export const dynamic = 'force-dynamic';

export default async function Profile({ searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const me = await studentWithPhoto(sid);
  if (!me) redirect('/api/logout');
  const sp = await searchParams;
  const next = typeof sp?.next === 'string' && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/dashboard';
  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1>என் விவரங்கள் / My Profile</h1>
      {!profileComplete(me) && <div className="err">தேர்வு எழுதும் முன் கீழ்க்காணும் விவரங்களை நிறைவு செய்யவும் (ஒரு முறை மட்டும்).</div>}
      <p className="small muted">{me.name} · பதிவு எண் <b>{me.reg_no}</b> · {me.mobile} · {me.district} · பிறந்த தேதி {fmtDate(me.dob)}<br />
        (பெயர், கைபேசி, பிறந்த தேதி, மாவட்டம் மாற்ற வேண்டுமெனில் WhatsApp-இல் தொடர்பு கொள்ளவும்.)</p>
      <Form action="/api/profile" submit="சேமி / Save">
        <input type="hidden" name="next" value={next} />
        <StudentFields s={me} />
        <PhotoInput current={me.has_photo ? photoUrl(me.id, me.photo_v) : null} />
      </Form>
    </div>
  );
}
