import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader'
    })
    return config
  }
};

export default nextConfig;
