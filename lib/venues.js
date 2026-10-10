/** Free coaching venues shown at registration, and the TNPSC Group 4 notice. */

// District Employment & Career Guidance Centre addresses (employmentexchange.tn.gov.in/contact_decgc.html)
const DECGC = {
  ARL: ['Near District Collector\'s Office, Walaja Town, Ariyalur – 621 704', '04329-222111'],
  CGL: ['BSNL Office, Government ITI Campus, Chengalpattu – 603 111', '044-27426020'],
  CHN: ['Integrated Employment Office Building, Women ITI Complex, Guindy, Chennai – 600 032', '044-24615160'],
  CBE: ['Govt. ITI Complex, Thudiyalur, Mettupalayam Road, Coimbatore – 641 029', '0422-2642388'],
  CDL: ['Govt. ITI Complex, Semmandalam, Cuddalore – 607 001', '04142-290039'],
  DPI: ['Govt. ITI Campus, Palacode Main Road, Kadagathur, Dharmapuri – 636 809', '04342-296188'],
  DGL: ['District Collectorate Master Complex, Dindigul – 624 004', '0451-2427498'],
  ERD: ['Govt. ITI Campus, Chennimalai Road, Erode – 638 009', '0424-2275860'],
  KKI: ['No.18/63, Nepal Street, Kallakurichi – 606 202', ''],
  KPM: ['Near District Collector\'s Office Campus, Vishnu Kanchee, Vanthavasy Salai, Kancheepuram – 631 501', '044-27223124'],
  KKM: ['Govt. ITI Campus, Konam, Nagercoil – 629 004, Kanniyakumari', '04652-261191'],
  KRR: ['Survey No. 234B, Kathamparai Village, Manmangalam Taluk, Vennaimalai, Karur – 639 006', '0424-263449'],
  KGI: ['2/67 A, D P Road, Old Pettai, Krishnagiri – 635 001', '04343-236189'],
  MDU: ['Govt. ITI Complex, K.Pudur, Madurai – 625 007', '0452-2566022'],
  MYD: ['Survey No. 344/2B-1D, 2nd Cross Street, Balaji Nagar, Vellagaram (Post), Poompuhar Salai, Mayiladuthurai – 609 001', '04364-299790'],
  NGP: ['Govt. ITI Campus, Nagore High Road, Nagapattinam – 611 003', '04365-221700'],
  NMK: ['Old Civil Court Campus, Opp. to BSNL, Mohanoor Road, Namakkal – 637 001', '04286-222260'],
  NLG: ['4th Block, District Collector Office Campus, Finger Post, Ooty – 643 006', '0423-2444004'],
  PBL: ['Perambalur South, Opp. to District Central Library, Perambalur – 621 220', '04328-275352'],
  PDK: ['Govt. ITI Campus, Trichy High Road, Thirugokarnam Post, Pudukkottai – 622 002', '04322-222287'],
  RMD: ['Master Plan Complex, Pattinam Katthan Village, Near District Collectorate, Ramanathapuram – 623 504', '04567-230160'],
  RPT: ['No.9, Old BSNL Office, Arcot Road, Ranipet – 632 401', '04172-291400'],
  SLM: ['Govt. ITI Campus, Yercaud Road, Gorimedu, Salem – 636 008', '0427-2401045'],
  SVG: ['District Master Plan Complex, Thirupathur Road, Kanchirangal Village, Sivaganga – 630 561', '04575-240435'],
  TKS: ['No.144, 60 Feet Road, Shakthi Nagar, Tenkasi – 627 811', '04633-213179'],
  TNJ: ['Vathalam Road, Govt. ITI Complex, Thanjavur – 613 007', '04362-237037'],
  THN: ['District Collectorate Complex, Theni – 625 531', '04546-254510'],
  TUT: ['No. 97G/4G, Devis Bhavan, Teacher Colony, First East Street, Palayamkottai Road, Thoothukudi – 628 008', '0461-2340159'],
  TRY: ['Kasthuri Hall Road, Bharathidasan Salai, Behind Taluk Office (West), Cantonment, Tiruchirappalli – 620 001', '0431-2422510'],
  TNV: ['District Collectorate Complex, Kokkirakulam, Tirunelveli – 627 009', '0462-2500103'],
  TPR: ['BSNL Office, Government Garden (Near Collector Office), Post Office Road, Tirupathur – 635 601', ''],
  TUP: ['4th Floor, Palladam Road, Rakkiyapalayam, Tiruppur South Taluk, Tiruppur – 641 604', '0421-2971152'],
  TLR: ['Collector Office Campus, Thiruthani Highways, Perumbakkam, Tiruvallur – 602 001', '044-27660250'],
  TVM: ['Near District Collector\'s Office Campus, Vengikkal, Tiruvannamalai – 606 604', '04175-233381'],
  TVR: ['RVL Nagar, Vilamal Post, Mannargudi Road, Thiruvarur – 610 001', '04366-224226'],
  VLR: ['Govt. ITI Campus, Melmonavur Village, Abdullapuram Post, Vellore – 632 010', '0416-2290042'],
  VPM: ['District Collector\'s Office Campus, Behind CEO Office, Trichy High Road, Viluppuram – 605 602', '04146-226417'],
  VNR: ['Govt. ITI Campus, Sulakarai, Virudhunagar – 626 003', '04562-252713'],
};
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
