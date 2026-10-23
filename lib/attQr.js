import crypto from 'node:crypto';
import { ATT_DISTRICTS, attVenues } from './attendance';

/** Printed QR per coaching venue: /att/<token>. The token is a keyed hash of the venue code (cannot be guessed). */
const SECRET = () => process.env.SESSION_SECRET || 'dev-secret-change-me';
export const venueToken = (venue) => crypto.createHmac('sha256', SECRET()).update(`att:${venue}`).digest('base64url').slice(0, 16);
export function venueFromToken(tok) {
  for (const [d] of ATT_DISTRICTS) for (const v of attVenues(d)) if (venueToken(v.code) === tok) return { ...v, district: d };
  return null;
}
