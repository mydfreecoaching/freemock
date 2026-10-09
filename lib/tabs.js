/** Tab / app switching rules while writing a test (shared by the exam page and the server). */
export const TAB_LOGOUT = 4; // more than 3 switches → automatic logout (student may log in again and continue)
export const TAB_SUBMIT = 6; // more than 5 switches → answer sheet submitted automatically

export function tabWarning(n) {
  if (n <= 0) return null;
  if (n < TAB_LOGOUT - 1) return {
    title: `⚠️ எச்சரிக்கை / Warning (${n})`,
    ta: `தேர்வு எழுதும்போது நீங்கள் வேறு tab / app / திரைக்கு மாறியுள்ளீர்கள் (${n} முறை). 3 முறைக்கு மேல் மாறினால் தானாக வெளியேற்றப்படுவீர்கள் (logout). 5 முறைக்கு மேல் மாறினால் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.`,
    en: `You left the test screen (${n} time${n > 1 ? 's' : ''}). More than 3 switches = automatic logout. More than 5 switches = your test is submitted automatically.`,
  };
  if (n === TAB_LOGOUT - 1) return {
    title: `⚠️ எச்சரிக்கை / Warning (${n})`,
    ta: `நீங்கள் 3 முறை வேறு tab / app-க்கு மாறியுள்ளீர்கள். இன்னும் ஒரு முறை மாறினால் உடனே தானாக வெளியேற்றப்படுவீர்கள் (logout).`,
    en: `You have switched 3 times. One more switch will log you out automatically.`,
  };
  if (n < TAB_SUBMIT - 1) return {
    title: `⛔ தானாக வெளியேற்றப்பட்டீர்கள் / Logged out (${n})`,
    ta: `3 முறைக்கு மேல் tab மாற்றியதால் நீங்கள் வெளியேற்றப்பட்டீர்கள். மீண்டும் மாற்றினால் இந்தத் தேர்வைத் தொடர்ந்து எழுத முடியாது — 5 முறைக்கு மேல் மாற்றினால் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.`,
    en: `You were logged out for switching more than 3 times. If you keep switching you cannot continue this test — after more than 5 switches it is submitted automatically.`,
  };
  return {
    title: `⛔ இறுதி எச்சரிக்கை / Final warning (${n})`,
    ta: `இது இறுதி எச்சரிக்கை. இன்னும் ஒரு முறை வேறு tab / app-க்கு மாறினால் இந்தத் தேர்வைத் தொடர்ந்து எழுத முடியாது — விடைத்தாள் உடனே தானாகச் சமர்ப்பிக்கப்படும்.`,
    en: `Final warning: one more switch and you cannot continue this test — it will be submitted automatically.`,
  };
}
