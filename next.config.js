const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/affiliate',
        destination: '/affiliates',
        permanent: true,
      },
    ]
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
