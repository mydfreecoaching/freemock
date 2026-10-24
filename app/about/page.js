import { ensureSchema } from '@/lib/db';
import { publicStats } from '@/lib/public';
import { studentId } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'About us – இலவச இணையவழி மாதிரி தேர்வு' };

export default async function About() {
  await ensureSchema();
  const S = await publicStats();
  const sid = await studentId();
  return (
    <>
      <section className="pagehead"><h1>எங்களைப் பற்றி / About us</h1><p>போட்டித் தேர்வுகளுக்கான இலவச இணையவழி மாதிரி தேர்வுகள் / Free online mock tests</p></section>
      <div className="grid2">
        <div className="card">
          <h2>இந்த இணையதளம் பற்றி</h2>
          <p>TNPSC போன்ற அரசுப் போட்டித் தேர்வுகளுக்குத் தயாராகும் மாணவர்களுக்காக உருவாக்கப்பட்ட <b>இலவச இணையவழி மாதிரி தேர்வுத் தளம்</b> இது.</p>
          <p>எந்த மாவட்டத்தைச் சேர்ந்த மாணவரும் வீட்டிலிருந்தே கைபேசியில் மாதிரித் தேர்வு எழுதி, உடனடியாக மதிப்பெண், தரவரிசை, பகுப்பாய்வு மூலம் தன் நிலையை அறிந்துகொள்ளலாம். பதிவு முதல் தேர்வு வரை அனைத்தும் முற்றிலும் இலவசம்.</p>
        </div>
        <div className="card">
          <h2>எங்கள் நோக்கம்</h2>
          <ul className="ticks">
            <li>கிராமப்புற, நகர்ப்புற மாணவர்கள் அனைவருக்கும் தரமான மாதிரித் தேர்வுகள் – முற்றிலும் இலவசமாக</li>
            <li>உண்மையான TNPSC தேர்வு அனுபவம் – நேரக் கட்டுப்பாடு, மதிப்பெண் முறை, தரவரிசை</li>
            <li>ஒவ்வொரு தேர்வுக்குப் பின்னும் தவறுகளைத் திருத்திக்கொள்ள விரிவான பகுப்பாய்வு</li>
            <li>தொடர் முன்னேற்றக் கண்காணிப்பு மூலம் பலவீனமான பகுதிகளில் கவனம்</li>
          </ul>
        </div>
      </div>
      <section className="statband">
        <div><b>{S.tests}</b><span>பதிவேற்றப்பட்ட தேர்வுகள்</span></div>
        {!sid && <div><b>{S.writers}</b><span>தேர்வு எழுதியவர்கள்</span></div>}
      </section>
      <div className="card">
        <h2>இந்த இணையதளத்தில் என்னென்ன?</h2>
        <div className="featgrid">
          <div className="feat"><span>📝</span><b>மாதிரித் தேர்வுகள்</b><p className="small muted">தினசரி வகுப்புத் தேர்வுகள், வாராந்திரத் திருப்புதல் தேர்வுகள், முழு மாதிரித் தேர்வுகள்.</p></div>
          <div className="feat"><span>👩‍🏫</span><b>ஆசிரியர் பங்களிப்பு</b><p className="small muted">பயிற்றுநர்கள் வினாத்தாள்களைப் பதிவேற்றுகின்றனர்; சரிபார்த்த பின்பே வெளியிடப்படும்.</p></div>
          <div className="feat"><span>📊</span><b>பகுப்பாய்வு</b><p className="small muted">பகுதி வாரி, வினா வாரி பகுப்பாய்வு, மாவட்ட வாரி தரவரிசை.</p></div>
        </div>
      </div>
    </>
  );
}
