import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Registration and payment evidence can include image/PDF uploads (up to 10MB each).
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
