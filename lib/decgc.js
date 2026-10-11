/**
 * District Employment & Career Guidance Centres of Tamil Nadu (41 offices) — addresses and phones from
 * tnvelaivaaippu.gov.in / employmentexchange.tn.gov.in "contact_decgc". Five centres show their WhatsApp numbers instead.
 */
const GEN = 'மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம்';
const GEN_EN = 'District Employment and Career Guidance Centre';
// [district code, kind, address (English), telephone, WhatsApp, Tamil address (where available)]
const ROWS = [
  ['CHN', 'gen', 'Integrated Employment Office Building, Women ITI Complex, Guindy, Chennai – 600 032', '044-24615160'],
  ['CHN', 'da', 'Integrated Employment Office Building, Women ITI Complex, Guindy, Chennai – 600 032', '044-22500835'],
  ['CHN', 'prof', 'Integrated Employment Office Building, Women ITI Complex, Guindy, Chennai – 600 032', '044-22501032'],
  ['TLR', 'gen', 'Collector Office Campus, Thiruthani Highways, Perumbakkam, Tiruvallur – 602 001', '044-27660250'],
  ['KPM', 'gen', "Near District Collector's Office Campus, Vishnu Kanchee, Vanthavasy Salai, Kancheepuram – 631 501", '044-27223124'],
  ['TVM', 'gen', "Near District Collector's Office Campus, Vengikkal, Tiruvannamalai – 606 604", '04175-233381'],
  ['VLR', 'gen', 'Govt. ITI Campus, Melmonavur Village, Abdullapuram Post, Vellore – 632 010', '0416-2290042'],
  ['TRY', 'gen', 'Kasthuri Hall Road, Bharathidasan Salai, Behind Taluk Office (West), Cantonment, Tiruchirappalli – 620 001', '0431-2422510'],
  ['TNJ', 'gen', 'Vathalam Road, Govt. ITI Complex, Thanjavur – 613 007', '04362-237037', '919499055905'],
  ['VPM', 'gen', "District Collector's Office Campus, Behind CEO Office, Trichy High Road, Viluppuram – 605 602", '04146-226417'],
  ['CDL', 'gen', 'Govt. ITI Complex, Semmandalam, Cuddalore – 607 001', '04142-290039'],
  ['NGP', 'gen', 'Govt. ITI Campus, Nagore High Road, Nagapattinam – 611 003', '04365-221700'],
  ['TVR', 'gen', 'RVL Nagar, Vilamal Post, Mannargudi Road, Thiruvarur – 610 001', '04366-224226', '919499055915', 'ஆர்.வி.எல். நகர், விளமல் அஞ்சல், மன்னார்குடி சாலை, திருவாரூர் – 610 001'],
  ['PDK', 'gen', 'Govt. ITI Campus, Trichy High Road, Thirugokarnam Post, Pudukkottai – 622 002', '04322-222287'],
  ['KRR', 'gen', 'Survey No. 234B, Kathamparai Village, Manmangalam Taluk, Vennaimalai, Karur – 639 006', '0424-263449'],
  ['PBL', 'gen', 'Perambalur South, Opp. to District Central Library, Perambalur – 621 220', '04328-275352'],
  ['ARL', 'gen', "Near District Collector's Office, Walaja Town, Ariyalur – 621 704", '04329-222111'],
  ['MDU', 'gen', 'Govt. ITI Complex, K.Pudur, Madurai – 625 007', '0452-2566022'],
  ['MDU', 'profexec', 'Govt. ITI Complex, K.Pudur, Madurai – 625 007', '0452-2564343'],
  ['DGL', 'gen', 'District Collectorate Master Complex, Dindigul – 624 004', '0451-2427498'],
  ['THN', 'gen', 'District Collectorate Complex, Theni – 625 531', '04546-254510'],
  ['VNR', 'gen', 'Govt. ITI Campus, Sulakarai, Virudhunagar – 626 003', '04562-252713', '919499055926'],
  ['SVG', 'gen', 'District Master Plan Complex, Thirupathur Road, Kanchirangal Village, Sivaganga – 630 561', '04575-240435', '919499055935'],
  ['RMD', 'gen', 'Master Plan Complex, Pattinam Katthan Village, Near District Collectorate, Ramanathapuram – 623 504', '04567-230160'],
  ['TNV', 'gen', 'District Collectorate Complex, Kokkirakulam, Tirunelveli – 627 009', '0462-2500103'],
  ['TUT', 'gen', 'No. 97G/4G, Devis Bhavan, Teacher Colony, First East Street, Palayamkottai Road, Thoothukudi – 628 008', '0461-2340159'],
  ['KKM', 'gen', 'Govt. ITI Campus, Konam, Nagercoil – 629 004, Kanniyakumari', '04652-261191'],
  ['CBE', 'gen', 'Govt. ITI Complex, Thudiyalur, Mettupalayam Road, Coimbatore – 641 029', '0422-2642388'],
  ['TUP', 'gen', '4th Floor, Palladam Road, Rakkiyapalayam, Tiruppur South Taluk, Tiruppur – 641 604', '0421-2971152'],
  ['NLG', 'gen', '4th Block, District Collector Office Campus, Finger Post, Ooty – 643 006', '0423-2444004'],
  ['SLM', 'gen', 'Govt. ITI Campus, Yercaud Road, Gorimedu, Salem – 636 008', '0427-2401045'],
  ['NMK', 'gen', 'Old Civil Court Campus, Opp. to BSNL, Mohanoor Road, Namakkal – 637 001', '04286-222260'],
  ['ERD', 'gen', 'Govt. ITI Campus, Chennimalai Road, Erode – 638 009', '0424-2275860'],
  ['DPI', 'gen', 'Govt. ITI Campus, Palacode Main Road, Kadagathur, Dharmapuri – 636 809', '04342-296188'],
  ['KGI', 'gen', '2/67 A, D P Road, Old Pettai, Krishnagiri – 635 001', '04343-236189'],
  ['TPR', 'gen', 'BSNL Office, Government Garden (Near Collector Office), Post Office Road, Tirupathur – 635 601', ''],
  ['CGL', 'gen', 'BSNL Office, Government ITI Campus, Chengalpattu – 603 111', '044-27426020'],
  ['RPT', 'gen', 'No. 9, Old BSNL Office, Arcot Road, Ranipet – 632 401', '04172-291400'],
  ['MYD', 'gen', 'Survey No. 344/2B-1D, 2nd Cross Street, Balaji Nagar, Vellagaram (Post), Poompuhar Salai, Mayiladuthurai – 609 001', '04364-299790', '919499055904', '2-வது குறுக்குத் தெரு, பாலாஜி நகர், வெள்ளக்கரம் அஞ்சல், பூம்புகார் சாலை, மயிலாடுதுறை – 609 001'],
  ['KKI', 'gen', 'No. 18/63, Nepal Street, Kallakurichi – 606 202', ''],
  ['TKS', 'gen', 'No. 144, 60 Feet Road, Shakthi Nagar, Tenkasi – 627 811', '04633-213179'],
];
import { DISTRICT_LIST } from './util';
const D = Object.fromEntries(DISTRICT_LIST.map(([ta, en, code]) => [code, { ta, en }]));
const TITLE = {
  gen: (d) => [`${GEN}, ${D[d].ta}`, `${GEN_EN}, ${D[d].en}`],
  da: () => ['மாற்றுத்திறனாளிகளுக்கான சிறப்பு வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், சென்னை', 'Special Employment and Career Guidance Centre for Differently Abled, Chennai'],
  prof: () => ['தொழில்முறை வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், சென்னை', 'Professional Employment and Career Guidance Centre, Chennai'],
  profexec: () => ['தொழில்முறை மற்றும் நிர்வாகப் பணி வேலைவாய்ப்பு அலுவலகம், மதுரை', 'Professional and Executive Employment Office, Madurai'],
};
const fmtWa = (w) => `+91 ${w.slice(2, 7)} ${w.slice(7)}`;
/** All 41 offices: { no, code, district, districtEn, kind, title, titleEn, address, addressTa, phone, wa, waLabel } */
export const DECGC_OFFICES = ROWS.map(([code, kind, address, phone, wa, addressTa], i) => {
  const [title, titleEn] = TITLE[kind](code);
  return { no: i + 1, code, district: D[code].ta, districtEn: D[code].en, kind, title, titleEn, address, addressTa: addressTa || '', phone: wa ? '' : phone, wa: wa || '', waLabel: wa ? fmtWa(wa) : '' };
});
/** The general centre of a district (by 3-letter code). */
export const decgcOf = (code) => DECGC_OFFICES.find((o) => o.code === code && o.kind === 'gen') || null;
