import { sql } from '@/lib/db';

/** Question picture: /qimg/<id>.webp – immutable (id = content hash), so browsers and the CDN cache it for a year. */
export async function GET(_req, { params }) {
  const id = String((await params).file || '').replace(/\.webp$/, '');
  if (!/^[0-9a-f]{8,40}$/.test(id)) return new Response('Not found', { status: 404 });
  const [r] = await sql`SELECT mime, data FROM qimages WHERE id=${id}`;
  if (!r) return new Response('Not found', { status: 404 });
  return new Response(r.data, { headers: { 'content-type': r.mime, 'cache-control': 'public, max-age=31536000, s-maxage=31536000, immutable' } });
}
