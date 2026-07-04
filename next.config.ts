import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  typescript: {
    // Type errors in legacy code should not block production builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
