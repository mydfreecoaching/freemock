import { guidanceGroups, GUIDANCE_TIME } from '@/lib/venues';

/** WhatsApp group card for students who chose a guidance-programme venue that has a group (e.g. Kudavasal). */
export default function GuidanceWa({ guidance, fresh = false }) {
  const groups = guidanceGroups(guidance);
  if (!groups.length) return null;
  return groups.map((g) => (
    <div key={g.key} className="card wa-join">
      <div>
        <b>📲 {fresh ? '👉 ' : ''}{g.label.split(' – ')[0]} வழிகாட்டுதல் நிகழ்ச்சிக்கான WhatsApp குழுவில் இப்போதே இணையுங்கள்</b>
        <div className="small">நீங்கள் தேர்வு செய்த இடம்: <b>{g.label}</b> · {g.date} ({g.day}) · {GUIDANCE_TIME}</div>
        <div className="small">நிகழ்ச்சி பற்றிய தகவல்கள் இந்தக் குழுவில் பகிரப்படும் / Join the WhatsApp group for the guidance programme you chose.</div>
      </div>
      <a className="btn wa-btn" href={g.link} target="_blank" rel="noopener noreferrer">WhatsApp குழுவில் இணைய →</a>
    </div>
  ));
}
