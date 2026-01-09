/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile shared package from parent directory
  transpilePackages: ['@inkedin/shared'],
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
    // For production, use the hardcoded URL to ensure it works
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.inkedin.dev'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    
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