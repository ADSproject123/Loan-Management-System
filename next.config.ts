import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Registration and payment evidence can include image/PDF uploads (up to 10MB each).
      bodySizeLimit: "25mb",
    },
    // Always refetch dynamic pages on client-side navigation so members see
    // up-to-date statuses (e.g. a saving the admin just verified) without a
    // manual hard refresh. Without this, the client Router Cache serves stale
    // prefetched RSC for dynamic routes.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
