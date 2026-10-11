/** Shown to non-Mayiladuthurai students who open a class test (Courses). */
export default function ClassOnly({ title }) {
  return (
    <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
      {title && <h1>{title}</h1>}
      <div className="okmsg">
        <b>வகுப்புத் தேர்வுகள் (Courses) மயிலாடுதுறை மாவட்டத்தில் நடைபெறும் பயிற்சி வகுப்புகளுக்கானவை.</b> எனவே மயிலாடுதுறை மாவட்டத்தில் பதிவு செய்த மாணவர்கள் மட்டுமே எழுத முடியும்.
        <div className="small">Class tests are for students of the coaching classes held in Mayiladuthurai district, so only Mayiladuthurai-registered students can write them.</div>
      </div>
      <p>நீங்கள் கீழே உள்ள அனைத்துத் தேர்வுகளையும் இலவசமாக எழுதலாம் / You can write all of these for free:</p>
      <div className="row">
        <a className="btn" href="/full-mocks">முழு மாதிரித் தேர்வுகள் / Full Mocks</a>
        <a className="btn alt" href="/subjects">பாட வாரியான தேர்வுகள் / Subject-wise</a>
        <a className="btn alt" href="/dashboard">என் Dashboard</a>
      </div>
    </div>
  );
}
