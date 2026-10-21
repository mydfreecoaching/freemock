/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres', 'exceljs', 'sharp', 'jszip'],
  poweredByHeader: false,
};
export default nextConfig;
