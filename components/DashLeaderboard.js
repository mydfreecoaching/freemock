/**
 * Dashboard: overall (combined) ranking of every exam the student has written a test in – top 10 and the student's
 * own place. Same order as the public full list (/combined/[code]); Reg. No. + district only (no names).
 */
export default function DashLeaderboard({ boards, me }) {
  if (!boards.length) return null;
  return (
    <div className="card dash-lb">
      <h2 style={{ marginTop: 0 }}>🏆 ஒட்டுமொத்தத் தரவரிசை / Overall leaderboard</h2>
      {boards.map((b, i) => {
        const mine = b.rows.find((r) => r.student_id === me);
        const top = b.rows.slice(0, 10);
        const inTop = top.some((r) => r.student_id === me);
        const Row = ({ r }) => (
          <tr className={r.student_id === me ? 'me' : ''}>
            <td className="num"><b>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</b></td>
            <td>{r.student_id === me ? <b>நீங்கள் ({r.reg_no})</b> : r.reg_no}<div className="small muted">{r.district}</div></td>
            <td className="num"><b>{r.total}</b><div className="small muted">{r.written}/{b.tests.length} தேர்வு · {r.avgPct}%</div></td>
          </tr>
        );
        return (
          <details key={b.code} open={i === 0} className="lb-exam">
            <summary>
              <b>{b.name}</b> <span className="small muted">· {b.rows.length} பேர் · {b.tests.length} தேர்வுகள்{b.running ? ' · 🔴 நடப்பில் உள்ள தேர்வும் சேர்த்து' : ''}</span>
              {mine && <span className="lb-myrank">உங்கள் இடம்: <b>{mine.rank}</b> / {b.rows.length}</span>}
            </summary>
            <div className="tablewrap"><table className="small">
              <thead><tr><th className="num">இடம்</th><th>பதிவு எண்</th><th className="num">மொத்த மதிப்பெண்</th></tr></thead>
              <tbody>
                {top.map((r) => <Row key={r.student_id} r={r} />)}
                {mine && !inTop && <><tr><td colSpan={3} className="muted" style={{ textAlign: 'center' }}>⋯</td></tr><Row r={mine} /></>}
              </tbody>
            </table></div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <span className="small muted">வரிசை: {b.byWritten ? 'எழுதிய தேர்வுகளின் எண்ணிக்கை, பிறகு ' : ''}மொத்த மதிப்பெண் → சராசரி % → குறைந்த நேரம்.</span>
              <a className="small" href={`/combined/${b.code}`}>முழுப் பட்டியல் →</a>
            </div>
          </details>
        );
      })}
    </div>
  );
}
