import { G4, g4Showing } from '@/lib/venues';
import { NTPC, ntpcShowing } from '@/lib/rrb';

/** Current recruitment notifications (TNPSC Group 4 + RRB NTPC Graduate / UG) in one table. */
export function examNotices() {
  const rows = [];
  if (g4Showing()) rows.push({ name: 'TNPSC குரூப் 4 (CCSE-IV)', qual: '10-ஆம் வகுப்பு', posts: G4.posts, lastDate: G4.lastDate, correction: G4.correction, examDate: G4.examDate, site: 'tnpsc.gov.in', link: G4.link });
  if (ntpcShowing()) {
    rows.push({ name: 'RRB NTPC – பட்டதாரி நிலை (CEN 06/2026)', qual: 'பட்டப்படிப்பு', ...NTPC.grad, site: 'rrbapply.gov.in', link: NTPC.link });
    rows.push({ name: 'RRB NTPC – 12-ஆம் வகுப்பு நிலை (CEN 07/2026)', qual: '12-ஆம் வகுப்பு', ...NTPC.ug, site: 'rrbapply.gov.in', link: NTPC.link });
  }
  return rows;
}

export default function ExamNotices() {
  const rows = examNotices();
  if (!rows.length) return null;
  const sites = [...new Map(rows.map((r) => [r.link, r])).values()];
  return (
    <div className="g4note examnotes" role="note">
      <h2>📢 போட்டித் தேர்வு அறிவிப்புகள் / Exam notifications</h2>
      <div className="tablewrap">
        <table className="extable">
          <thead><tr><th>தேர்வு</th><th>காலிப் பணியிடங்கள்</th><th>விண்ணப்பிக்கக் கடைசி நாள்</th><th>விண்ணப்பத் திருத்தம்</th><th>எழுத்துத் தேர்வு</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td><b>{r.name}</b><div className="small muted">தகுதி: {r.qual}</div></td>
                <td data-l="காலிப் பணியிடங்கள்"><b>{r.posts}</b></td>
                <td data-l="விண்ணப்பிக்கக் கடைசி நாள்" className="exlast">{r.lastDate}</td>
                <td data-l="விண்ணப்பத் திருத்தம்">{r.correction}</td>
                <td data-l="எழுத்துத் தேர்வு">{r.examDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="small" style={{ margin: '8px 0 4px' }}>அதிகாரப்பூர்வ இணையதளம் – நேரடியாக விண்ணப்பிக்க:</div>
      <div className="row" style={{ gap: 8 }}>
        {sites.map((r) => <a key={r.link} className="btn" href={r.link} target="_blank" rel="noopener">{r.site} – நேரடியாக விண்ணப்பிக்க →</a>)}
      </div>
    </div>
  );
}
