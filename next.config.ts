import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the ngrok tunnel used for Telegram webhook testing to reach dev
  // resources (HMR, etc.). Update this if the ngrok URL changes.
  allowedDevOrigins: ["d46b-96-9-79-118.ngrok-free.app"],
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
