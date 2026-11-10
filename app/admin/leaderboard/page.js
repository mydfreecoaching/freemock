import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { getExams } from '@/lib/exams';
import { lbRaw, computeView, publicRows, lbSettings, adminExtras } from '@/lib/lb';
import LeaderboardPro from '@/components/LeaderboardPro';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

/** Admin: full leaderboard (names, all students, district-wise, improving / declining, export) + visibility & privacy settings. */
export default async function AdminLeaderboard({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const [exams, settings] = await Promise.all([getExams(true), lbSettings()]);
  const raws = await Promise.all(exams.map((e) => lbRaw(e.code)));
  const withData = exams.filter((e, i) => raws[i].atts.length);
  const ex = withData.find((e) => e.code === sp?.e) || withData[0];
  let initial = null;
  if (ex) {
    const raw = raws[exams.indexOf(ex)];
    const v = computeView(raw, { mode: 'overall' }, settings);
    initial = { exam: ex.code, mode: v.mode, sel: v.sel, options: v.options, participants: v.participants, hasPrev: v.hasPrev, minTests: settings.minTests,
      display: 'admin', rows: publicRows(v.rows, { admin: true, settings }), me: null, extras: adminExtras(v, raw), at: Date.now() };
  }
  const radio = (name, val, cur, label) => <label className="choice"><input type="radio" name={name} value={val} defaultChecked={cur === val} /> {label}</label>;
  return (
    <>
      <div className="card">
        <h1 style={{ margin: 0 }}>🏅 தரவரிசை மேலாண்மை / Leaderboard</h1>
        <p className="small muted" style={{ marginBottom: 0 }}>அனைத்து மாணவர்களின் பெயருடன் தரவரிசை. தேதி / வாரம் / மாதம் / பாடம் / தேர்வு வாரியாக வடிகட்டலாம்; முதல் 10 / 25 / 50 / அனைவரும்; Excel ஏற்றுமதி. மாணவர்கள் பார்ப்பது: <a href="/leaderboard" target="_blank" rel="noopener">பொதுத் தரவரிசைப் பக்கம்</a> (admin-ஆக இருக்கும்போது இங்கேயே திரும்பும்).</p>
      </div>
      {initial ? <LeaderboardPro admin exams={withData.map((e) => ({ code: e.code, name: e.name }))} initial={initial} /> : <div className="card muted">இன்னும் முடிவுகள் இல்லை.</div>}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>⚙️ காட்சி & தனியுரிமை அமைப்புகள் / Visibility & privacy</h2>
        <Form action="/api/admin/leaderboard" submit="சேமி / Save">
          <label>மாணவர்கள் பார்க்கும் தரவரிசையில் காட்ட வேண்டியது</label>
          <div className="choices">
            {radio('display', 'reg', settings.display, 'முழுப் பதிவு எண் + மாவட்டம் (தற்போதைய முறை)')}
            {radio('display', 'masked', settings.display, 'மறைத்த பதிவு எண் (MYD•••••0115) + மாவட்டம்')}
            {radio('display', 'name', settings.display, 'பெயர் (முதல் பெயர் + தலைப்பெழுத்து) + மறைத்த பதிவு எண்')}
          </div>
          <p className="small muted">மாணவர் தன் சொந்த வரிசையில் மட்டும் முழு விவரத்தைப் பார்ப்பார். கைபேசி எண், பிறந்த தேதி எப்போதும் காட்டப்படாது.</p>
          <label>உள்நுழையாதவர்கள் (பொது) தரவரிசையைப் பார்க்கலாமா?</label>
          <div className="choices">{radio('guests', 'yes', settings.guests ? 'yes' : 'no', 'ஆம் – அனைவரும்')}{radio('guests', 'no', settings.guests ? 'yes' : 'no', 'இல்லை – பதிவு செய்த மாணவர்கள் மட்டும்')}</div>
          <label>சராசரி நேரம் காட்டலாமா?</label>
          <div className="choices">{radio('showTime', 'yes', settings.showTime ? 'yes' : 'no', 'ஆம்')}{radio('showTime', 'no', settings.showTime ? 'yes' : 'no', 'இல்லை')}</div>
          <label>ஒட்டுமொத்தம் / பாட வாரியாக / மாதாந்திரத் தரவரிசையில் இடம்பெறக் குறைந்தபட்சத் தேர்வுகள்</label>
          <input name="minTests" type="number" min={1} max={20} defaultValue={settings.minTests} style={{ maxWidth: 120 }} />
          <p className="small muted">எ.கா. 3 என்றால் ஒரே ஒரு தேர்வில் அதிக மதிப்பெண் பெற்றவர் ஒட்டுமொத்த முதலிடத்தைப் பெற முடியாது.</p>
        </Form>
      </div>

      {ex && <div className="card">
        <h2 style={{ marginTop: 0 }}>🔄 மறு கணக்கீடு / Recalculate</h2>
        <p className="small muted">தரவரிசை ஒவ்வொரு முறையும் தரவுத்தளத்திலிருந்து நேரடியாகக் கணக்கிடப்படுகிறது; மாணவர் சமர்ப்பித்ததும் 30 விநாடிக்குள் தெரியும். விடைக்குறிப்பைத் திருத்தியிருந்தால் "மீண்டும் மதிப்பிடு" பயன்படுத்தவும்.</p>
        <div className="row">
          <Form action="/api/admin/leaderboard" submit="இப்போதே புதுப்பி / Refresh now"><input type="hidden" name="action" value="refresh" /></Form>
          {withData.map((e) => <Form key={e.code} action="/api/admin/leaderboard" submit={`${e.name} – மீண்டும் மதிப்பிடு`} confirm={`${e.name} – அனைத்து விடைத்தாள்களையும் தற்போதைய விடைக்குறிப்பின்படி மீண்டும் மதிப்பிடவா?`}>
            <input type="hidden" name="action" value="recalc" /><input type="hidden" name="exam" value={e.code} /></Form>)}
        </div>
      </div>}
    </>
  );
}
