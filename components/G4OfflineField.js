import { G4_OFF_Q, G4_OFF_EN } from '@/lib/g4Offline';

/** Yes / No radio for the offline Group 4 mock tests (registration / profile). */
export default function G4OfflineField({ value = null }) {
  return (
    <div className="g4q">
      <label>📝 {G4_OFF_Q} <span className="req">*</span></label>
      <div className="small muted" style={{ marginBottom: 4 }}>{G4_OFF_EN}</div>
      <div className="row" style={{ gap: 12 }}>
        <label className="choice"><input type="radio" name="g4_offline" value="yes" required defaultChecked={value === true} /> ஆம், கலந்துகொள்வேன் / Yes</label>
        <label className="choice"><input type="radio" name="g4_offline" value="no" required defaultChecked={value === false} /> இல்லை / No</label>
      </div>
    </div>
  );
}
