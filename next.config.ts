import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (default di Next.js 16) dengan root eksplisit
  turbopack: {
    root: process.cwd(),
  },
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@tabler/icons-react", "@reduxjs/toolkit"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "open-api.delcom.org" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
