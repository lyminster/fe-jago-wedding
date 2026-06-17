import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    devtoolSegmentExplorer: false,
  },
  images: {
    remotePatterns: [
      {
        hostname: "localhost",
        port: "8080",
        protocol: "http",
      },
    ],
  },
};

export default nextConfig;
