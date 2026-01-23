import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */ images: {
    qualities: [100, 75],
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
