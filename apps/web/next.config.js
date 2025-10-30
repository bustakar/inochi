/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure PostCSS is processed correctly
  experimental: {
    // Turbopack should handle PostCSS automatically, but we ensure it's enabled
  },
};

module.exports = nextConfig;
