import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Keep: prevents scratch/*.ts files from blocking builds
  },
};

export default nextConfig;
