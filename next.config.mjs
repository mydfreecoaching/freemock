/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres', 'exceljs', 'sharp', 'jszip', 'qrcode'],
  poweredByHeader: false,
  // Android app (Trusted Web Activity) verification – served from env vars, see app/api/assetlinks
  async rewrites() { return [{ source: '/.well-known/assetlinks.json', destination: '/api/assetlinks' }]; },
};
export default nextConfig;
