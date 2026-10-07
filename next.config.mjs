/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres', 'exceljs'],
  poweredByHeader: false,
};
export default nextConfig;
