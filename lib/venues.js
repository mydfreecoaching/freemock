/** Free coaching venues shown at registration, and the TNPSC Group 4 notice. */

import { decgcOf } from './decgc';
// address / contact of a district's centre (WhatsApp for the five centres that use it)
const C = (code) => { const o = decgcOf(code); return o ? [o.address, o.wa ? `WhatsApp ${o.waLabel}` : o.phone] : null; };
const DECGC = new Proxy({}, { get: (_, code) => C(code) || undefined });
const DECGC_TA = 'மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம்';

/** Coaching venue options for a district code: [{ code, title, address, phone, when }]. */
export function venueOptions(dcode) {
  if (dcode === 'MYD') return [
    { code: 'MYD_DECGC', title: `${DECGC_TA}, மயிலாடுதுறை`, address: DECGC.MYD[0], phone: DECGC.MYD[1], when: 'திங்கள் – வெள்ளி பயிற்சி வகுப்புகள் / Monday – Friday classes' },
    { code: 'MYD_COLL', title: 'மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', address: 'District Collectorate, Mayiladuthurai', phone: '', when: 'சனி & ஞாயிறு பயிற்சி வகுப்புகள் / Saturday & Sunday classes' },
  ];
  if (dcode === 'TVR') return [{ code: 'TVR_DECGC', title: `${DECGC_TA}, திருவாரூர்`, address: DECGC.TVR[0], phone: DECGC.TVR[1], when: 'திங்கள் – வெள்ளி பயிற்சி வகுப்புகள் / Monday – Friday classes' }];
  if (DECGC[dcode]) return [{ code: `${dcode}_DECGC`, title: DECGC_TA, address: DECGC[dcode][0], phone: DECGC[dcode][1], when: '' }];
  return [];
}
export const VENUE_LABEL = (code) => {
  if (!code) return '';
  const d = code.split('_')[0];
  const o = venueOptions(d).find((v) => v.code === code);
  return o ? `${o.title}${o.when ? ` (${o.when.split(' / ')[1]})` : ''}` : code;
};
export const validVenue = (dcode, code) => venueOptions(dcode).some((v) => v.code === code);

/** Thiruvarur district career-guidance programme venues (10:00 AM – 2:00 PM). */
export const GUIDANCE_TIME = 'காலை 10.00 மணி முதல் மதியம் 2.00 மணி வரை / 10:00 AM – 2:00 PM';
export const GUIDANCE = [
  ['14.10.2026', 'புதன்கிழமை', [['G1', 'நன்னிலம் – வட்டாட்சியர் அலுவலகம்'], ['G2', 'குடவாசல் – வட்டார வளர்ச்சி அலுவலகம்'], ['G3', 'வலங்கைமான் – பேரூராட்சி அலுவலகம்']]],
  ['15.10.2026', 'வியாழக்கிழமை', [['G4', 'முத்துப்பேட்டை – வட்டார வளர்ச்சி அலுவலகம்'], ['G5', 'திருத்துறைப்பூண்டி – வட்டார வளர்ச்சி அலுவலகம்'], ['G6', 'கோட்டூர் – வட்டார வளர்ச்சி அலுவலகம்'], ['G7', 'மன்னார்குடி – நகராட்சி அலுவலகம்']]],
  ['16.10.2026', 'வெள்ளிக்கிழமை', [['G8', 'நீடாமங்கலம் – வட்டார வளர்ச்சி அலுவலகம்'], ['G9', 'கொரடாச்சேரி – வட்டார வளர்ச்சி அலுவலகம்'], ['G10', 'திருவாரூர் – வட்டார வளர்ச்சி அலுவலகம்']]],
];
/** Programme days not yet over (IST). */
export const upcomingGuidance = (now = Date.now()) => GUIDANCE.filter(([d]) => { const [dd, mm, yy] = d.split('.'); return new Date(`${yy}-${mm}-${dd}T23:59:59+05:30`).getTime() >= now; });
export const GUIDANCE_LABEL = Object.fromEntries(GUIDANCE.flatMap(([date, , list]) => list.map(([k, l]) => [k, `${date} ${l}`])));
/** WhatsApp group per guidance venue – shown to students who chose that venue (until the programme day is over). */
export const GUIDANCE_WA = {
  G1: 'https://chat.whatsapp.com/FHidYiM1TSKHeZ9HUm9QSt?s=cl&p=a&mlu=4&ilr=4', // நன்னிலம்
  G2: 'https://chat.whatsapp.com/GLQZgJNgHluGhbHIbqAFgo?s=cl&p=a&mlu=4&ilr=4', // குடவாசல்
  G3: 'https://chat.whatsapp.com/J2mBiNBImRa0yBePXQDZZ3?s=cl&p=a&mlu=4&ilr=4', // வலங்கைமான்
  G5: 'https://chat.whatsapp.com/HuQIEaIWp0DJApj4xY6XC6?s=cl&p=a&mlu=4&ilr=4', // திருத்துறைப்பூண்டி
  G6: 'https://chat.whatsapp.com/LgvZXO9QqMqHAKdCuqNC4n?s=cl&p=a&mlu=4&ilr=4', // கோட்டூர்
  G8: 'https://chat.whatsapp.com/EBVavHI16efFkK79SWW9kD?s=cl&p=a&mlu=4&ilr=4', // நீடாமங்கலம்
  G10: 'https://chat.whatsapp.com/DenD9lCwdLQIBKmxLpPOeY?s=cl&p=a&mlu=4&ilr=4', // திருவாரூர் BDO
};
/** The student's chosen guidance venue(s) that have a WhatsApp group and are not over yet. */
export function guidanceGroups(guidance) {
  const chosen = Array.isArray(guidance) ? guidance : [];
  return upcomingGuidance().flatMap(([date, day, list]) => list.filter(([k]) => chosen.includes(k) && GUIDANCE_WA[k]).map(([k, label]) => ({ key: k, date, day, label, link: GUIDANCE_WA[k] })));
}

/** TNPSC Group 4 notice (dates from the TNPSC notification, Advt. Oct 2026). */
export const G4 = {
  title: 'TNPSC குரூப் 4 (CCSE-IV) தேர்வு – அறிவிப்பு வெளியீடு',
  titleEn: 'TNPSC Group 4 (CCSE-IV) 2026 – Notification out',
  posts: '6,574',
  lastDate: '05.11.2026',
  lastDateEn: '5 November 2026, 11:59 PM',
  correction: '09.11.2026 – 11.11.2026',
  examDate: '10.01.2027',
  examDateEn: '10 January 2027 (Sunday), 9:30 AM – 12:30 PM',
  link: 'https://www.tnpsc.gov.in',
  askUntil: '2026-11-11T23:59:59+05:30', // ask "have you applied?" until the correction window closes
  showUntil: '2027-01-10T23:59:59+05:30',
};
export const g4Asking = () => Date.now() < new Date(G4.askUntil).getTime();
export const g4Showing = () => Date.now() < new Date(G4.showUntil).getTime();
export const G4_APP_RE = /^[A-Za-z0-9/-]{5,25}$/;
