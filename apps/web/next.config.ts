import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@crypto-screener/shared'],
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
};

export default nextConfig;
