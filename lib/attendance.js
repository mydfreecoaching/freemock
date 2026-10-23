import { venueOptions, VENUE_LABEL } from './venues';

/**
 * Coaching-class attendance (students mark it themselves on the day of the class).
 * Mon–Fri: DECGC Thiruvarur / Mayiladuthurai. Sat & Sun: the 10 Thiruvarur venues, Mayiladuthurai Collectorate.
 */
export const ATT_DISTRICTS = [['TVR', 'திருவாரூர் / Thiruvarur'], ['MYD', 'மயிலாடுதுறை / Mayiladuthurai']];
const WEEKDAYS = [1, 2, 3, 4, 5], WEEKEND = [6, 0];
export function classDays(venue) {
  if (venue === 'TVR_DECGC' || venue === 'MYD_DECGC') return WEEKDAYS;
  if (venue === 'MYD_COLL' || /^TVC([1-9]|10)$/.test(venue || '')) return WEEKEND;
  return [];
}
export const DAYS_TEXT = (venue) => (classDays(venue) === WEEKDAYS ? 'திங்கள் – வெள்ளி' : classDays(venue).length ? 'சனி & ஞாயிறு' : '');
/** Today's date in India, 'YYYY-MM-DD'. */
export const istToday = (now = Date.now()) => new Date(now + 5.5 * 3600e3).toISOString().slice(0, 10);
const dow = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();
export const hasClassOn = (venue, day) => classDays(venue).includes(dow(day));
/** Venues of a district that hold classes: [{ code, title, days }] */
export const attVenues = (dcode) => venueOptions(dcode).filter((o) => classDays(o.code).length).map((o) => ({ code: o.code, title: o.title, days: DAYS_TEXT(o.code) }));
export const venueTitle = (code) => VENUE_LABEL(code);
const TA_DAY = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
export const dayName = (day) => TA_DAY[dow(day)];
export const fmtDay = (day) => { const [y, m, d] = day.split('-'); return `${d}.${m}.${y}`; };
