import { sql } from './db';
import { parsePhoto } from './photo';

/**
 * Faculty passport photo + teaching experience (years, and where they have taught / trained).
 * Asked at registration; faculty registered earlier must fill it in after login before using their page.
 */
const clean = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);

/** Validate the experience fields (+ photo unless `hasPhoto`). Returns { values, photo } or { error }. */
export function parseFacultyProfile(b, { hasPhoto = false } = {}) {
  const y = String(b.exp_years ?? '').trim();
  const years = Number(y);
  if (y === '' || !Number.isFinite(years) || years < 0 || years > 60) return { error: 'கற்பித்தல் / பயிற்சி அனுபவத்தை ஆண்டுகளில் உள்ளிடவும் (0 – 60).' };
  const places = String(b.exp_places || '').replace(/[ \t]+/g, ' ').trim().slice(0, 1000);
  if (places.length < 3) return { error: 'பயிற்சி நடத்திய / பாடம் கற்பித்த இடங்களை உள்ளிடவும்.' };
  let photo = null;
  if (b.photo || !hasPhoto) {
    photo = parsePhoto(b);
    if (photo.error) return { error: photo.error };
  }
  return { values: { exp_years: Math.round(years * 10) / 10, exp_places: places }, photo };
}

export async function saveFacultyProfile(id, { values, photo }) {
  await sql`UPDATE faculty SET exp_years=${values.exp_years}, exp_places=${values.exp_places}, profile_at=now() WHERE id=${id}`;
  if (photo) await sql`INSERT INTO faculty_photos (faculty_id, photo, thumb) VALUES (${id}, ${photo.photo}, ${photo.thumb})
    ON CONFLICT (faculty_id) DO UPDATE SET photo=EXCLUDED.photo, thumb=EXCLUDED.thumb, updated_at=now()`;
}

/** Faculty row with has_photo / photo_v. */
export async function facultyWithProfile(id) {
  const [f] = await sql`SELECT f.*, p.updated_at IS NOT NULL AS has_photo, EXTRACT(EPOCH FROM p.updated_at)::bigint AS photo_v
    FROM faculty f LEFT JOIN faculty_photos p ON p.faculty_id=f.id WHERE f.id=${id}`;
  return f;
}
export const facultyProfileMissing = (f) => !f?.has_photo || f.exp_years == null || !f.exp_places;
export const facultyPhotoUrl = (id, v, thumb = false) => `/api/faculty-photo/${id}?${thumb ? 't=1&' : ''}v=${v || 0}`;
export { clean };
