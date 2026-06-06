/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
