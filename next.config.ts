import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos are resized in the browser before upload, so request bodies stay small.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
