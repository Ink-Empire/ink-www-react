/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true,
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