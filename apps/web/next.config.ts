import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@crypto-screener/shared"],
  reactStrictMode: true,
  images: {
    domains: ["assets.coingecko.com"],
  },
  webpack: (config) => {
    config.resolve.alias["@crypto-screener/shared"] = path.resolve(
      __dirname,
      "../../packages/shared/src/index.ts"
    );
    return config;
  },
};

export default nextConfig;
