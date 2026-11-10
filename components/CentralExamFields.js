import { CX_CENTRE } from '@/lib/centralExams';

/** SSC / IBPS / RRB regional coaching – willing to join? (registration, profile, login prompt) */
export default function CentralExamFields({ v = {}, district = '' }) {
  return (
    <div className="g4q sc-fields">
      <div className="sc-h">🚆🏦 SSC / வங்கி (IBPS) / ரயில்வே (RRB) தேர்வுகள் – மண்டல அளவிலான இலவசப் பயிற்சி</div>
      <p className="small muted" style={{ margin: '0 0 6px' }}>வேலைவாய்ப்பு மற்றும் பயிற்சித் துறையின் சார்பில் SSC, IBPS, RRB தேர்வுகளுக்கு 250 மணி நேர இலவசப் பயிற்சி வகுப்புகள் (20 மாதிரித் தேர்வுகளுடன்) நடத்தப்பட உள்ளன.{CX_CENTRE[district] ? ` உங்கள் மையம்: ${CX_CENTRE[district]}.` : ''}</p>
      <label>இந்தப் பயிற்சி வகுப்புகளில் சேர விருப்பமா? <span className="req">*</span></label>
      <div className="row" style={{ gap: 12 }}>
        <label className="choice"><input type="radio" name="cx_interest" value="yes" required defaultChecked={v.cx_interest === true} /> ஆம் / Yes</label>
        <label className="choice"><input type="radio" name="cx_interest" value="no" required defaultChecked={v.cx_interest === false} /> இல்லை / No</label>
      </div>
    </div>
  );
}
