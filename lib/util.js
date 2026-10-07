const _D = [
  ['அரியலூர்', 'Ariyalur', 'ARL'], ['செங்கல்பட்டு', 'Chengalpattu', 'CGL'], ['சென்னை', 'Chennai', 'CHN'],
  ['கோயம்புத்தூர்', 'Coimbatore', 'CBE'], ['கடலூர்', 'Cuddalore', 'CDL'], ['தருமபுரி', 'Dharmapuri', 'DPI'],
  ['திண்டுக்கல்', 'Dindigul', 'DGL'], ['ஈரோடு', 'Erode', 'ERD'], ['கள்ளக்குறிச்சி', 'Kallakurichi', 'KKI'],
  ['காஞ்சிபுரம்', 'Kancheepuram', 'KPM'], ['கன்னியாகுமரி', 'Kanniyakumari', 'KKM'], ['கரூர்', 'Karur', 'KRR'],
  ['கிருஷ்ணகிரி', 'Krishnagiri', 'KGI'], ['மதுரை', 'Madurai', 'MDU'], ['மயிலாடுதுறை', 'Mayiladuthurai', 'MYL'],
  ['நாகப்பட்டினம்', 'Nagapattinam', 'NGP'], ['நாமக்கல்', 'Namakkal', 'NMK'], ['நீலகிரி', 'Nilgiris', 'NLG'],
  ['பெரம்பலூர்', 'Perambalur', 'PBL'], ['புதுக்கோட்டை', 'Pudukkottai', 'PDK'], ['இராமநாதபுரம்', 'Ramanathapuram', 'RMD'],
  ['இராணிப்பேட்டை', 'Ranipet', 'RPT'], ['சேலம்', 'Salem', 'SLM'], ['சிவகங்கை', 'Sivaganga', 'SVG'],
  ['தென்காசி', 'Tenkasi', 'TKS'], ['தஞ்சாவூர்', 'Thanjavur', 'TNJ'], ['தேனி', 'Theni', 'THN'],
  ['தூத்துக்குடி', 'Thoothukudi', 'TUT'], ['திருச்சிராப்பள்ளி', 'Tiruchirappalli', 'TRY'], ['திருநெல்வேலி', 'Tirunelveli', 'TNV'],
  ['திருப்பத்தூர்', 'Tirupathur', 'TPR'], ['திருப்பூர்', 'Tiruppur', 'TUP'], ['திருவள்ளூர்', 'Tiruvallur', 'TLR'],
  ['திருவண்ணாமலை', 'Tiruvannamalai', 'TVM'], ['திருவாரூர்', 'Thiruvarur', 'TVR'], ['வேலூர்', 'Vellore', 'VLR'],
  ['விழுப்புரம்', 'Viluppuram', 'VPM'], ['விருதுநகர்', 'Virudhunagar', 'VNR'],
];
/** Our centres' region first, then the other districts A–Z (English), then other states. */
const FIRST = ['MYL', 'TVR', 'NGP', 'TNJ', 'TRY', 'CDL', 'ARL', 'PBL'];
export const DISTRICT_LIST = [
  ...FIRST.map((c) => _D.find((d) => d[2] === c)),
  ..._D.filter((d) => !FIRST.includes(d[2])).sort((a, b) => a[1].localeCompare(b[1])),
  ['பிற மாநிலம்', 'Other State', 'OTH'],
];
export const DISTRICT_FIRST_COUNT = FIRST.length;
/** Stored value = Tamil name (existing records use it). Reg. No. prefix is the 3-letter code. */
export const DISTRICTS = DISTRICT_LIST.map((d) => d[0]);
export const PREFIX = Object.fromEntries(DISTRICT_LIST.map((d) => [d[0], d[2]]));
export const DISTRICT_EN = Object.fromEntries(DISTRICT_LIST.map((d) => [d[0], d[1]]));
export const SECTIONS = { 'தமிழ்': 'பொதுத்தமிழ்', GS: 'பொது அறிவு', APT: 'திறனறிவு & காரணவியல்' };
const IST = { timeZone: 'Asia/Kolkata' };
export const fmt = (d) => new Date(d).toLocaleString('en-IN', { ...IST, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { ...IST, day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
/** 'YYYY-MM-DDTHH:mm' (IST, from <input type=datetime-local>) -> Date */
export const fromIST = (s) => new Date(`${s}:00+05:30`);
/** Date -> 'YYYY-MM-DDTHH:mm' in IST for datetime-local inputs */
export const toISTInput = (d) => {
  const t = new Date(new Date(d).getTime() + 330 * 60000);
  return t.toISOString().slice(0, 16);
};
export function testStatus(t, now = new Date()) {
  if (now < new Date(t.start_at)) return 'upcoming';
  if (now > new Date(t.end_at)) return 'closed';
  return 'open';
}

export const GENDERS = [['M', 'ஆண் / Male'], ['F', 'பெண் / Female'], ['O', 'மற்றவர் / Others']];
export const COMMUNITIES = ['OC', 'BC', 'MBC / DNC', 'BCM', 'SC', 'ST', 'SCA'];
export const PRIORITIES = [['DA', 'மாற்றுத்திறனாளி / Differently abled'], ['PSTM', 'தமிழ் வழியில் பயின்றோர் / PSTM'], ['DW', 'ஆதரவற்ற விதவை / Destitute widow'], ['ESM', 'முன்னாள் படைவீரர் / Ex-servicemen'], ['OTHER', 'பிற / Any other']];
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map(([k, l]) => [k, l.split(' / ')[1]]));
export const GENDER_LABEL = { M: 'Male', F: 'Female', O: 'Others' };
