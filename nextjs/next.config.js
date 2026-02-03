/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow large file uploads through API proxy
  experimental: {
    proxyTimeout: 300000, // 5 minutes
    instrumentationHook: true, // Enable MSW instrumentation
  },
  // Transpile shared package from parent directory
  transpilePackages: ['@inkedin/shared', 'react-markdown'],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
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

    // Enable polling for hot reload in Docker on macOS
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };

    return config;
  },
  async rewrites() {
    // Disable rewrites when MSW mocking is enabled (for testing)
    if (process.env.NEXT_PUBLIC_MSW_ENABLED === 'true') {
      console.log('MSW enabled - API rewrites disabled');
      return [];
    }

    // Use the environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

    console.log('API URL for rewrites:', apiUrl);

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // Proxy to Backend API
      },
      {
        source: '/sanctum/:path*',
        destination: `${apiUrl}/sanctum/:path*`, // Proxy to Backend Sanctum endpoints
      },
    ];
  },
};

module.exports = nextConfig;