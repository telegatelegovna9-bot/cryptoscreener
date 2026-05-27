import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@crypto-screener/shared'],
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
