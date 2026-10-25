import { NTPC } from '@/lib/rrb';

/** RRB NTPC (Graduate + Undergraduate) notice card. compact = dashboard version. */
export default function RrbNotice({ compact = false }) {
  const now = Date.now();
  return (
    <div className="g4note rrbnote" role="note">
      <h2>🚆 {NTPC.title}</h2>
      <div className="small">{NTPC.titleEn}</div>
      <div className="rrb-levels">
        {NTPC.levels.map((l) => {
          const open = now < new Date(l.closes).getTime();
          return (
            <div key={l.key} className="rrb-level">
              <b>{l.name}</b> <span className="small muted">{l.cen}</span>
              <div className="small">காலிப்பணியிடங்கள்: <b>{l.posts}</b> · தகுதி: {l.qual} · வயது: {l.age}</div>
              {!compact && <div className="small muted">{l.jobs}</div>}
              <div className="g4dates">
                <div><small>விண்ணப்பிக்கக் கடைசி நாள்</small><b>{l.last}</b><small>Last date: {l.lastEn}</small></div>
                <div><small>திருத்தம்</small><b style={{ fontSize: 15 }}>{l.correction}</b><small>Correction window</small></div>
              </div>
              <div className="small">{l.exam}{!open && ' · விண்ணப்பம் நிறைவடைந்தது'}</div>
            </div>
          );
        })}
      </div>
      {!compact && <p className="small" style={{ margin: '6px 0' }}>{NTPC.fee}<br />{NTPC.ageNote}<br />{NTPC.stages}</p>}
      <div className="row"><a className="btn" href={NTPC.link} target="_blank" rel="noopener">rrbapply.gov.in-இல் விண்ணப்பிக்க →</a></div>
      <p className="small muted" style={{ margin: '6px 0 0' }}>விவரங்களை அதிகாரப்பூர்வ அறிவிப்பில் உறுதி செய்துகொள்ளவும்.</p>
    </div>
  );
}
