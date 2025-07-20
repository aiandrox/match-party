/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // Modern JavaScript optimization - uses .browserslistrc automatically
  // SWC minifier is enabled by default in Next.js 15
}

module.exports = withBundleAnalyzer(nextConfig)