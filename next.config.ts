import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: ["@react-pdf/renderer", "bcryptjs"],
  // The PDF reports embed the logo, read from disk at runtime
  outputFileTracingIncludes: {
    "/api/reports/*": ["./public/brand/logo-mark.png"],
  },
  // Uploaded files (local storage driver) must never be bundled into functions
  outputFileTracingExcludes: {
    "/*": ["./storage/**/*", "./prisma/sample-assets/**/*"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
