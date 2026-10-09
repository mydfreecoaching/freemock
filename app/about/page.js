import { ensureSchema } from '@/lib/db';
import { publicStats } from '@/lib/public';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'About us – இலவச இணையவழி மாதிரி தேர்வு' };

export default async function About() {
  await ensureSchema();
  const S = await publicStats();
  return (
    <>
      <section className="pagehead"><h1>எங்களைப் பற்றி / About us</h1><p>மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம் – தன்னார்வ பயிலும் வட்டம், மயிலாடுதுறை & திருவாரூர்</p></section>
      <div className="grid2">
        <div className="card">
          <h2>யார் நாங்கள்?</h2>
          <p>தமிழ்நாடு அரசின் மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள், வேலை தேடும் இளைஞர்களுக்குத் தொழில்நெறி வழிகாட்டுதலும், போட்டித் தேர்வுகளுக்கான இலவசப் பயிற்சியும் வழங்குகின்றன. மையத்தின் <b>தன்னார்வ பயிலும் வட்டம் (Study Circle)</b> வழியாக TNPSC போன்ற போட்டித் தேர்வுகளுக்கு இலவசப் பயிற்சி வகுப்புகளும் மாதிரித் தேர்வுகளும் நடத்தப்படுகின்றன.</p>
          <p>மயிலாடுதுறை, திருவாரூர் மையங்கள் இணைந்து நடத்தும் இந்த இணையதளம், எந்த மாவட்டத்தைச் சேர்ந்த மாணவரும் வீட்டிலிருந்தே கைபேசியில் மாதிரித் தேர்வு எழுதி, உடனடியாகத் தன் நிலையை அறிந்துகொள்ள உதவுகிறது.</p>
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
        <div><b>{S.students}</b><span>பதிவு செய்த மாணவர்கள்</span></div>
        <div><b>{S.tests}</b><span>நடத்தப்பட்ட தேர்வுகள்</span></div>
        <div><b>{S.attempts}</b><span>எழுதப்பட்ட விடைத்தாள்கள்</span></div>
        <div><b>{S.districts}</b><span>மாவட்டங்கள்</span></div>
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
