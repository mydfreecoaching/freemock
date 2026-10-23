import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { isAdmin } from '@/lib/auth';
import { ATT_DISTRICTS, attVenues } from '@/lib/attendance';
import { venueToken } from '@/lib/attQr';
import PrintButton from '@/components/PrintButton';
export const dynamic = 'force-dynamic';

/** Printable QR posters – one A4 page per coaching venue of the district. */
export default async function AttQr({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin');
  const sp = (await searchParams) || {};
  const d = ATT_DISTRICTS.some(([c]) => c === sp.d) ? sp.d : 'TVR';
  const host = (await headers()).get('host') || 'tnpscfreemock.vercel.app';
  const base = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`;
  const posters = await Promise.all(attVenues(d).map(async (v) => {
    const url = `${base}/att/${venueToken(v.code)}`;
    return { ...v, url, svg: await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }) };
  }));
  return (
    <>
      <div className="card noprint row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>🖨️ வருகை QR – {ATT_DISTRICTS.find(([c]) => c === d)[1]}</h1>
          <div className="small muted">ஒவ்வொரு இடத்துக்கும் ஒரு பக்கம். அச்சிட்டு வகுப்பறை வாசலில் ஒட்டவும். QR படத்தை WhatsApp-இல் பகிர வேண்டாம்.</div></div>
        <div className="row">{ATT_DISTRICTS.map(([c, t]) => <a key={c} className={`btn ${c === d ? '' : 'alt'}`} href={`/admin/attendance/qr?d=${c}`}>{t.split(' / ')[0]}</a>)}<PrintButton label="🖨️ அச்சிடு / PDF" /><a className="btn alt" href="/admin/attendance">← வருகை</a></div>
      </div>
      {posters.map((p) => (
        <div key={p.code} className="card qr-poster">
          <div className="qp-1">இலவச இணையவழி மாதிரி தேர்வுகள் – பயிற்சி வகுப்பு வருகை</div>
          <h2>{p.title}</h2>
          <div className="qp-days">📅 {p.days}</div>
          <div className="qp-code" dangerouslySetInnerHTML={{ __html: p.svg }} />
          <ol className="qp-steps">
            <li>கைபேசி கேமராவில் இந்த QR-ஐ ஸ்கேன் செய்யவும் / Scan with your phone camera</li>
            <li>உள்நுழையவும் (பதிவு எண் + பிறந்த தேதி) / Log in</li>
            <li>வந்ததும் <b>IN</b> · கிளம்பும்போது மீண்டும் ஸ்கேன் செய்து <b>OUT</b></li>
          </ol>
          <div className="qp-url small">{p.url}</div>
        </div>
      ))}
    </>
  );
}
