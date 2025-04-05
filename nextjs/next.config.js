/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true,
  },
  webpack(config) {
    // This config allows properly importing SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost/api/:path*', // Proxy to Backend API
      },
      {
        source: '/sanctum/:path*',
        destination: 'http://localhost/sanctum/:path*', // Proxy to Backend Sanctum endpoints
      },
    ];
  },
};

module.exports = nextConfig;