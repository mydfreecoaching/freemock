export const DISTRICTS = ['மயிலாடுதுறை', 'திருவாரூர்'];
export const PREFIX = { 'மயிலாடுதுறை': 'MYL', 'திருவாரூர்': 'TVR' };
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
