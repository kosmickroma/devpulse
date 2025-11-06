/** @type {import('next').NextConfig} */
// Force fresh deployment - 2025-01-05
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    return Date.now().toString()
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
