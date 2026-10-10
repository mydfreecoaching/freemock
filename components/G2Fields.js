'use client';
import AppliedFields from './AppliedFields';

/** "Have you applied for TNPSC Group 2/2A?" (application window closed) — Yes requires the application number. */
export default function G2Fields({ applied = null, appNo = '' }) {
  return <AppliedFields field="g2" exam="TNPSC குரூப் 2 / 2A" applied={applied} appNo={appNo} />;
}
