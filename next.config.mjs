/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres', 'exceljs', 'sharp', 'jszip', 'qrcode'],
  poweredByHeader: false,
};
export default nextConfig;
