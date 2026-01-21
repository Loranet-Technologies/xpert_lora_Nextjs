import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed turbopack.root since we're already in the frontend directory
  // Turbopack will use the current directory as root by default
};

export default nextConfig;
