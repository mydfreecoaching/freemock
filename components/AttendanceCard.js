/** Dashboard card on a class day: attendance is recorded only by scanning the QR at the venue (IN on arrival, OUT when leaving). */
const t = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—');
export default function AttendanceCard({ venue, day, inAt = null, outAt = null }) {
  return (
    <div className="card att-card">
      <b>📋 இன்றைய பயிற்சி வகுப்பு வருகை – {day}</b>
      <div className="small muted">{venue}</div>
      <div className="att-times">
        <div className={inAt ? 'on' : ''}><span>உள்வருகை / IN</span><b>{t(inAt)}</b></div>
        <div className={outAt ? 'on' : ''}><span>வெளியேற்றம் / OUT</span><b>{t(outAt)}</b></div>
      </div>
      <div className="small">{!inAt ? '📷 வகுப்புக்கு வந்ததும், அங்கு ஒட்டப்பட்டுள்ள QR குறியீட்டை கைபேசி கேமராவில் ஸ்கேன் செய்து IN பதிவு செய்யவும்.'
        : !outAt ? '🚪 கிளம்பும்போது அதே QR-ஐ மீண்டும் ஸ்கேன் செய்து OUT பதிவு செய்யவும்.' : '✅ இன்றைய வருகை பதிவாகிவிட்டது.'}</div>
    </div>
  );
}
