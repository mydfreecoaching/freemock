/** Free coaching venues shown at registration, and the TNPSC Group 4 notice. */

import { decgcOf } from './decgc';
// address / contact of a district's centre (WhatsApp for the five centres that use it)
const C = (code) => { const o = decgcOf(code); return o ? [o.address, o.wa ? `WhatsApp ${o.waLabel}` : o.phone] : null; };
const DECGC = new Proxy({}, { get: (_, code) => C(code) || undefined });
const DECGC_TA = 'மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம்';

/**
 * Thiruvarur district free coaching classes (from 17.10.2026, 10 AM) – the student picks one place.
 * [code, place, town, when?]; each town has a WhatsApp group (VENUE_WA, below).
 */
export const TVR_START = 'இந்த 10 இடங்களிலும் TNPSC குரூப் 4 இலவச பயிற்சி வகுப்புகள் சனி & ஞாயிறு மட்டும் (17.10.2026 முதல், காலை 10 மணி). திங்கள் – வெள்ளி வகுப்புகள் திருவாரூர் மாவட்ட வேலைவாய்ப்பு மையத்தில். / Group 4 classes at these 10 places on Saturday & Sunday only; Monday – Friday classes at DECGC Thiruvarur.';
const TVR_WEEKEND = 'சனி & ஞாயிறு மட்டும் – குரூப் 4 / Saturday & Sunday only – Group 4';
const TVR_CLASSES = [
  ['TVC1', 'வலங்கைமான் – வட்டாட்சியர் அலுவலகம்', 'வலங்கைமான்'],
  ['TVC2', 'குடவாசல் – வட்டார வளர்ச்சி அலுவலகம்', 'குடவாசல்'],
  ['TVC3', 'கொரடாச்சேரி – வட்டார வளர்ச்சி அலுவலகம்', 'கொரடாச்சேரி'],
  ['TVC4', 'நன்னிலம் – வட்டாட்சியர் அலுவலகம்', 'நன்னிலம்'],
  ['TVC5', 'திருவாரூர் – வட்டார வளர்ச்சி அலுவலகம்', 'திருவாரூர்'],
  ['TVC6', 'மன்னார்குடி – கிளை நூலகம்', 'மன்னார்குடி'],
  ['TVC7', 'நீடாமங்கலம் – வட்டார வளர்ச்சி அலுவலகம்', 'நீடாமங்கலம்'],
  ['TVC8', 'திருத்துறைப்பூண்டி – வட்டார வளர்ச்சி அலுவலகம்', 'திருத்துறைப்பூண்டி'],
  ['TVC9', 'முத்துப்பேட்டை – வட்டார வளர்ச்சி அலுவலகம்', 'முத்துப்பேட்டை'],
  ['TVC10', 'கோட்டூர் – கலைவாணி மெட்ரிகுலேஷன் பள்ளி', 'கோட்டூர்', `${TVR_WEEKEND.split(' / ')[0]} (ஏற்கனவே நடைபெற்று வருகிறது) / Saturday & Sunday only – Group 4 (already running)`],
  ['TVC0', 'பயிற்சி வகுப்புக்கு நேரில் வர இயலாது – இணையவழித் தேர்வுகள் மட்டும்', 'இணையவழி / Online only', '—'],
];
/** Earlier Thiruvarur choices that are no longer offered but stay valid for students who picked them. */
const LEGACY_VENUE = {};

/** Coaching venue options for a district code: [{ code, title, address, phone, when }]. */
export function venueOptions(dcode) {
  if (dcode === 'MYD') return [
    { code: 'MYD_DECGC', title: `${DECGC_TA}, மயிலாடுதுறை`, address: DECGC.MYD[0], phone: DECGC.MYD[1], when: 'திங்கள் – வெள்ளி பயிற்சி வகுப்புகள் / Monday – Friday classes' },
    { code: 'MYD_COLL', title: 'மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', address: 'District Collectorate, Mayiladuthurai', phone: '', when: 'சனி & ஞாயிறு பயிற்சி வகுப்புகள் / Saturday & Sunday classes' },
  ];
  if (dcode === 'TVR') return [
    { code: 'TVR_DECGC', title: `${DECGC_TA}, திருவாரூர்`, address: DECGC.TVR?.[0] || 'திருவாரூர்', phone: DECGC.TVR?.[1] || '', when: 'திங்கள் – வெள்ளி பயிற்சி வகுப்புகள் / Monday – Friday classes' },
    ...TVR_CLASSES.map(([code, title, town, when]) => ({ code, title, address: code === 'TVC0' ? town : `${town}, திருவாரூர் மாவட்டம்`, phone: '', when: when === '—' ? '' : when || TVR_WEEKEND })),
  ];
  if (DECGC[dcode]) return [{ code: `${dcode}_DECGC`, title: DECGC_TA, address: DECGC[dcode][0], phone: DECGC[dcode][1], when: '' }];
  return [];
}
export const VENUE_LABEL = (code) => {
  if (!code) return '';
  if (LEGACY_VENUE[code]) return LEGACY_VENUE[code];
  if (/^TVC\d+$/.test(code)) { const o = venueOptions('TVR').find((v) => v.code === code); return o ? o.title : code; }
  const d = code.split('_')[0];
  const o = venueOptions(d).find((v) => v.code === code);
  return o ? `${o.title}${o.when ? ` (${o.when.split(' / ')[1]})` : ''}` : code;
};
export const validVenue = (dcode, code) => venueOptions(dcode).some((v) => v.code === code) || (!!LEGACY_VENUE[code] && code.startsWith(`${dcode}_`));

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
  G4: 'https://chat.whatsapp.com/B7oVxs6WjTLHmIceXsBuHn?s=cl&p=a&mlu=4&ilr=4', // முத்துப்பேட்டை
  G5: 'https://chat.whatsapp.com/HuQIEaIWp0DJApj4xY6XC6?s=cl&p=a&mlu=4&ilr=4', // திருத்துறைப்பூண்டி
  G6: 'https://chat.whatsapp.com/LgvZXO9QqMqHAKdCuqNC4n?s=cl&p=a&mlu=4&ilr=4', // கோட்டூர்
  G7: 'https://chat.whatsapp.com/DZTIxAyVJLk56UiOM6rgTF?s=cl&p=a&mlu=4&ilr=4', // மன்னார்குடி
  G8: 'https://chat.whatsapp.com/EBVavHI16efFkK79SWW9kD?s=cl&p=a&mlu=4&ilr=4', // நீடாமங்கலம்
  G9: 'https://chat.whatsapp.com/BvA37UllIUdFOq1EaYrs0X?s=cl&p=a&mlu=4&ilr=4', // கொரடாச்சேரி
  G10: 'https://chat.whatsapp.com/DenD9lCwdLQIBKmxLpPOeY?s=cl&p=a&mlu=4&ilr=4', // திருவாரூர் BDO
};
/** WhatsApp group of each Thiruvarur class venue (the town's group). */
export const VENUE_WA = { TVC1: GUIDANCE_WA.G3, TVC2: GUIDANCE_WA.G2, TVC3: GUIDANCE_WA.G9, TVC4: GUIDANCE_WA.G1, TVC5: GUIDANCE_WA.G10, TVC6: GUIDANCE_WA.G7, TVC7: GUIDANCE_WA.G8, TVC8: GUIDANCE_WA.G5, TVC9: GUIDANCE_WA.G4, TVC10: GUIDANCE_WA.G6 };
/** The class venue's WhatsApp group, if any: { title, when, link }. */
export function venueGroup(code) {
  const o = code && VENUE_WA[code] ? venueOptions('TVR').find((v) => v.code === code) : null;
  return o ? { key: code, title: o.title, when: o.when || TVR_START, link: VENUE_WA[code] } : null;
}
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
