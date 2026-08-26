/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow large file uploads through API proxy
  experimental: {
    proxyTimeout: 300000, // 5 minutes
    instrumentationHook: true, // Enable MSW instrumentation
  },
  // Transpile shared package from parent directory
  transpilePackages: ['@inkedin/shared', 'react-markdown', '@mui/x-date-pickers'],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'inked-in.imgix.net',
      },
      {
        protocol: 'https',
        hostname: 'inked-in-images.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'inked-in-images.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'dd2gdmvaew6fu.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'inked-in.imgix.net',
      },
    ],
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
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
    ];
  },
  async redirects() {
    // Two studio slugs predate centralized slug generation and were
    // normalized so every studio follows one convention before nested studio
    // URLs shipped. These keep every link already in the world working -
    // without them the only real shops on the platform 404 on their own URL.
    const renamed = {
      tattoocolosseum: 'tattoo-colosseum',
      reidstudios: 'reid-studios',
    };

    return Object.entries(renamed).flatMap(([from, to]) => [
      {
        source: `/studios/${from}`,
        destination: `/studios/${to}`,
        permanent: true,
      },
      {
        // Guides and news live beneath the studio, so they move with it.
        source: `/studios/${from}/:path*`,
        destination: `/studios/${to}/:path*`,
        permanent: true,
      },
    ]);
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