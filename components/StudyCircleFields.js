'use client';
import { useState } from 'react';
import { EDU_LEVELS, MEDIUMS, MODES } from '@/lib/studyCircle';
import SignaturePad from './SignaturePad';

/** Study Circle registration details (printed on the DECGC form). `v` = saved student row (profile / prompt). */
export default function StudyCircleFields({ v = {}, signUrl = '' }) {
  const edu0 = v.edu || {};
  const [lv, setLv] = useState(Object.keys(edu0));
  const [dis, setDis] = useState(v.disabled === true ? 'yes' : v.disabled === false ? 'no' : '');
  const toggle = (k) => setLv((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]));
  return (
    <div className="g4q sc-fields">
      <div className="sc-h">📝 பயிற்சி வட்டப் பதிவுப் படிவ விவரங்கள் / Study Circle registration details</div>
      <p className="small muted" style={{ margin: '0 0 6px' }}>இவை மையத்தின் பதிவுப் படிவத்தில் அச்சிடப்படும். ஆதார் எண்ணை அச்சிட்ட படிவத்தில் நீங்களே எழுத வேண்டும்.</p>
      <div className="grid2">
        <div><label>தந்தை / பாதுகாவலர் பெயர் / Father / Guardian name <span className="req">*</span></label><input name="sc_father" required maxLength={80} defaultValue={v.father_name || ''} /></div>
        <div><label>தாயின் பெயர் / Mother name <span className="req">*</span></label><input name="sc_mother" required maxLength={80} defaultValue={v.mother_name || ''} /></div>
      </div>
      <label>முழு முகவரி / Full address <span className="req">*</span></label>
      <textarea name="sc_address" required minLength={10} maxLength={300} rows={3} defaultValue={v.address || ''} placeholder="கதவு எண், தெரு, ஊர், வட்டம்" />
      <div className="grid2">
        <div><label>அஞ்சல் குறியீடு / Pincode <span className="req">*</span></label><input name="sc_pincode" required inputMode="numeric" pattern="6[0-9]{5}" maxLength={6} defaultValue={v.pincode || ''} /></div>
        <div>
          <label>மாற்றுத்திறனாளியா? / Differently abled? <span className="req">*</span></label>
          <div className="row" style={{ gap: 12 }}>
            {[['yes', 'ஆம் / Yes'], ['no', 'இல்லை / No']].map(([k, l]) => <label key={k} className="choice"><input type="radio" name="sc_disabled" value={k} required checked={dis === k} onChange={() => setDis(k)} /> {l}</label>)}
          </div>
        </div>
      </div>
      {dis === 'yes' && <><label>மாற்றுத்திறன் வகை & சதவீதம் / Type of disability & percentage <span className="req">*</span></label><input name="sc_disability" required maxLength={120} defaultValue={v.disability || ''} placeholder="எ.கா. Locomotor – 45%" /></>}

      <label>கல்வித் தகுதிகள் / Educational qualifications <span className="req">*</span> <span className="small muted">(நீங்கள் படித்தவற்றைத் தேர்வு செய்யவும்)</span></label>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {EDU_LEVELS.map(([k, l]) => <label key={k} className={`choice ${lv.includes(k) ? 'on' : ''}`}><input type="checkbox" name="sc_edu" value={k} checked={lv.includes(k)} onChange={() => toggle(k)} /> {l}</label>)}
      </div>
      {EDU_LEVELS.filter(([k]) => lv.includes(k)).map(([k, l]) => {
        const e = edu0[k] || {};
        return (
          <div key={k} className="sc-edu">
            <b>{l}</b>
            <div className="sc-edu-row">
              <div><label>படிப்பு / பாடம் (Course / subject){k !== 'SSLC' && k !== 'HSC' && <span className="req"> *</span>}</label><input name={`sc_${k}_course`} maxLength={60} required={k !== 'SSLC' && k !== 'HSC'} defaultValue={e.course || ''} placeholder={k === 'HSC' ? 'எ.கா. Computer Science' : k === 'UG' ? 'எ.கா. B.Sc Maths' : ''} /></div>
              <div><label>தேர்ச்சி ஆண்டு / Year <span className="req">*</span></label><input name={`sc_${k}_year`} required inputMode="numeric" pattern="(19[7-9][0-9]|20[0-9]{2})" maxLength={4} defaultValue={e.year || ''} /></div>
              <div><label>பயிற்று மொழி / Medium <span className="req">*</span></label><select name={`sc_${k}_medium`} required defaultValue={e.medium || ''}><option value="" disabled>–</option><option>Tamil</option><option>English</option><option>Other</option></select></div>
              <div><label>சதவீதம் / % <span className="req">*</span></label><input name={`sc_${k}_pct`} required inputMode="decimal" pattern="[0-9]{1,3}(\.[0-9]{1,2})?" maxLength={6} defaultValue={e.pct || ''} placeholder="72.5" /></div>
            </div>
          </div>
        );
      })}
      <label>முந்தைய தேர்வு அனுபவம் (தேர்வின் பெயர் & பதிவு எண்) / Previous exam experience (exam name & registration no.)</label>
      <input name="sc_prev_exams" maxLength={300} defaultValue={v.prev_exams || ''} placeholder="எ.கா. TNPSC Group 4 2024 – 123456789" />
      <div className="grid2">
        <div><label>பயிற்சி மொழி / Medium of training <span className="req">*</span></label>
          <div className="row" style={{ gap: 12 }}>{MEDIUMS.map(([k, l]) => <label key={k} className="choice"><input type="radio" name="sc_medium" value={k} required defaultChecked={v.train_medium === k} /> {l}</label>)}</div></div>
        <div><label>பயிற்சி முறை / Mode of training <span className="req">*</span></label>
          <div className="row" style={{ gap: 12 }}>{MODES.map(([k, l]) => <label key={k} className="choice"><input type="radio" name="sc_mode" value={k} required defaultChecked={(v.train_mode || 'OFFLINE') === k} /> {l}</label>)}</div></div>
      </div>
      <SignaturePad existing={signUrl} />
    </div>
  );
}
