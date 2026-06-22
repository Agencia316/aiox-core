'use strict';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'whatsapp-web.js', 'qrcode-terminal'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
        'whatsapp-web.js': 'commonjs whatsapp-web.js',
        'qrcode-terminal': 'commonjs qrcode-terminal',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        bufferutil: 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
