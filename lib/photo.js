import { sql } from './db';
import { photoSkipActive } from './auth';

/** Passport photo: resized in the browser to 300×386 JPEG (+ 105×135 thumbnail) and sent as data URLs. */
const LIMIT = { photo: 200 * 1024, thumb: 40 * 1024 };
function decode(v, kind) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(v || ''));
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length < 500 || buf.length > LIMIT[kind] || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // JPEG magic
  return buf;
}
/** Returns { photo, thumb } buffers, or { error }. */
export function parsePhoto(b) {
  const photo = decode(b.photo, 'photo'), thumb = decode(b.photo_thumb, 'thumb');
  if (!photo || !thumb) return { error: 'பாஸ்போர்ட் அளவு புகைப்படத்தைப் பதிவேற்றவும் / Upload your passport-size photo.' };
  return { photo, thumb };
}
export async function savePhoto(sid, { photo, thumb }) {
  await sql`INSERT INTO student_photos (student_id, photo, thumb) VALUES (${sid}, ${photo}, ${thumb})
    ON CONFLICT (student_id) DO UPDATE SET photo=EXCLUDED.photo, thumb=EXCLUDED.thumb, updated_at=now()`;
}
/** Student row plus has_photo / photo_v (cache-buster). */
export async function studentWithPhoto(sid) {
  const [me] = await sql`SELECT s.*, p.updated_at IS NOT NULL AS has_photo, EXTRACT(EPOCH FROM p.updated_at)::bigint AS photo_v
    FROM students s LEFT JOIN student_photos p ON p.student_id=s.id WHERE s.id=${sid}`;
  if (me) me.photo_waived = !me.has_photo && (await photoSkipActive());
  return me;
}
export const photoUrl = (id, v, thumb = false) => `/api/photo/${id}?${thumb ? 't=1&' : ''}v=${v || 0}`;
