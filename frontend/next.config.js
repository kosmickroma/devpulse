/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    return Date.now().toString()
  },
}

module.exports = nextConfig
