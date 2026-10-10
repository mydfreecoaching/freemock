'use client';
import AppliedFields from './AppliedFields';

/** "Have you applied for TNPSC Group 4?" — Yes requires the application number. */
export default function G4Fields({ applied = null, appNo = '' }) {
  return <AppliedFields field="g4" exam="TNPSC குரூப் 4" applied={applied} appNo={appNo}
    noNote="பரவாயில்லை, பதிவு செய்யலாம். விரைவில் tnpsc.gov.in-இல் விண்ணப்பிக்கவும் – விண்ணப்பித்த பின் விண்ணப்ப எண்ணை இங்கு பதிவு செய்யுங்கள்." />;
}
