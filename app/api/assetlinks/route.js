/**
 * Digital Asset Links for the Play Store app (Trusted Web Activity), served at /.well-known/assetlinks.json.
 * Set in Vercel → Settings → Environment Variables:
 *   TWA_PACKAGE  – the Android package id, e.g. app.vercel.tnpscfreemock.twa
 *   TWA_SHA256   – SHA-256 certificate fingerprint(s), comma separated (upload key and Play app-signing key)
 */
export const dynamic = 'force-dynamic';
export function GET() {
  const pkg = (process.env.TWA_PACKAGE || '').trim();
  const fps = (process.env.TWA_SHA256 || '').split(/[,\s]+/).map((x) => x.trim().toUpperCase()).filter((x) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(x));
  const body = pkg && fps.length ? [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fps } }] : [];
  return new Response(JSON.stringify(body, null, 2), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' } });
}
