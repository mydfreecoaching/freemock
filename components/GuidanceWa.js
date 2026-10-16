import { guidanceGroups, venueGroup, GUIDANCE_TIME } from '@/lib/venues';

/** WhatsApp group cards: the student's coaching-class venue (Thiruvarur) and guidance-programme venue, if they have a group. */
export default function GuidanceWa({ guidance, venue = null, fresh = false }) {
  const vg = venueGroup(venue);
  const groups = guidanceGroups(guidance).filter((g) => !vg || g.link !== vg.link); // same town group → show once
  if (!groups.length && !vg) return null;
  return <>
    {vg && (
      <div className="card wa-join">
        <div>
          <b>📲 {fresh ? '👉 ' : ''}{vg.title.split(' – ')[0]} இலவசப் பயிற்சி வகுப்புக்கான WhatsApp குழுவில் இப்போதே இணையுங்கள்</b>
          <div className="small">நீங்கள் தேர்வு செய்த பயிற்சி வகுப்பு இடம்: <b>{vg.title}</b>{vg.when ? ` · ${vg.when}` : ''}</div>
          <div className="small">வகுப்பு நேரம், அறிவிப்புகள் இந்தக் குழுவில் பகிரப்படும் / Join the WhatsApp group of your coaching class.</div>
        </div>
        <a className="btn wa-btn" href={vg.link} target="_blank" rel="noopener noreferrer">WhatsApp குழுவில் இணைய →</a>
      </div>
    )}
    {groups.map((g) => (
    <div key={g.key} className="card wa-join">
      <div>
        <b>📲 {fresh ? '👉 ' : ''}{g.label.split(' – ')[0]} வழிகாட்டுதல் நிகழ்ச்சிக்கான WhatsApp குழுவில் இப்போதே இணையுங்கள்</b>
        <div className="small">நீங்கள் தேர்வு செய்த இடம்: <b>{g.label}</b> · {g.date} ({g.day}) · {GUIDANCE_TIME}</div>
        <div className="small">நிகழ்ச்சி பற்றிய தகவல்கள் இந்தக் குழுவில் பகிரப்படும் / Join the WhatsApp group for the guidance programme you chose.</div>
      </div>
      <a className="btn wa-btn" href={g.link} target="_blank" rel="noopener noreferrer">WhatsApp குழுவில் இணைய →</a>
    </div>
  ))}
  </>;
}
