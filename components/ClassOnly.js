/** Shown to a student whose district has no class tests (Courses), or who opens a class test meant for another district. */
export default function ClassOnly({ title, districts = null }) {
  const d = (districts || []).join(', ');
  return (
    <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
      {title && <h1>{title}</h1>}
      <div className="okmsg">
        <b>வகுப்புத் தேர்வுகள் (Courses) அந்தந்த மாவட்டத்தில் நடைபெறும் பயிற்சி வகுப்புகளுக்கானவை.</b> {d ? <>இந்தத் தேர்வு <b>{d}</b> மாவட்டத்தில் பதிவு செய்த மாணவர்களுக்கு மட்டும்.</> : 'உங்கள் மாவட்டத்துக்கு இப்போது வகுப்புத் தேர்வுகள் இல்லை.'}
        <div className="small">Class tests are only for students of the district where the classes are held{d ? ` (${d})` : ''}.</div>
      </div>
      <p>நீங்கள் கீழே உள்ள அனைத்துத் தேர்வுகளையும் இலவசமாக எழுதலாம் / You can write all of these for free:</p>
      <div className="row">
        <a className="btn" href="/tests?t=full">முழு மாதிரித் தேர்வுகள் / Full Mocks</a>
        <a className="btn alt" href="/tests?t=subject">பாட வாரியான தேர்வுகள் / Subject-wise</a>
        <a className="btn alt" href="/dashboard">என் Dashboard</a>
      </div>
    </div>
  );
}
