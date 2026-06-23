/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pg/better-auth são pacotes server-only.
    serverComponentsExternalPackages: ['pg', 'better-auth'],
  },
};

export default nextConfig;
