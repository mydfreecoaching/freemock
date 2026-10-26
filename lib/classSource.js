import { classDays } from './attendance';

/** "How did you come to know about the free coaching classes?" – asked from Mayiladuthurai / Thiruvarur class students. */
export const CLASS_SOURCES = [
  ['EMP_OFFICE', 'வேலைவாய்ப்பு அலுவலகம் நேரில் / Employment office (in person)'],
  ['WHATSAPP', 'WhatsApp குழு / செய்தி'],
  ['FRIENDS', 'நண்பர்கள் / உறவினர்கள் / Friends & family'],
  ['STUDENTS', 'ஏற்கனவே படிக்கும் மாணவர்கள் / Current students'],
  ['NEWSPAPER', 'செய்தித்தாள் / Newspaper'],
  ['SOCIAL', 'Facebook / Instagram / YouTube'],
  ['POSTER', 'சுவரொட்டி / அறிவிப்புப் பலகை / Poster, notice board'],
  ['COLLEGE', 'கல்லூரி / பள்ளி / College, school'],
  ['LIBRARY', 'நூலகம் / அறிவுசார் மையம் / Library'],
  ['GOVT', 'அரசு அலுவலகம் (வட்டார வளர்ச்சி / வட்டாட்சியர்) / Govt office'],
  ['CAMP', 'வேலைவாய்ப்பு முகாம் / வழிகாட்டுதல் நிகழ்ச்சி / Job fair, guidance programme'],
  ['WEBSITE', 'இந்த இணையதளம் / This website'],
  ['OTHER', 'பிற / Other'],
];
export const CLASS_SOURCE_LABEL = Object.fromEntries(CLASS_SOURCES);
export const attendsClass = (venue) => classDays(venue).length > 0;
export const sourceText = (r) => (r.class_source || []).map((k) => (k === 'OTHER' ? `Other: ${r.class_source_other || ''}` : (CLASS_SOURCE_LABEL[k] || k).split(' / ')[0])).join('; ');

/** Validate (only when the venue holds classes) → { values: { class_source, class_source_other } } | { error } | { values: null } */
export function classSourceFields(b, venue) {
  if (!attendsClass(venue)) return { values: null };
  const keys = new Set(CLASS_SOURCES.map((x) => x[0]));
  const src = [...new Set([].concat(b.class_source || []).map(String))].filter((k) => keys.has(k));
  const other = src.includes('OTHER') ? String(b.class_source_other || '').trim().slice(0, 200) : '';
  if (!src.length) return { error: 'பயிற்சி வகுப்பு பற்றி எவ்வாறு தெரிய வந்தது என்பதைத் தேர்வு செய்யவும் / How did you hear about the classes?' };
  if (src.includes('OTHER') && other.length < 2) return { error: '"பிற" – எவ்வாறு தெரிய வந்தது என்பதை எழுதவும்.' };
  return { values: { class_source: src, class_source_other: other || null } };
}
